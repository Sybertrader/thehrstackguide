#!/usr/bin/env node
/**
 * Phase 1 technical health audit against production.
 *
 * Collects live URLs from the sitemap index (and child sitemaps) and legacy
 * URLs from vercel.json redirect sources, then checks each one at the edge:
 * status, redirect hop count, canonical parity, and accidental noindex.
 *
 * Usage: node scripts/audit-technical-health.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://www.thehrstackguide.com';
const SITEMAP_INDEX = `${ORIGIN}/sitemap-index.xml`;
const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'audit-report.json');
const CONCURRENCY = 5;
const MAX_HOPS = 8;
const TIMEOUT_MS = 20_000;

const HUBS = [
  'performyard-vs-lattice',
  'culture-amp-vs-clearcompany',
  'deel-vs-rippling',
];

const PERSONAS = ['enterprise', 'startups', 'agencies', 'people-ops', 'remote-teams'];

const VENDOR_PARTNERS = {
  greenhouse: 'breezy-hr',
  clearcompany: 'lattice',
  peoplefluent: 'performyard',
  '15five': 'culture-amp',
  leapsome: 'lattice',
  plane: 'deel',
};

const SPECIAL_LEGACY = [
  '/performyard-vs-reflektive-for-people-ops',
  '/performyard-vs-reflektive-for-people-ops/',
  '/culture-amp-vs-reflektive-for-remote-teams/',
  '/15five-vs-peoplefluent/',
];

function bothSlashes(pathname) {
  const bare = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return [bare || '/', `${bare}/`];
}

function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': 'HRStackGuide-TechnicalAudit/1.0' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }
  return response.text();
}

async function collectSitemapUrls() {
  const indexXml = await fetchText(SITEMAP_INDEX);
  const indexLocs = locs(indexXml);
  const pageUrls = [];
  const childSitemaps = [];

  for (const loc of indexLocs) {
    if (/\.xml($|\?)/i.test(loc)) childSitemaps.push(loc);
    else pageUrls.push(loc);
  }

  for (const child of childSitemaps) {
    const xml = await fetchText(child);
    for (const loc of locs(xml)) {
      if (!/\.xml($|\?)/i.test(loc)) pageUrls.push(loc);
    }
  }

  return [...new Set(pageUrls)];
}

function expandSource(source) {
  if (!source.includes(':')) return [source];

  if (source.includes('reflektive')) {
    return bothSlashes('/performyard-vs-reflektive-for-people-ops');
  }
  if (source.includes('15five-vs-peoplefluent')) {
    return bothSlashes('/15five-vs-peoplefluent');
  }
  if (source.includes('.*leapsome.*')) {
    return bothSlashes('/leapsome-vs-lattice');
  }

  const personaGroup = source.match(/^\/:hub\(\.\*-vs-\.\*\)-for-:persona\(([^)]+)\)\/?$/);
  if (personaGroup) {
    const allowed = new Set(personaGroup[1].split('|'));
    return HUBS.flatMap((hub) =>
      PERSONAS.filter((persona) => allowed.has(persona)).flatMap((persona) =>
        bothSlashes(`/${hub}-for-${persona}`),
      ),
    );
  }

  const fixedPersona = source.match(/^\/:hub\(\.\*-vs-\.\*\)-for-([a-z0-9-]+)\/?$/);
  if (fixedPersona) {
    return HUBS.flatMap((hub) => bothSlashes(`/${hub}-for-${fixedPersona[1]}`));
  }

  if (/^\/:hub\(\.\*-vs-\.\*\)-for-:mod\(/.test(source)) {
    return HUBS.flatMap((hub) => PERSONAS.flatMap((persona) => bothSlashes(`/${hub}-for-${persona}`)));
  }

  const literalFor = source.match(/^\/:path\(([a-z0-9-]+)-for-\.\*\)\/?$/);
  if (literalFor) {
    return PERSONAS.flatMap((persona) => bothSlashes(`/${literalFor[1]}-for-${persona}`));
  }

  const leftVendor = source.match(/^\/:path\(([a-z0-9-]+)-vs-\[a-z0-9\]/);
  if (leftVendor) {
    const partner = VENDOR_PARTNERS[leftVendor[1]];
    if (!partner) return [];
    return bothSlashes(`/${leftVendor[1]}-vs-${partner}`);
  }

  const rightVendor = source.match(/-vs-([a-z0-9-]+)\)\/?$/);
  if (rightVendor && source.startsWith('/:path([a-z0-9]')) {
    const partner = VENDOR_PARTNERS[rightVendor[1]];
    if (!partner) return [];
    return bothSlashes(`/${partner}-vs-${rightVendor[1]}`);
  }

  return [];
}

function collectLegacyPaths() {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const sources = [...new Set((config.redirects ?? []).map((rule) => rule.source))];
  const unmatched = [];
  const paths = [];

  for (const source of sources) {
    const expanded = expandSource(source);
    if (expanded.length === 0) unmatched.push(source);
    paths.push(...expanded);
  }

  if (unmatched.length) {
    throw new Error(`Unexpanded redirect sources:\n${unmatched.join('\n')}`);
  }

  paths.push(...SPECIAL_LEGACY);
  return [...new Set(paths)];
}

function toAbsolute(urlOrPath) {
  return new URL(urlOrPath, ORIGIN).href;
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? match[1] ?? match[2] ?? '' : null;
}

function extractCanonical(html) {
  const tags = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => /\srel\s*=\s*["']canonical["']/i.test(tag));
  if (tags.length === 0) return { href: null, count: 0 };
  return { href: attr(tags[0], 'href'), count: tags.length };
}

function extractMetaRobots(html) {
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const values = [];
  for (const tag of tags) {
    const name = attr(tag, 'name');
    if (name && name.toLowerCase() === 'robots') {
      const content = attr(tag, 'content');
      if (content) values.push(content);
    }
  }
  return values;
}

function hasNoindex(values) {
  return values.some((value) => /noindex/i.test(value));
}

/** Affiliate hops are noindex and excluded from canonical parity. */
function isGoPath(url) {
  try {
    const pathname = new URL(url).pathname;
    return pathname === '/go' || pathname.startsWith('/go/');
  } catch {
    return false;
  }
}

