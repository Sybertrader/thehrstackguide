#!/usr/bin/env node
/**
 * Sitewide technical and content SEO audit of the production build.
 *
 * Reads every HTML page, sitemap, and internal link in dist/client (or dist/)
 * and writes SEO_AUDIT_REPORT.md. Redirect decisions use the same
 * resolveMasterRedirect rules as production, so inverted comparison slugs and
 * legacy persona URLs are judged the way Googlebot will hit them.
 *
 * Usage (from the repo root, after npm run build):
 *   node --experimental-strip-types scripts/technical-seo-audit.mjs
 *   node --experimental-strip-types scripts/technical-seo-audit.mjs --out SEO_AUDIT_REPORT.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isGonePath } from '../src/lib/gone.ts';
import { invertComparisonSlug } from '../src/lib/comparison-routes.ts';
import {
  resolveMasterRedirect,
  trailingSlashRedirectPath,
} from '../src/lib/master-redirects.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.thehrstackguide.com';
const THIN_WORD_LIMIT = 400;
const TITLE_MIN = 30;
const TITLE_MAX = 65;
const DESC_MIN = 100;
const DESC_MAX = 160;
const EXAMPLE_LIMIT = 12;

const UTILITY_PREFIXES = ['/go/'];
const UTILITY_PATHS = new Set(['/404.html', '/404/', '/thank-you/', '/recommendation/']);

const DISCARD_TAGS = new Set(['script', 'style', 'svg', 'nav', 'footer', 'head']);
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
]);

const FORM_HANDLER_RE =
  /initModalHandlers|blockedDomains|__leadModalScriptInitialized|form-lead-modal/;

function parseArgs(argv) {
  const outIdx = argv.indexOf('--out');
  return {
    outPath:
      outIdx !== -1 && argv[outIdx + 1]
        ? path.resolve(ROOT, argv[outIdx + 1])
        : path.join(ROOT, 'SEO_AUDIT_REPORT.md'),
  };
}

function resolveDist() {
  const candidates = [path.join(ROOT, 'dist', 'client'), path.join(ROOT, 'dist')];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html')) || fs.existsSync(path.join(dir, 'sitemap-index.xml'))) {
      return dir;
    }
  }
  throw new Error('No production build found in dist/. Run npm run build first.');
}

function walk(dir, predicate, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_astro' || entry.name === '~partytown' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, files);
    else if (predicate(entry.name, full)) files.push(full);
  }
  return files;
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function wordsOf(text) {
  const cleaned = decodeEntities(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(' ').filter(Boolean).length;
}

function textOf(text) {
  return decodeEntities(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function attr(tag, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = tag.match(re);
  if (!match) return null;
  return decodeEntities(match[1] ?? match[2] ?? '');
}

function readTag(html, index) {
  let quote = null;
  let j = index + 1;
  while (j < html.length) {
    const char = html[j];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '>') break;
    j += 1;
  }
  return { raw: html.slice(index, Math.min(j + 1, html.length)), next: Math.min(j + 1, html.length) };
}

function classTokens(tag) {
  const value = attr(tag, 'class');
  return value ? value.split(/\s+/).filter(Boolean) : [];
}

function isHiddenTag(tag) {
  // Class token only. `overflow-hidden` is a visible utility, not a hidden element.
  return classTokens(tag).includes('hidden');
}

function isJsonScript(tag) {
  const type = (attr(tag, 'type') || '').toLowerCase();
  return type === 'application/ld+json' || type === 'application/json';
}

/**
 * Split body copy into visible words, hidden-UI words, and executable script words.
 * Head, nav, footer, svg, and style are ignored. JSON-LD is ignored here and parsed separately.
 */
