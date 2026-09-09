#!/usr/bin/env node
/**
 * Local SEO audit of indexable HTML in dist/.
 *
 * Skips affiliate `/go/` redirect shells, meta-refresh / location.replace
 * pages, noindex documents, 404, and leftover `-for-tech-startups` HTML.
 * Remaining pages are crawlable content: homepage, category hubs,
 * comparison routes, and static content (about, methodology, etc.).
 *
 * Checks per page:
 *   1) Title / H1 alignment (not exact-string equality — H1 is allowed to
 *      drop the year suffix and use a "Comparison & Analysis" closer)
 *   2) Valid JSON-LD (parses, schema.org @context, known @type)
 *   3) Coverage of 30 B2B HR contextual terms
 *
 * Score is out of 100:
 *   Title/H1  40  |  JSON-LD  30  |  Term coverage  30
 *
 * Usage:
 *   npm run build && node scripts/seo-audit.mjs
 *   node scripts/seo-audit.mjs --out reports/seo-audit.csv
 *
 * Default CSV path: seo-audit.csv (repo root)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const SITE = 'https://www.thehrstackguide.com';

const POINTS_TITLE_H1 = 40;
const POINTS_JSON_LD = 30;
const POINTS_TERMS = 30;

/** 30 B2B HR / ops terms. Patterns are case-insensitive. */
const TARGET_TERMS = [
  { name: 'compliance', pattern: /\bcomplian(?:ce|t)\b/gi },
  { name: 'SOC2', pattern: /\bsoc[\s-]?2\b/gi },
  { name: 'payroll', pattern: /\bpayrolls?\b/gi },
  { name: 'integration', pattern: /\bintegrations?\b/gi },
  { name: 'SLA', pattern: /\bslas?\b/gi },
  { name: 'API', pattern: /\bapis?\b/gi },
  { name: 'onboarding', pattern: /\bonboard(?:ing|ed)?\b/gi },
  { name: 'EOR', pattern: /\beors?\b/gi },
  { name: 'GDPR', pattern: /\bgdpr\b/gi },
  { name: 'contractor', pattern: /\bcontractors?\b/gi },
  { name: 'ATS', pattern: /\bats\b/gi },
  { name: 'HRIS', pattern: /\bhris\b/gi },
  { name: 'benefits', pattern: /\bbenefits?\b/gi },
  { name: 'SSO', pattern: /\bsso\b/gi },
  { name: 'OKR', pattern: /\bokrs?\b/gi },
  { name: 'performance', pattern: /\bperformance\b/gi },
  { name: 'scorecard', pattern: /\bscorecards?\b/gi },
  { name: 'calibration', pattern: /\bcalibrat(?:e|ion|ing)\b/gi },
  { name: 'FX', pattern: /\bfx\b/gi },
  { name: 'misclassification', pattern: /\bmisclassif(?:y|ied|ication)\b/gi },
  { name: 'statutory', pattern: /\bstatutory\b/gi },
  { name: 'compensation', pattern: /\bcompensation\b/gi },
  { name: 'audit', pattern: /\baudits?\b/gi },
  { name: 'workforce', pattern: /\bworkforce\b/gi },
  { name: 'pricing', pattern: /\bpricing\b/gi },
  { name: 'entity', pattern: /\bentit(?:y|ies)\b/gi },
  { name: 'withholding', pattern: /\bwithhold(?:ing|s)?\b/gi },
  { name: 'headcount', pattern: /\bheadcount\b/gi },
  { name: 'ISO27001', pattern: /\biso[\s-]?27001\b/gi },
  { name: 'PEO', pattern: /\bpeos?\b/gi },
];

const KNOWN_SCHEMA_TYPES = new Set([
  'itempage',
  'webpage',
  'website',
  'organization',
  'softwareapplication',
  'faqpage',
  'question',
  'answer',
  'breadcrumblist',
  'listitem',
  'product',
  'offer',
  'aggregaterating',
  'person',
  'article',
  'blogposting',
  'collectionpage',
  'searchaction',
]);

function parseArgs(argv) {
  const outIdx = argv.indexOf('--out');
  return {
    outPath:
      outIdx !== -1 && argv[outIdx + 1]
        ? path.resolve(rootDir, argv[outIdx + 1])
        : path.join(rootDir, 'seo-audit.csv'),
  };
}

function walkHtmlFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function fileToUrl(filePath) {
  const rel = path.relative(distDir, filePath).split(path.sep).join('/');
  if (rel === 'index.html') return `${SITE}/`;
  if (rel.endsWith('/index.html')) {
    return `${SITE}/${rel.slice(0, -'index.html'.length)}`;
  }
  return `${SITE}/${rel}`;
}

function robotsIsNoindex(html) {
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  return tags.some((tag) => {
    if (!/\bname=["']robots["']/i.test(tag)) return false;
    const content = tag.match(/\bcontent=["']([^"']*)["']/i);
    return content ? /\bnoindex\b/i.test(content[1]) : false;
  });
}

function looksLikeRedirectShell(html) {
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const hasRefresh = metaTags.some((tag) => /\bhttp-equiv=["']refresh["']/i.test(tag));
  if (hasRefresh) return true;
  const title = extractTitle(html);
  if (/^redirecting\b/i.test(title)) return true;
  return false;
}

/**
 * True when the file is crawlable content rather than an operational
 * redirect, error, or noindex shell.
 */
function isIndexableContentPage(relPath, html) {
  const posix = relPath.split(path.sep).join('/');
  if (posix === 'go' || posix.startsWith('go/')) return false;
  if (posix === 'api' || posix.startsWith('api/')) return false;
  if (posix.startsWith('_astro/') || posix.startsWith('~partytown/')) return false;
  if (posix === '404.html' || posix.endsWith('/404.html')) return false;
  if (posix.includes('-for-tech-startups')) return false;
  if (robotsIsNoindex(html)) return false;
  if (looksLikeRedirectShell(html)) return false;
  return true;
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

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : '';
}

function extractH1s(html) {
  const matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  return matches.map((m) => stripTags(m[1])).filter(Boolean);
}

function extractJsonLdBlocks(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1].trim()
  );
}

function collectTypes(node, types) {
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, types);
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (typeof node['@type'] === 'string') types.push(node['@type']);
  else if (Array.isArray(node['@type'])) types.push(...node['@type'].filter((t) => typeof t === 'string'));
  if (node['@graph']) collectTypes(node['@graph'], types);
  if (node.mainEntity) collectTypes(node.mainEntity, types);
}

function hasSchemaContext(node) {
  if (Array.isArray(node)) return node.some(hasSchemaContext);
  if (!node || typeof node !== 'object') return false;
  const ctx = node['@context'];
  if (typeof ctx === 'string' && /schema\.org/i.test(ctx)) return true;
  if (Array.isArray(ctx) && ctx.some((c) => typeof c === 'string' && /schema\.org/i.test(c))) return true;
  if (node['@graph']) return true;
  return false;
}

function scoreJsonLd(blocks) {
  if (blocks.length === 0) {
    return { points: 0, valid: false, detail: 'missing' };
  }

  const parsed = [];
  for (const block of blocks) {
    try {
      parsed.push(JSON.parse(block));
    } catch {
      return { points: 10, valid: false, detail: 'invalid_json' };
    }
  }

  const types = [];
  for (const node of parsed) collectTypes(node, types);
  const hasContext = parsed.some(hasSchemaContext);
  const hasKnownType = types.some((t) => KNOWN_SCHEMA_TYPES.has(String(t).toLowerCase()));

  if (hasContext && hasKnownType) {
    return { points: POINTS_JSON_LD, valid: true, detail: types.slice(0, 6).join('|') };
  }
  if (hasKnownType || hasContext) {
    return { points: 20, valid: true, detail: types.slice(0, 6).join('|') || 'no_type' };
  }
  return { points: 15, valid: true, detail: 'parsed_untyped' };
}

function normalizePhrase(value) {
  return value
    .toLowerCase()
    .replace(/\s*\|\s*the hr stack guide\s*$/i, '')
    .replace(/\s*\(\s*20\d{2}\s*\)\s*/g, ' ')
    .replace(/[^a-z0-9&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function vsCore(value) {
  const match = normalizePhrase(value).match(/^(.+? vs .+?)(?: comparison| analysis|$)/);
  return match ? match[1].trim() : '';
}

/**
 * Title and H1 are aligned when they share the same primary keyword phrase.
 * Exact equality is not required: 1-vs-1 titles include "(2026): [Category]
 * Comparison" while H1s use "Comparison & Analysis".
 */
function scoreTitleH1(title, h1s) {
  const hasTitle = Boolean(title);
  const h1 = h1s[0] || '';
  let points = 0;
  if (hasTitle) points += 10;
  if (h1s.length === 1) points += 10;
  else if (h1s.length > 1) points += 5;

  if (!hasTitle || !h1) {
    return { points, match: false, detail: !hasTitle ? 'missing_title' : 'missing_h1' };
  }

  const nTitle = normalizePhrase(title);
  const nH1 = normalizePhrase(h1);
  const titleCore = vsCore(title);
  const h1Core = vsCore(h1);

  let matched = false;
  let detail = 'mismatch';

  if (nTitle === nH1) {
    matched = true;
    detail = 'exact';
  } else if (nH1 && (nTitle.includes(nH1) || nH1.includes(nTitle))) {
    matched = true;
    detail = 'contained';
  } else if (titleCore && h1Core && (titleCore === h1Core || h1Core.includes(titleCore) || titleCore.includes(h1Core))) {
    matched = true;
    detail = 'vs_core';
  } else {
    const titleTokens = new Set(nTitle.split(' ').filter((t) => t.length > 2));
    const h1Tokens = nH1.split(' ').filter((t) => t.length > 2);
    const overlap = h1Tokens.filter((t) => titleTokens.has(t)).length;
    const ratio = h1Tokens.length ? overlap / h1Tokens.length : 0;
    if (ratio >= 0.6) {
      matched = true;
      detail = `token_${Math.round(ratio * 100)}`;
    }
  }

  if (matched) points += 20;
  return { points, match: matched, detail };
}

function countTerms(text) {
  const found = [];
  let mentions = 0;
  for (const term of TARGET_TERMS) {
    const matches = text.match(term.pattern);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      found.push(`${term.name}:${count}`);
      mentions += count;
    }
  }
  const unique = found.length;
  const points = Math.round((unique / TARGET_TERMS.length) * POINTS_TERMS);
  return { unique, mentions, points, found: found.join('|') };
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function main() {
  const { outPath } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(distDir)) {
    console.error('dist/ not found. Run `npm run build` first.');
    process.exit(1);
  }

  const files = walkHtmlFiles(distDir).sort();
  if (files.length === 0) {
    console.error('No HTML files found in dist/.');
    process.exit(1);
  }

  const rows = [];
  let skipped = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(distDir, file);
    if (!isIndexableContentPage(rel, html)) {
      skipped += 1;
      continue;
    }
    const url = fileToUrl(file);
    const title = extractTitle(html);
    const h1s = extractH1s(html);
    const jsonLd = scoreJsonLd(extractJsonLdBlocks(html));
    const titleH1 = scoreTitleH1(title, h1s);
    const terms = countTerms(html);

    const score = Math.min(100, titleH1.points + jsonLd.points + terms.points);

    rows.push({
      url,
      score,
      title,
      h1: h1s[0] || '',
      h1_count: h1s.length,
      title_h1_match: titleH1.match ? 'yes' : 'no',
      title_h1_detail: titleH1.detail,
      json_ld_valid: jsonLd.valid ? 'yes' : 'no',
      json_ld_detail: jsonLd.detail,
      terms_unique: terms.unique,
      terms_mentions: terms.mentions,
      terms_found: terms.found,
    });
  }

  if (rows.length === 0) {
    console.error('No indexable HTML pages found in dist/.');
    process.exit(1);
  }

  const header = [
    'url',
    'score',
    'title',
    'h1',
    'h1_count',
    'title_h1_match',
    'title_h1_detail',
    'json_ld_valid',
    'json_ld_detail',
    'terms_unique',
    'terms_mentions',
    'terms_found',
  ];

  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(header.map((key) => csvEscape(row[key])).join(','));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');

  const scores = rows.map((r) => r.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const below80 = rows.filter((r) => r.score < 80).length;
  const titleMismatch = rows.filter((r) => r.title_h1_match === 'no').length;
  const jsonInvalid = rows.filter((r) => r.json_ld_valid === 'no').length;

  console.log(`Audited ${rows.length} indexable pages`);
  console.log(`Skipped ${skipped} non-indexable / redirect pages`);
  console.log(`Wrote ${path.relative(rootDir, outPath)}`);
  console.log(`Average score: ${avg.toFixed(1)} / 100`);
  console.log(`Below 80: ${below80}`);
  console.log(`Title/H1 mismatch: ${titleMismatch}`);
  console.log(`Invalid or missing JSON-LD: ${jsonInvalid}`);
}

main();