async function requestOnce(url) {
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'user-agent': 'HRStackGuide-TechnicalAudit/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  return response;
}

async function requestWithRetry(url) {
  try {
    const response = await requestOnce(url);
    if (response.status === 429 || response.status === 503) {
      await response.arrayBuffer().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return requestOnce(url);
    }
    return response;
  } catch (error) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return requestOnce(url).catch((retryError) => {
      const reason = retryError instanceof Error ? retryError.message : String(retryError);
      const first = error instanceof Error ? error.message : String(error);
      throw new Error(`${first}; retry: ${reason}`);
    });
  }
}

async function auditUrl(target) {
  const hops = [];
  let current = target.url;
  const seen = new Set();

  for (let step = 0; step < MAX_HOPS; step += 1) {
    if (seen.has(current)) {
      hops.push({ url: current, status: 0, location: null, error: 'redirect loop' });
      break;
    }
    seen.add(current);

    let response;
    try {
      response = await requestWithRetry(current);
    } catch (error) {
      hops.push({
        url: current,
        status: 0,
        location: null,
        error: error instanceof Error ? error.message : String(error),
      });
      break;
    }

    const location = response.headers.get('location');
    const robotsHeader = response.headers.get('x-robots-tag');
    const hop = {
      url: current,
      status: response.status,
      location: location ? new URL(location, current).href : null,
      xRobotsTag: robotsHeader,
    };

    const isRedirect = response.status >= 300 && response.status < 400 && location;
    if (!isRedirect) {
      if (response.status === 200) {
        const html = await response.text();
        const canonical = extractCanonical(html);
        hop.canonical = canonical.href;
        hop.canonicalCount = canonical.count;
        hop.metaRobots = extractMetaRobots(html);
      } else {
        await response.arrayBuffer().catch(() => {});
      }
      hops.push(hop);
      break;
    }

    await response.arrayBuffer().catch(() => {});
    hops.push(hop);
    current = hop.location;
  }

  return classify(target, hops);
}