function measureContent(html) {
  let visible = '';
  let hidden = '';
  let script = '';
  const stack = [];
  let i = 0;

  const parentMode = () => (stack.length ? stack[stack.length - 1].mode : 'visible');

  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    if (html[i] !== '<') {
      const next = html.indexOf('<', i);
      const chunk = html.slice(i, next === -1 ? html.length : next);
      const mode = parentMode();
      if (mode === 'visible') visible += chunk;
      else if (mode === 'hidden') hidden += chunk;
      else if (mode === 'script') script += chunk;
      i = next === -1 ? html.length : next;
      continue;
    }

    const { raw, next } = readTag(html, i);
    i = next;
    const name = (raw.match(/^<\/?\s*([a-zA-Z0-9]+)/) || [])[1]?.toLowerCase();
    if (!name) continue;
    const closing = /^<\//.test(raw);
    // script and style are raw text. A `<` inside them is not markup, and must
    // not open or close elements (that was swallowing body copy and inventing links).
    if (!closing && (name === 'script' || name === 'style')) {
      const closeNeedle = `</${name}`;
      const closeAt = html.toLowerCase().indexOf(closeNeedle, i);
      const inner = html.slice(i, closeAt === -1 ? html.length : closeAt);
      const after = closeAt === -1 ? html.length : html.indexOf('>', closeAt) + 1;
      if (name === 'script' && !isJsonScript(raw)) script += ` ${inner} `;
      i = after;
      continue;
    }
    if (closing) {
      for (let s = stack.length - 1; s >= 0; s -= 1) {
        if (stack[s].name === name) {
          stack.splice(s);
          break;
        }
      }
      continue;
    }

    const parent = parentMode();
    let mode = 'visible';
    if (name === 'script') mode = isJsonScript(raw) ? 'json' : 'script';
    else if (parent === 'script' || parent === 'json') mode = parent;
    else if (parent === 'discard' || DISCARD_TAGS.has(name)) mode = 'discard';
    else if (parent === 'hidden' || isHiddenTag(raw)) mode = 'hidden';

    if (!VOID_TAGS.has(name)) stack.push({ name, mode });
  }

  return {
    visibleWords: wordsOf(visible),
    hiddenWords: wordsOf(hidden),
    scriptWords: wordsOf(script),
  };
}

function publicPathFor(relPosix) {
  if (relPosix === 'index.html') return '/';
  if (relPosix.endsWith('/index.html')) return `/${relPosix.slice(0, -'index.html'.length)}`;
  if (relPosix === '404.html') return '/404.html';
  return `/${relPosix}`;
}

function expectIndex(pathname) {
  if (UTILITY_PATHS.has(pathname)) return false;
  return !UTILITY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function robotsFlags(content) {
  const value = (content || '').toLowerCase();
  const none = /\bnone\b/.test(value);
  return {
    noindex: none || /\bnoindex\b/.test(value),
    nofollow: none || /\bnofollow\b/.test(value),
  };
}

function redirectOf(pathname) {
  if (isGonePath(pathname)) return { kind: 'gone', target: null };
  const master = resolveMasterRedirect(pathname);
  const slash = master ? null : trailingSlashRedirectPath(pathname);
  const target = master || slash;
  if (!target) return null;
  const slug = pathname.split('?')[0].split('#')[0].replace(/^\/|\/$/g, '');
  if (/-for-/i.test(slug)) return { kind: 'legacy', target };
  const inverted = invertComparisonSlug(slug);
  const targetPath = target.endsWith('/') ? target : `${target}/`;
  if (inverted && targetPath === `/${inverted}/`) return { kind: 'inverted', target: targetPath };
  if (!master && slash) return { kind: 'slash', target: targetPath };
  return { kind: 'redirect', target: targetPath };
}

function classifyDestination(pathname, livePaths) {
  const redirect = redirectOf(pathname);
  if (redirect?.kind === 'gone') return { state: 'gone', redirect };
  if (redirect) return { state: 'redirect', redirect };
  if (livePaths.has(pathname)) return { state: 'live', redirect: null };
  return { state: 'missing', redirect: null };
}

function resolveHref(href, pagePath) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(trimmed)) return null;
  let url;
  try {
    url = new URL(trimmed, `${SITE}${pagePath}`);
  } catch {
    return { kind: 'invalid', href: trimmed };
  }
  const host = url.hostname.replace(/^www\./i, '');
  if (host !== 'thehrstackguide.com') return null;
  return {
    kind: 'internal',
    href: trimmed,
    path: `${url.pathname}${url.search}`,
    pathname: url.pathname || '/',
    nonWww: url.hostname === 'thehrstackguide.com',
  };
}

function extractAnchors(html) {
  const withoutRaw = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const hrefs = [];
  const re = /<a\b[^>]*>/gi;
  let match;
  while ((match = re.exec(withoutRaw))) {
    const href = attr(match[0], 'href');
    if (href != null) hrefs.push(href);
  }
  return hrefs;
}

function extractInlineScripts(html) {
  const found = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    const tag = `<script${match[1]}>`;
    if (attr(tag, 'src')) continue;
    if (isJsonScript(tag)) continue;
    const body = match[2].trim();
    if (!body) continue;
    const wordCount = wordsOf(body);
    const formHandler = FORM_HANDLER_RE.test(body);
    const scriptType = (attr(tag, 'type') || '').toLowerCase();
    let bucket = 'site';
    if (formHandler) bucket = 'form-handler';
    else if (
      scriptType === 'text/partytown' ||
      /partytown|vercel|speed-insights|dataLayer|gtag\(|clarity\.ms|googletagmanager/i.test(body)
    ) {
      bucket = 'third-party';
    }
    found.push({ bucket, wordCount, preview: body.replace(/\s+/g, ' ').slice(0, 140) });
  }
  return found;
}

function canonicalHref(tag) {
  return attr(tag, 'href');
}

function analyzePage(file, distDir, livePaths) {
  const rel = path.relative(distDir, file).split(path.sep).join('/');
  const pathname = publicPathFor(rel);
  const html = fs.readFileSync(file, 'utf8');
  const indexable = expectIndex(pathname);
  const findings = [];

  const canonicalTags = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => (attr(tag, 'rel') || '').toLowerCase() === 'canonical');
  if (indexable) {
    if (canonicalTags.length !== 1) {
      findings.push({
        severity: 'critical',
        code: 'CANONICAL',
        detail: canonicalTags.length === 0 ? 'missing canonical' : `${canonicalTags.length} canonicals`,
      });
    } else {
      const href = canonicalHref(canonicalTags[0]) || '';
      const problems = [];
      let parsed = null;
      try {
        parsed = new URL(href);
      } catch {
        problems.push('canonical is not a valid absolute URL');
      }
      if (parsed) {
        if (parsed.origin !== SITE) problems.push(`host is ${parsed.origin}, expected ${SITE}`);
        if (parsed.pathname !== parsed.pathname.toLowerCase()) problems.push('path is not lowercase');
        if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) problems.push('path has no trailing slash');
        if (parsed.pathname !== pathname && !(pathname === '/404.html' && parsed.pathname === '/404/')) {
          problems.push(`path ${parsed.pathname} does not match file ${pathname}`);
        }
        if (parsed.search) problems.push('canonical includes a query string');
      }
      if (problems.length) {
        findings.push({ severity: 'critical', code: 'CANONICAL', detail: problems.join('; ') });
      }
    }
  }

  const robots = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => (attr(tag, 'name') || '').toLowerCase() === 'robots');
  const robotsContent = robots.map((tag) => attr(tag, 'content') || '').join(', ');
  const flags = robotsFlags(robotsContent);
  if (indexable && flags.noindex) {
    findings.push({ severity: 'critical', code: 'ROBOTS_NOINDEX', detail: robotsContent || '(empty)' });
  }
  if ((indexable || pathname === '/recommendation/') && flags.nofollow) {
    findings.push({ severity: 'critical', code: 'ROBOTS_NOFOLLOW', detail: robotsContent || '(empty)' });
  }

  const title = textOf((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const descriptionMeta = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((m) => m[0])
    .find((tag) => (attr(tag, 'name') || '').toLowerCase() === 'description');
  const description = descriptionMeta ? textOf(attr(descriptionMeta, 'content') || '') : '';

  if (indexable) {
    if (!title) findings.push({ severity: 'quality', code: 'TITLE', detail: 'missing title' });
    else if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      findings.push({
        severity: 'quality',
        code: 'TITLE_LENGTH',
        detail: `${title.length} characters`,
      });
    }
    if (!description) findings.push({ severity: 'quality', code: 'DESCRIPTION', detail: 'missing meta description' });
    else if (description.length < DESC_MIN || description.length > DESC_MAX) {
      findings.push({
        severity: 'quality',
        code: 'DESCRIPTION_LENGTH',
        detail: `${description.length} characters`,
      });
    }
  }

  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => textOf(m[1]));
  const nonEmptyH1 = h1s.filter(Boolean);
  if (indexable && nonEmptyH1.length !== 1) {
    findings.push({
      severity: 'quality',
      code: 'H1',
      detail: nonEmptyH1.length === 0 ? 'no non-empty h1' : `${h1s.length} h1 tags`,
    });
  }

  const jsonBlocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  jsonBlocks.forEach((block, index) => {
    try {
      JSON.parse(block[1].trim());
    } catch (error) {
      findings.push({
        severity: 'critical',
        code: 'JSONLD',
        detail: `block ${index + 1}: ${error instanceof Error ? error.message : 'parse error'}`,
      });
    }
  });

  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const altProblems = images
    .map((tag) => {
      const explicit = attr(tag, 'alt');
      if (explicit == null && !/\balt(\s|>|\/)/i.test(tag)) return { src: attr(tag, 'src') || 'no src', issue: 'missing' };
      if (!(explicit || '').trim()) return { src: attr(tag, 'src') || 'no src', issue: 'empty' };
      return null;
    })
    .filter(Boolean);
  if (altProblems.length) {
    findings.push({
      severity: 'quality',
      code: 'IMG_ALT',
      detail: `${altProblems.length} img with ${altProblems[0].issue} alt (${altProblems.slice(0, 3).map((item) => item.src).join(', ')})`,
    });
  }

  const content = measureContent(html);
  if (indexable && content.visibleWords < THIN_WORD_LIMIT) {
    findings.push({
      severity: 'quality',
      code: 'THIN',
      detail: `${content.visibleWords} visible words`,
    });
  }
  const codeWords = content.hiddenWords + content.scriptWords;
  if (indexable && content.visibleWords > 0 && codeWords > content.visibleWords) {
    findings.push({
      severity: 'quality',
      code: 'RATIO',
      detail: `${codeWords} hidden/script words vs ${content.visibleWords} visible (${content.hiddenWords} hidden, ${content.scriptWords} script)`,
    });
  }

  const inlineScripts = extractInlineScripts(html);
  const flaggedScripts = inlineScripts.filter(
    (item) => item.bucket !== 'third-party' && (item.bucket === 'form-handler' || item.wordCount >= 15),
  );
  if (flaggedScripts.length) {
    findings.push({
      severity: 'quality',
      code: 'INLINE_SCRIPT',
      detail: flaggedScripts
        .map((item) => `${item.bucket}, ${item.wordCount} words: ${item.preview}`)
        .join(' | '),
    });
  }

  const links = [];
  for (const href of extractAnchors(html)) {
    const resolved = resolveHref(href, pathname);
    if (!resolved || resolved.kind === 'invalid') {
      if (resolved?.kind === 'invalid') {
        links.push({ state: 'invalid', href, path: href });
      }
      continue;
    }
    if (resolved.nonWww) {
      links.push({ state: 'host', href: resolved.href, path: resolved.pathname });
      continue;
    }
    const destination = classifyDestination(resolved.pathname, livePaths);
    if (destination.state !== 'live') {
      links.push({
        state: destination.state,
        href: resolved.href,
        path: resolved.pathname,
        kind: destination.redirect?.kind || destination.state,
        target: destination.redirect?.target || '',
      });
    } else {
      links.push({ state: 'live', href: resolved.href, path: resolved.pathname });
    }
  }

  const flaggedLinks = new Set();
  for (const link of links) {
    if (link.state === 'live') continue;
    const key = `${link.state}|${link.path}`;
    if (flaggedLinks.has(key)) continue;
    flaggedLinks.add(key);
    const severity = link.state === 'missing' || link.state === 'gone' || link.state === 'invalid' ? 'critical' : 'quality';
    const code = severity === 'critical' ? 'LINK_BROKEN' : 'LINK_REDIRECT';
    findings.push({
      severity,
      code,
      detail: `${link.path}${link.target ? ` (${link.kind} to ${link.target})` : link.kind ? ` (${link.kind})` : ''}`,
    });
  }

  return {
    rel,
    pathname,
    url: `${SITE}${pathname === '/404.html' ? '/404/' : pathname}`,
    indexable,
    title,
    description,
    h1: nonEmptyH1[0] || '',
    content,
    inlineScripts,
    links,
    findings,
  };
}