function classify(target, hops) {
  const terminal = hops[hops.length - 1] ?? { url: target.url, status: 0 };
  const redirectHops = hops.filter((hop) => hop.status >= 300 && hop.status < 400);
  const finalStatus = terminal.status ?? 0;
  const finalUrl = terminal.url;
  const issues = [];

  const broken =
    finalStatus === 0 ||
    finalStatus === 404 ||
    finalStatus >= 500 ||
    (finalStatus >= 400 && finalStatus !== 200);

  if (finalStatus === 0) {
    issues.push(`request failed: ${terminal.error || 'unknown error'}`);
  } else if (finalStatus === 404 || finalStatus >= 500 || (finalStatus >= 400 && finalStatus < 600)) {
    issues.push(`HTTP ${finalStatus}`);
  }

  if (target.kind === 'sitemap') {
    if (finalStatus === 200 && redirectHops.length !== 0) {
      issues.push(`sitemap URL redirected in ${redirectHops.length} hop(s); expected 200 in 0 hops`);
    }
  } else if (finalStatus === 200 || redirectHops.length > 0) {
    const permanent = redirectHops.every((hop) => hop.status === 301 || hop.status === 308);
    if (redirectHops.length >= 2) {
      issues.push(`multi-hop chain (${redirectHops.length} redirects)`);
    } else if (redirectHops.length === 1 && !permanent) {
      issues.push(`redirect status ${redirectHops[0].status} is not 301 or 308`);
    } else if (redirectHops.length === 0 && finalStatus === 200) {
      issues.push('legacy URL returned 200 without a redirect');
    } else if (redirectHops.length === 0 && finalStatus !== 200 && !broken) {
      issues.push(`legacy URL ended at HTTP ${finalStatus} without a redirect`);
    }
  }

  let canonical = null;
  const skipCanonical = isGoPath(target.url) || isGoPath(finalUrl);
  if (finalStatus === 200 && !skipCanonical) {
    canonical = terminal.canonical ?? null;
    if (!canonical) {
      issues.push('missing canonical');
    } else {
      let resolved = null;
      try {
        resolved = new URL(canonical, finalUrl).href;
      } catch {
        issues.push(`invalid canonical: ${canonical}`);
      }
      if (resolved) {
        const parsed = new URL(resolved);
        if (resolved !== finalUrl) issues.push(`canonical ${resolved} !== final ${finalUrl}`);
        if (parsed.protocol !== 'https:') issues.push(`canonical protocol is ${parsed.protocol}`);
        if (parsed.hostname !== 'www.thehrstackguide.com') {
          issues.push(`canonical host is ${parsed.hostname}`);
        }
        if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) {
          issues.push('canonical is missing a trailing slash');
        }
      }
    }
  }

  const robotsValues = [
    ...hops.map((hop) => hop.xRobotsTag).filter(Boolean),
    ...(terminal.metaRobots ?? []),
  ];
  const noindex = target.kind === 'sitemap' && hasNoindex(robotsValues);
  if (noindex) issues.push(`accidental noindex: ${robotsValues.filter((value) => /noindex/i.test(value)).join(' | ')}`);

  const multiHop =
    redirectHops.length >= 2 ||
    (target.kind === 'sitemap' && redirectHops.length > 0) ||
    issues.some((issue) => issue.startsWith('redirect status'));
  const canonicalMismatch = issues.some(
    (issue) =>
      issue.startsWith('canonical') ||
      issue.startsWith('missing canonical') ||
      issue.startsWith('invalid canonical'),
  );

  return {
    url: target.url,
    kind: target.kind,
    passed: issues.length === 0,
    finalUrl,
    finalStatus,
    redirectHops: redirectHops.length,
    chain: hops.map((hop) => ({
      url: hop.url,
      status: hop.status,
      location: hop.location ?? null,
      ...(hop.error ? { error: hop.error } : {}),
    })),
    canonical: finalStatus === 200 ? terminal.canonical ?? null : null,
    noindex,
    issues,
    flags: {
      multiHop,
      broken: broken || issues.some((issue) => issue.startsWith('request failed') || issue.startsWith('HTTP ')),
      canonicalMismatch,
      accidentalNoindex: noindex,
    },
  };
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

function listSection(title, rows, format) {
  const lines = [`### ${title} (${rows.length})`, ''];
  if (rows.length === 0) {
    lines.push('_None._', '');
    return lines.join('\n');
  }
  for (const row of rows) lines.push(`- ${format(row)}`);
  lines.push('');
  return lines.join('\n');
}