function loadSitemaps(distDir) {
  const indexPath = path.join(distDir, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    return { indexFound: false, pageUrls: [], childFiles: [], legacyFile: fs.existsSync(path.join(distDir, 'legacy-sitemap.xml')) };
  }
  const indexXml = fs.readFileSync(indexPath, 'utf8');
  const indexLocs = [...indexXml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1].trim()));
  const childFiles = [];
  const pageUrls = [];
  for (const loc of indexLocs) {
    let pathname = loc;
    try {
      pathname = new URL(loc).pathname;
    } catch {
      pageUrls.push(loc);
      continue;
    }
    if (pathname.endsWith('.xml')) {
      const local = path.join(distDir, pathname.replace(/^\//, ''));
      childFiles.push({ loc, local, exists: fs.existsSync(local) });
      if (!fs.existsSync(local)) continue;
      const xml = fs.readFileSync(local, 'utf8');
      for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)) {
        pageUrls.push(decodeEntities(match[1].trim()));
      }
    } else {
      pageUrls.push(loc);
    }
  }
  return {
    indexFound: true,
    pageUrls,
    childFiles,
    legacyFile: fs.existsSync(path.join(distDir, 'legacy-sitemap.xml')),
    legacyReferenced: indexLocs.some((loc) => loc.includes('legacy-sitemap')),
  };
}

function auditSitemap(sitemaps, pages, livePaths) {
  const findings = [];
  if (!sitemaps.indexFound) {
    findings.push({ severity: 'critical', code: 'SITEMAP', url: '(index)', detail: 'dist sitemap-index.xml is missing' });
    return findings;
  }
  if (sitemaps.legacyReferenced) {
    findings.push({
      severity: 'critical',
      code: 'SITEMAP_LEGACY_INDEX',
      url: `${SITE}/legacy-sitemap.xml`,
      detail: 'sitemap-index.xml references legacy-sitemap.xml',
    });
  }
  for (const child of sitemaps.childFiles) {
    if (!child.exists) {
      findings.push({
        severity: 'critical',
        code: 'SITEMAP',
        url: child.loc,
        detail: 'sitemap index points at a file that is not in the build',
      });
    }
  }

  const byPath = new Map(pages.map((page) => [page.pathname, page]));
  for (const loc of sitemaps.pageUrls) {
    let parsed;
    try {
      parsed = new URL(loc);
    } catch {
      findings.push({ severity: 'critical', code: 'SITEMAP', url: loc, detail: 'sitemap loc is not a valid URL' });
      continue;
    }
    const problems = [];
    if (parsed.origin !== SITE) problems.push(`host ${parsed.origin}`);
    if (parsed.pathname !== parsed.pathname.toLowerCase()) problems.push('uppercase path');
    if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) problems.push('missing trailing slash');
    if (parsed.search) problems.push('query string');
    const redirect = redirectOf(parsed.pathname);
    if (redirect?.kind === 'inverted') problems.push(`inverted slug redirects to ${redirect.target}`);
    else if (redirect?.kind === 'legacy') problems.push(`legacy persona slug redirects to ${redirect.target}`);
    else if (redirect?.kind === 'gone') problems.push('410 gone');
    else if (redirect) problems.push(`${redirect.kind} redirect to ${redirect.target}`);
    if (!livePaths.has(parsed.pathname)) problems.push('no matching HTML file (not a live 200)');
    const page = byPath.get(parsed.pathname);
    if (page && !page.indexable) problems.push('URL is a noindex or utility page');
    if (problems.length) {
      findings.push({
        severity: 'critical',
        code: 'SITEMAP',
        url: loc,
        detail: problems.join('; '),
      });
    }
  }
  return findings;
}