function printReport(summary, results) {
  const multiHop = results.filter((row) => row.flags.multiHop);
  const broken = results.filter((row) => row.flags.broken);
  const canonical = results.filter((row) => row.flags.canonicalMismatch);
  const noindex = results.filter((row) => row.flags.accidentalNoindex);
  const missingRedirect = results.filter((row) =>
    row.issues.some((issue) => issue.includes('without a redirect')),
  );

  const table = [
    '| Metric | Count |',
    '| --- | ---: |',
    `| Total URLs audited | ${summary.total} |`,
    `| Sitemap URLs | ${summary.sitemap} |`,
    `| Legacy URLs | ${summary.legacy} |`,
    `| Passed | ${summary.passed} |`,
    `| Multi-hop chains (>1 hop) | ${summary.multiHop} |`,
    `| 404 / broken | ${summary.broken} |`,
    `| Canonical mismatches | ${summary.canonicalMismatches} |`,
    `| Accidental noindex | ${summary.accidentalNoindex} |`,
  ];

  const body = [
    table.join('\n'),
    '',
    listSection('Multi-hop chains (>1 hop)', multiHop, (row) => {
      const chain = row.chain.map((hop) => `${hop.status} ${hop.url}`).join(' → ');
      return `\`${row.url}\` — ${chain}`;
    }),
    listSection('404 / broken URLs', broken, (row) => {
      const detail = row.issues.filter((issue) => issue.startsWith('HTTP') || issue.startsWith('request failed')).join('; ');
      return `\`${row.url}\` — ${detail || `HTTP ${row.finalStatus}`}`;
    }),
    listSection('Canonical mismatches', canonical, (row) => {
      const detail = row.issues.filter((issue) => /canonical/i.test(issue)).join('; ');
      return `\`${row.finalUrl}\` — ${detail}`;
    }),
    listSection('Accidental noindex tags', noindex, (row) => {
      const detail = row.issues.filter((issue) => issue.startsWith('accidental noindex')).join('; ');
      return `\`${row.url}\` — ${detail}`;
    }),
    listSection('Legacy URLs that did not redirect', missingRedirect, (row) => `\`${row.url}\` — HTTP ${row.finalStatus}`),
  ];

  console.log(body.join('\n'));
}

async function main() {
  process.stderr.write('Collecting sitemap URLs...\n');
  const sitemapUrls = await collectSitemapUrls();
  process.stderr.write(`Collecting legacy URLs from vercel.json...\n`);
  const legacyPaths = collectLegacyPaths();

  const sitemapSet = new Set(sitemapUrls.map((url) => toAbsolute(url)));
  const targets = [];
  const seen = new Set();

  function add(url, kind) {
    const absolute = toAbsolute(url);
    if (seen.has(absolute)) return;
    seen.add(absolute);
    targets.push({ url: absolute, kind });
  }

  for (const url of sitemapUrls) add(url, 'sitemap');
  for (const pathname of legacyPaths) {
    const absolute = toAbsolute(pathname);
    if (sitemapSet.has(absolute)) continue;
    add(pathname, 'legacy');
  }

  process.stderr.write(`Auditing ${targets.length} URLs (concurrency ${CONCURRENCY})...\n`);
  let finished = 0;
  const results = await mapPool(targets, CONCURRENCY, async (target) => {
    const result = await auditUrl(target);
    finished += 1;
    if (finished % 25 === 0 || finished === targets.length) {
      process.stderr.write(`  ${finished}/${targets.length}\n`);
    }
    return result;
  });

  const summary = {
    total: results.length,
    sitemap: results.filter((row) => row.kind === 'sitemap').length,
    legacy: results.filter((row) => row.kind === 'legacy').length,
    passed: results.filter((row) => row.passed).length,
    multiHop: results.filter((row) => row.flags.multiHop).length,
    broken: results.filter((row) => row.flags.broken).length,
    canonicalMismatches: results.filter((row) => row.flags.canonicalMismatch).length,
    accidentalNoindex: results.filter((row) => row.flags.accidentalNoindex).length,
  };

  const report = {
    auditedAt: new Date().toISOString(),
    origin: ORIGIN,
    summary,
    multiHopChains: results.filter((row) => row.flags.multiHop),
    broken: results.filter((row) => row.flags.broken),
    canonicalMismatches: results.filter((row) => row.flags.canonicalMismatch),
    accidentalNoindex: results.filter((row) => row.flags.accidentalNoindex),
    results,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  printReport(summary, results);
  process.stderr.write(`Wrote ${REPORT_PATH}\n`);
  if (summary.passed !== summary.total) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