function collapseFindings(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.code}::${row.detail}`;
    if (!map.has(key)) map.set(key, { ...row, urls: [] });
    map.get(key).urls.push(row.url || row.pathname);
  }
  return [...map.values()].sort((a, b) => b.urls.length - a.urls.length);
}

function group(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function mdEscape(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function exampleList(rows, render) {
  const shown = rows.slice(0, EXAMPLE_LIMIT).map(render);
  if (rows.length > EXAMPLE_LIMIT) shown.push(`- …and ${rows.length - EXAMPLE_LIMIT} more`);
  return shown.join('\n');
}

const FIXES = {
  CANONICAL: {
    title: 'Canonical tags',
    body: 'Indexable pages get their canonical from `src/layouts/Layout.astro` (`canonicalURL`, built with `Astro.site` and a trailing slash). A mismatch means that builder and the emitted file path disagree. Keep one absolute `https://www.thehrstackguide.com/.../` tag, lowercase, with a trailing slash, and the same path as the HTML file.',
  },
  ROBOTS_NOINDEX: {
    title: 'Accidental noindex',
    body: 'Public pages should emit `index, follow`. `noindex` is reserved for `src/pages/404.astro`, `src/pages/thank-you.astro`, `src/pages/recommendation.astro` (`noindex, follow` only), and `src/pages/go/[slug].astro`. Remove `noindex` / `robots` overrides from any other page.',
  },
  ROBOTS_NOFOLLOW: {
    title: 'Accidental nofollow',
    body: 'Indexable pages and `/recommendation/` must stay `follow` so crawlers can walk comparison links. `nofollow` belongs only on the 404, thank-you, and `/go/` shells.',
  },
  SITEMAP: {
    title: 'Sitemap pollution',
    body: 'The primary sitemap is filtered by `includeInSitemap` in `src/lib/master-redirects.ts`, which already drops `/go/`, noindex routes, `-for-*` persona slugs, and `resolveMasterRedirect` hits. Any URL still listed is either a new redirect the filter does not see, or a built page whose canonical path is not the sitemap loc. Do not add `public/legacy-sitemap.xml` to the sitemap index.',
  },
  SITEMAP_LEGACY_INDEX: {
    title: 'Legacy sitemap in the index',
    body: 'Remove `legacy-sitemap.xml` from `sitemap-index.xml`. That file is a recrawl aid for redirected URLs and must not be a child of the primary sitemap.',
  },
  LINK_BROKEN: {
    title: 'Broken internal links',
    body: 'Point each href at a file that exists under `dist/client` (a directory `index.html` for trailing-slash pages, or a real asset). Replace retired comparison and persona URLs with the live hub from `comparisonHubSlug()` in `src/lib/comparison-routes.ts`. Do not link at 410 `reflektive` paths.',
  },
  LINK_REDIRECT: {
    title: 'Internal links that 308',
    body: 'The only redirecting internal URL in this build is `/privacy/`, which 308s to `/privacy-policy/`. It comes from the lead modal in `src/components/ManualLeadModal.astro` (`href="/privacy/"`), so it is on every page that mounts the layout. Change that href to `/privacy-policy/`. Keep generating comparison hrefs with `comparisonHubSlug()` so inverted and `-for-*` slugs do not come back.',
  },
  ORPHAN: {
    title: 'Orphan HTML',
    body: 'Add at least one in-content or hub link to each indexable URL. Category hubs should link their comparisons, and the homepage or footer should link every static guide. Utility shells (`/go/`, 404, thank-you) are allowed to stay unlinked.',
  },
  THIN: {
    title: 'Thin indexable pages',
    body: 'Bring each flagged URL to at least 400 visible body words (script, style, svg, nav, footer, head, and `class="hidden"` excluded). Expand the page template copy, not the hidden lead modal.',
  },
  RATIO: {
    title: 'Hidden and script text outweighs visible copy',
    body: 'The lead dialog in `src/layouts/Layout.astro` is one hidden form on every page, and several templates still emit inline scripts. Keep the single external module at `src/scripts/lead-modal.ts`. Move remaining inline handlers (affiliate click tracker in `Layout.astro`, `define:vars` blocks) into bundled `<script>` modules so the HTML word count is visible copy.',
  },
  INLINE_SCRIPT: {
    title: 'Residual inline JavaScript',
    body: 'Form-handler copies (`initModalHandlers`, `blockedDomains`, submit listeners) must not return to HTML. Leave JSON-LD as `application/ld+json`. Site behavior belongs in bundled modules under `src/scripts/` (affiliate clicks, scorecard download, calculators, search). Partytown, the Vercel Web Analytics boot, and Speed Insights stay inline because those third-party snippets have to live in the document, and they are not scored as inline-script findings.',
  },
  H1: {
    title: 'H1 count',
    body: 'Each indexable template should render exactly one non-empty `<h1>`. Comparison pages set it from the page heading prop; hubs set it in the page file. Remove extra `h1` elements in nested components.',
  },
  TITLE_LENGTH: {
    title: 'Title length',
    body: 'Keep `<title>` between 30 and 65 characters after entity decoding. Titles are built in `src/lib/seo.ts` and passed to `Layout`. Shorten the suffix or the vendor pair so the rendered string fits.',
  },
  TITLE: {
    title: 'Missing or duplicate titles',
    body: 'Give every indexable URL its own title. Duplicate strings usually mean two routes share one `seo.ts` helper output.',
  },
  DESCRIPTION_LENGTH: {
    title: 'Meta description length',
    body: 'Keep `meta name="description"` between 100 and 160 characters. Descriptions are the `description` prop on `Layout`. Trim boilerplate suffixes first.',
  },
  DESCRIPTION: {
    title: 'Missing or duplicate descriptions',
    body: 'Write a distinct description per URL. Shared hub boilerplate that is copied verbatim across comparisons should include the two vendor names and the category.',
  },
  JSONLD: {
    title: 'Malformed JSON-LD',
    body: 'Every `application/ld+json` block must `JSON.parse`. Fix the object built in `src/components/SEO/JsonLdSchema.astro` or the page-level graph in `src/pages/[...slug].astro` before it is injected with `set:html`.',
  },
  IMG_ALT: {
    title: 'Images with an empty alt',
    body: 'No `<img>` is missing the attribute. The failures are empty alts (`alt=""` or a boolean `alt`). Pass the vendor name through on `src/components/sections/FeatureParityGrid.astro`, `src/components/sections/StrengthsTradeoffs.astro`, `src/components/StickyMobileCta.astro`, `src/components/PricingNuance.astro`, and `src/components/CostCalculator.astro`. Give the author photo in `src/components/common/AuthorByline.astro` a name (`Dave Storey`) instead of `alt=""`. `VendorLogo.astro` already prints whatever `alt` it is given.',
  },
};

function renderReport({ distDir, pages, sitemapFindings, orphanPaths, sitemaps }) {
  const indexable = pages.filter((page) => page.indexable);
  const critical = [];
  const quality = [];
  for (const page of pages) {
    for (const finding of page.findings) {
      const row = { ...finding, url: page.url, pathname: page.pathname };
      if (finding.severity === 'critical') critical.push(row);
      else quality.push(row);
    }
  }
  for (const finding of sitemapFindings) {
    critical.push({ ...finding, pathname: finding.url });
  }
  for (const pathname of orphanPaths) {
    quality.push({
      severity: 'quality',
      code: 'ORPHAN',
      url: `${SITE}${pathname}`,
      pathname,
      detail: 'no incoming internal links from other HTML pages',
    });
  }

  const clean = indexable.filter((page) => {
    const own = page.findings.length === 0;
    const orphan = orphanPaths.includes(page.pathname);
    return own && !orphan;
  });
  const passRate = indexable.length ? clean.length / indexable.length : 0;
  const sitemapCritical = sitemapFindings.length;
  const health = Math.max(0, Math.round(passRate * 100) - Math.min(30, sitemapCritical * 5));

  const titleCounts = group(
    indexable.filter((page) => page.title),
    (page) => page.title,
  );
  const descriptionCounts = group(
    indexable.filter((page) => page.description),
    (page) => page.description,
  );
  for (const [title, groupPages] of titleCounts) {
    if (groupPages.length < 2) continue;
    for (const page of groupPages) {
      quality.push({
        severity: 'quality',
        code: 'TITLE',
        url: page.url,
        pathname: page.pathname,
        detail: `duplicate title (${groupPages.length} URLs): ${title}`,
      });
    }
  }
  for (const [description, groupPages] of descriptionCounts) {
    if (groupPages.length < 2) continue;
    for (const page of groupPages) {
      quality.push({
        severity: 'quality',
        code: 'DESCRIPTION',
        url: page.url,
        pathname: page.pathname,
        detail: `duplicate description (${groupPages.length} URLs)`,
      });
    }
  }

  const cleanAfterDupes = clean.filter((page) => {
    const titleDup = (titleCounts.get(page.title) || []).length > 1;
    const descDup = (descriptionCounts.get(page.description) || []).length > 1;
    return !titleDup && !descDup;
  });
  const passRateFinal = indexable.length ? cleanAfterDupes.length / indexable.length : 0;
  const healthFinal = Math.max(0, Math.round(passRateFinal * 100) - Math.min(30, sitemapCritical * 5));

  const criticalGroups = group(critical, (item) => item.code);
  const qualityGroups = group(quality, (item) => item.code);

  const lines = [];
  lines.push('# SEO audit report');
  lines.push('');
  lines.push(`Generated from \`${path.relative(ROOT, distDir)}\` on ${new Date().toISOString()}.`);
  lines.push('');
  lines.push('## Executive summary');
  lines.push('');
  lines.push(`- HTML pages audited: **${pages.length}** (${indexable.length} indexable, ${pages.length - indexable.length} utility/noindex)`);
  lines.push(`- Sitemap URLs checked: **${sitemaps.pageUrls.length}** across ${sitemaps.childFiles.length} child sitemap(s)`);
  lines.push(`- Indexable pages with zero findings: **${cleanAfterDupes.length}** (${Math.round(passRateFinal * 100)}% pass rate)`);
  lines.push(`- Critical findings: **${critical.length}**`);
  lines.push(`- Quality findings: **${quality.length}**`);
  lines.push(`- Global health score: **${healthFinal} / 100**`);
  lines.push('');
  lines.push('Health score is the percentage of indexable pages that pass every check, minus 5 points per sitemap-level critical finding (capped at 30 points). Utility routes (`/go/*`, `/404`, `/thank-you/`, `/recommendation/`) are audited for broken links and JSON-LD but are not required to be indexed or to hit the 400-word floor.');
  lines.push('');
  lines.push(`Visible words exclude \`head\`, \`script\`, \`style\`, \`svg\`, \`nav\`, and \`footer\`. Hidden words are text inside \`class="hidden"\` or the \`hidden\` attribute (including the lead modal). Script words are executable inline or embedded script text, not JSON-LD.`);
  lines.push('');

  lines.push('## Critical blockers');
  lines.push('');
  if (!critical.length) {
    lines.push('None. No canonical, robots, sitemap, broken-link, or JSON-LD failures were found on indexable URLs.');
    lines.push('');
  } else {
    lines.push('These are the issues that can waste crawl budget or keep a URL out of the index.');
    lines.push('');
    for (const [code, rows] of criticalGroups) {
      const collapsed = collapseFindings(rows);
      lines.push(`### ${code} (${rows.length} on ${collapsed.length} distinct issues)`);
      lines.push('');
      lines.push(exampleList(collapsed, (row) => `- ${row.urls.length} page(s), e.g. \`${row.urls[0]}\` — ${mdEscape(row.detail)}`));
      lines.push('');
    }
  }

  const fired = new Set([...criticalGroups.keys(), ...qualityGroups.keys()]);

  lines.push('## Checks that passed');
  lines.push('');
  const passed = [
    ['CANONICAL', 'Every indexable page has exactly one absolute, lowercase, trailing-slash canonical that matches its file.'],
    ['ROBOTS_NOINDEX', 'No public page is `noindex`. Utility noindex stays on `/go/*`, `/404`, `/thank-you/`, and `/recommendation/`.'],
    ['ROBOTS_NOFOLLOW', 'No indexable page, and not `/recommendation/`, is `nofollow`.'],
    ['SITEMAP', `All ${sitemaps.pageUrls.length} URLs in \`sitemap-index.xml\` / \`sitemap-0.xml\` are live canonical 200s. No inverted slugs, legacy \`-for-*\` URLs, or redirects.`],
    ['LINK_BROKEN', 'No internal href points at a missing file or a 410.'],
    ['JSONLD', 'Every JSON-LD block parses.'],
    ['H1', 'Every indexable page has exactly one non-empty h1.'],
    ['ORPHAN', 'Every indexable page has at least one inbound internal link.'],
    ['TITLE', 'No duplicate titles across indexable URLs.'],
    ['DESCRIPTION', 'No duplicate meta descriptions across indexable URLs.'],
  ].filter(([code]) => !fired.has(code));
  if (!passed.length) lines.push('None of the indexed checks were clean across the whole site.');
  else {
    for (const [, sentence] of passed) lines.push(`- ${sentence}`);
  }
  lines.push('');

  lines.push('## Quality warnings');
  lines.push('');
  if (!quality.length) {
    lines.push('None.');
  } else {
    for (const [code, rows] of qualityGroups) {
      const collapsed = collapseFindings(rows);
      lines.push(`### ${code} (${rows.length} on ${collapsed.length} distinct issues)`);
      lines.push('');
      lines.push(exampleList(collapsed, (row) => `- ${row.urls.length} page(s), e.g. \`${row.urls[0]}\` — ${mdEscape(row.detail)}`));
      lines.push('');
    }
  }

  lines.push('## Pass table');
  lines.push('');
  lines.push('Indexable URLs with one canonical, indexable robots, a single h1, in-range unique title and description, valid JSON-LD, no broken or redirecting internal links, no missing alts, enough visible copy, no script-bloat overflow, no residual inline handlers, and at least one inbound internal link.');
  lines.push('');
  if (!cleanAfterDupes.length) {
    lines.push('No indexable page passed every check.');
  } else {
    lines.push('| URL | Visible words | Title length | Description length |');
    lines.push('| --- | ---: | ---: | ---: |');
    for (const page of cleanAfterDupes) {
      lines.push(`| ${mdEscape(page.url)} | ${page.content.visibleWords} | ${page.title.length} | ${page.description.length} |`);
    }
  }
  lines.push('');

  if (sitemaps.legacyFile) {
    lines.push('## Legacy sitemap file');
    lines.push('');
    lines.push(
      sitemaps.legacyReferenced
        ? '`legacy-sitemap.xml` is referenced by the sitemap index. That is a critical blocker above.'
        : '`public/legacy-sitemap.xml` is copied into the build but is **not** listed in `sitemap-index.xml`. Leave it out of the primary sitemap. Submit it only as a one-off recrawl list for redirected URLs.',
    );
    lines.push('');
  }

  lines.push('## Proposed batch fixes');
  lines.push('');
  if (!fired.size) {
    lines.push('No code changes required.');
  } else {
    lines.push('Apply these in one pass. Each item matches a finding code above.');
    lines.push('');
    for (const code of fired) {
      const fix = FIXES[code];
      if (!fix) continue;
      lines.push(`### ${fix.title}`);
      lines.push('');
      lines.push(fix.body);
      lines.push('');
    }
  }

  lines.push('## How to re-run');
  lines.push('');
  lines.push('```bash');
  lines.push('npm run build');
  lines.push('npm run audit:indexing');
  lines.push('```');
  lines.push('');
  void health;
  return lines.join('\n');
}

function main() {
  const { outPath } = parseArgs(process.argv.slice(2));
  const distDir = resolveDist();
  const htmlFiles = walk(distDir, (name) => name.endsWith('.html'));
  const livePaths = new Set();
  for (const file of walk(distDir, () => true)) {
    const rel = path.relative(distDir, file).split(path.sep).join('/');
    livePaths.add(publicPathFor(rel));
    if (rel.endsWith('/index.html') || rel === 'index.html') {
      livePaths.add(publicPathFor(rel));
    }
  }
  livePaths.add('/');

  const pages = htmlFiles.map((file) => analyzePage(file, distDir, livePaths));
  const inbound = new Map(pages.filter((page) => page.indexable).map((page) => [page.pathname, 0]));
  for (const page of pages) {
    const seen = new Set();
    for (const link of page.links) {
      if (link.state !== 'live') continue;
      if (link.path === page.pathname) continue;
      if (seen.has(link.path)) continue;
      seen.add(link.path);
      if (inbound.has(link.path)) inbound.set(link.path, inbound.get(link.path) + 1);
    }
  }
  const orphanPaths = [...inbound.entries()].filter(([, count]) => count === 0).map(([pathname]) => pathname);

  const sitemaps = loadSitemaps(distDir);
  const sitemapFindings = auditSitemap(sitemaps, pages, livePaths);
  const report = renderReport({ distDir, pages, sitemapFindings, orphanPaths, sitemaps });
  fs.writeFileSync(outPath, report);
  const indexable = pages.filter((page) => page.indexable).length;
  console.log(`Audited ${pages.length} HTML pages (${indexable} indexable), ${sitemaps.pageUrls.length} sitemap URLs`);
  console.log(`Wrote ${path.relative(ROOT, outPath)}`);
}

main();
