/**
 * Master 1-1 comparison architecture.
 *
 * Live HTML is only `/vendor-a-vs-vendor-b/`. Every `-for-{segment}` URL, plus
 * reverse vendor order and legacy id aliases, 308s to that hub in one hop.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

export const SITE_ORIGIN = 'https://www.thehrstackguide.com';
export const REDIRECT_STATUS = 308;

/**
 * Sitemap policy: every page Astro builds is submitted unless a rule below
 * excludes it. This is deliberately an exclusion list rather than an
 * allowlist, so a new page in src/pages/ is indexable the moment it ships
 * instead of silently sitting out of the sitemap until someone remembers it.
 */

/** Affiliate cloaks and API endpoints are never search results. */
const SITEMAP_EXCLUDED_PREFIXES = ['/go/', '/api/'];

/** Utility routes with no search intent of their own. */
const SITEMAP_EXCLUDED_PATHS = new Set(['/404/', '/thank-you/']);

/**
 * Matches `<meta name="robots" content="noindex, nofollow">` in any attribute
 * order. Submitting a noindex URL trips "Submitted URL marked noindex" in
 * Search Console, so the rendered page always overrules the default include.
 */
const ROBOTS_NOINDEX_RE = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i;

const CATEGORY_HUB_BY_ID = {
  'payroll-eor': '/global-payroll-eor/',
  ats: '/applicant-tracking-systems/',
  'performance-management': '/performance-management/',
};

/** Public slug aliases that must never become a second hop. */
const ID_ALIASES = {
  oyster: 'oyster-hr',
  papaya: 'papaya-global',
};

const CANONICAL_TO_ALIASES = {
  'oyster-hr': ['oyster'],
  'papaya-global': ['papaya'],
};

const SEGMENT_SUFFIX_RE = /-for-[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const VS_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const MASTER_PATH_RE = /^\/[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*\/$/;

let cachedHubs = null;
let cachedCatalog = null;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadCatalog() {
  if (cachedCatalog) return cachedCatalog;
  cachedCatalog = readJson(path.join(process.cwd(), 'src/data/vendor-catalog.json'));
  return cachedCatalog;
}

function liveVendorIds() {
  return new Set((loadCatalog().keepVendors ?? []).map((vendor) => vendor.id));
}

function purgedVendorHub() {
  const map = new Map();
  for (const vendor of loadCatalog().purgeVendors ?? []) {
    map.set(vendor.id, CATEGORY_HUB_BY_ID[vendor.category] ?? '/');
  }
  map.set('reflektive', '/performance-management/');
  map.set('clearco', '/performance-management/');
  map.set('clear-co', '/performance-management/');
  return map;
}

export function withTrailingSlash(pathname) {
  if (!pathname || pathname === '/') return '/';
  const [pathOnly, query] = pathname.split('?');
  const [clean, hash] = pathOnly.split('#');
  const slashed = clean.endsWith('/') ? clean : `${clean}/`;
  return `${slashed}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

export function stripTrailingSlash(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function stripSegmentSuffix(slug) {
  return slug.replace(SEGMENT_SUFFIX_RE, '');
}

export function applyVendorAliases(slug) {
  return slug
    .split('-vs-')
    .map((token) => ID_ALIASES[token] ?? token)
    .join('-vs-');
}

export function splitVs(slug) {
  const vsIndex = slug.indexOf('-vs-');
  if (vsIndex === -1) return null;
  const toolA = slug.slice(0, vsIndex);
  const toolB = slug.slice(vsIndex + 4);
  if (!toolA || !toolB || toolB.includes('-vs-')) return null;
  return { toolA, toolB };
}

function loadCanonicalHubs() {
  if (cachedHubs) return cachedHubs;
  const live = liveVendorIds();
  const csvPath = path.join(process.cwd(), 'comparisons.csv');
  const rows = parse(fs.readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
  });
  const hubs = new Set();
  for (const row of rows) {
    if (!live.has(row.tool_a_id) || !live.has(row.tool_b_id)) continue;
    const hub = `${row.tool_a_id}-vs-${row.tool_b_id}`;
    if (VS_SLUG_RE.test(hub)) hubs.add(hub);
  }
  cachedHubs = hubs;
  return hubs;
}

function canonicalizeHub(hubSlug) {
  const hubs = loadCanonicalHubs();
  if (hubs.has(hubSlug)) return hubSlug;
  const parts = splitVs(hubSlug);
  if (!parts) return null;
  const inverted = `${parts.toolB}-vs-${parts.toolA}`;
  if (hubs.has(inverted)) return inverted;
  return null;
}

function idVariants(id) {
  return [id, ...(CANONICAL_TO_ALIASES[id] ?? [])];
}

function nonCanonicalSources(canonicalHub) {
  const parts = splitVs(canonicalHub);
  if (!parts) return [];
  const sources = new Set();
  for (const toolA of idVariants(parts.toolA)) {
    for (const toolB of idVariants(parts.toolB)) {
      sources.add(`${toolA}-vs-${toolB}`);
      sources.add(`${toolB}-vs-${toolA}`);
    }
  }
  sources.delete(canonicalHub);
  return [...sources];
}

export function isMasterComparisonPath(pathname) {
  let pathName = pathname;
  try {
    pathName = new URL(pathname, SITE_ORIGIN).pathname;
  } catch {
    /* already a path */
  }
  return MASTER_PATH_RE.test(withTrailingSlash(pathName));
}

/**
 * Final 308 Location path (always trailing slash) or null when this URL
 * is already the canonical resource.
 */
export function resolveMasterRedirect(pathname) {
  let pathName = pathname || '/';
  try {
    if (/^https?:\/\//i.test(pathName)) pathName = new URL(pathName).pathname;
  } catch {
    /* keep pathName */
  }

  const raw = pathName.split('?')[0].split('#')[0] || '/';
  if (raw.toLowerCase().includes('leapsome')) return '/performance-management/';
  if (raw.startsWith('/go') || raw.startsWith('/api/')) return null;

  const slug = stripTrailingSlash(raw).replace(/^\//, '');
  if (!slug || !slug.includes('-vs-')) return null;

  const hubWithSegment = stripSegmentSuffix(slug);
  const tokens = splitVs(applyVendorAliases(hubWithSegment));
  const purged = purgedVendorHub();
  if (tokens) {
    const destA = purged.get(tokens.toolA);
    const destB = purged.get(tokens.toolB);
    if (destA || destB) return destA || destB;
  }

  const aliased = applyVendorAliases(hubWithSegment);
  if (!VS_SLUG_RE.test(aliased)) return null;

  const canonical = canonicalizeHub(aliased);
  if (!canonical) return null;

  const destination = `/${canonical}/`;
  const alreadyCanonical = withTrailingSlash(raw) === destination && slug === canonical;
  return alreadyCanonical ? null : destination;
}

function slashPair(sourcePath, destination) {
  const trimmed = sourcePath.endsWith('/') ? sourcePath.slice(0, -1) : sourcePath;
  return [
    { source: trimmed, destination, statusCode: REDIRECT_STATUS },
    { source: `${trimmed}/`, destination, statusCode: REDIRECT_STATUS },
  ];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Named-regex path segment. Legal on Vercel; `:param*` glued to a literal
 * in the same segment (`/greenhouse-vs-:rest*`, `/:pair*-vs-greenhouse`)
 * is not, and 502s as ROUTER_CANNOT_MATCH at the edge.
 */
function namedSegment(regex) {
  return `/:path(${regex})`;
}

/**
 * True when a `source` would 502 on Vercel: a splat sharing a path segment
 * with a literal. `/go/:path*` is legal because the splat is the whole
 * remaining segment.
 */
export function isUnsafeVercelRedirectSource(source) {
  if (/:[A-Za-z0-9]+\*[^/]/.test(source)) return true;
  if (/[^/]:[A-Za-z0-9]+\*/.test(source)) return true;
  return false;
}

export function assertSafeVercelRedirects(redirects) {
  const unsafe = redirects
    .map((rule) => rule.source)
    .filter((source) => isUnsafeVercelRedirectSource(source));
  if (unsafe.length) {
    throw new Error(
      `Unsafe Vercel redirect sources (ROUTER_CANNOT_MATCH): ${unsafe.slice(0, 8).join(', ')}`,
    );
  }
}

/**
 * Persona / sub-niche suffixes that used to have their own HTML
 * (`/{a}-vs-{b}-for-startups/`, etc.). The catch-all 308s these to the
 * 1-to-1 hub. Includes plural and truncated aliases that were never CSV
 * niche ids but still appear in external links and Search Console.
 */
export const LEGACY_PERSONA_SUFFIXES = [
  'tech-startups',
  'web3-crypto',
  'remote-teams',
  'people-ops',
  'enterprises',
  'us-latam',
  'startups',
  'scaleups',
  'enterprise',
  'agencies',
  'web3',
];

/**
 * Any URL containing `leapsome` (purged vendor) 308s to the PM hub.
 * Must sit first so leftover `/leapsome`, nested paths, and odd suffixes
 * never fall through to Vercel ROUTER_CANNOT_MATCH.
 *
 * Do not use `/:path*leapsome:path*` — duplicate `:path*` names are invalid
 * path-to-regexp and can 502 at the edge. Named regex `:path(.*leapsome.*)`
 * is the legal equivalent of “contains leapsome”.
 */
export function buildLeapsomeCatchAllRedirects() {
  const hub = '/performance-management/';
  return [
    { source: '/:path(.*leapsome.*)', destination: hub, statusCode: REDIRECT_STATUS },
    { source: '/:path(.*leapsome.*)/', destination: hub, statusCode: REDIRECT_STATUS },
  ];
}

export function buildPurgedVendorRedirects() {
  const redirects = [];
  const seen = new Set();

  function push(source, destination) {
    if (seen.has(source)) return;
    seen.add(source);
    redirects.push({ source, destination, statusCode: REDIRECT_STATUS });
  }

  function pushNamed(regex, destination) {
    push(namedSegment(regex), destination);
    push(`${namedSegment(regex)}/`, destination);
  }

  for (const [id, hub] of purgedVendorHub()) {
    if (id === 'clearco' || id === 'clear-co') continue;
    const escaped = escapeRegex(id);
    // `{id}-vs-{anything}` including `-for-{persona}`.
    pushNamed(`${escaped}-vs-.*`, hub);
    // `{anything}-vs-{id}` and `{anything}-vs-{id}-for-{persona}`.
    pushNamed(`.*-vs-${escaped}(?:-.*)?`, hub);
    push(`/go/${id}`, hub);
    push(`/go/${id}/`, hub);
  }

  const pm = '/performance-management/';
  push('/performyard-vs-reflektive-for-enterprise', pm);
  push('/performyard-vs-reflektive-for-enterprise/', pm);
  push('/leapsome-vs-reflektive-for-scaleups', pm);
  push('/leapsome-vs-reflektive-for-scaleups/', pm);
  pushNamed('reflektive-vs-.*', pm);
  pushNamed('.*-vs-reflektive(?:-.*)?', pm);

  return redirects;
}

export function buildLiveMasterRedirects() {
  const redirects = [];
  const seen = new Set();

  function pushAll(sourceSlug, destination) {
    for (const rule of [
      ...slashPair(`/${sourceSlug}`, destination),
      {
        source: namedSegment(`${escapeRegex(sourceSlug)}-for-.*`),
        destination,
        statusCode: REDIRECT_STATUS,
      },
      {
        source: `${namedSegment(`${escapeRegex(sourceSlug)}-for-.*`)}/`,
        destination,
        statusCode: REDIRECT_STATUS,
      },
    ]) {
      if (seen.has(rule.source)) continue;
      seen.add(rule.source);
      redirects.push(rule);
    }
  }

  for (const hub of [...loadCanonicalHubs()].sort()) {
    const destination = `/${hub}/`;
    for (const source of nonCanonicalSources(hub)) {
      pushAll(source, destination);
    }
  }

  return redirects;
}

/**
 * Catch-all: any remaining `brand-vs-brand-for-{segment}` collapses to
 * `/{brand-vs-brand}/` in one 308. Named regex + a character-class param
 * (never `:mod*`) so Vercel can compile the rule. Must sit AFTER purged
 * + reverse/alias rules so those destinations stay 1-hop.
 *
 * Known persona suffixes are listed first (one named group, proven
 * leapsome-shaped). The generic `:mod([a-z0-9-]+)` rule covers typos and
 * future niche ids so they 308 to the hub instead of 502.
 */
export function buildSegmentCatchAllRedirects() {
  const redirects = [];
  const seen = new Set();

  function push(source, destination) {
    if (seen.has(source)) return;
    seen.add(source);
    redirects.push({ source, destination, statusCode: REDIRECT_STATUS });
  }

  for (const suffix of LEGACY_PERSONA_SUFFIXES) {
    const escaped = escapeRegex(suffix);
    push(`/:hub(.*-vs-.*)-for-${escaped}`, '/:hub/');
    push(`/:hub(.*-vs-.*)-for-${escaped}/`, '/:hub/');
  }

  push('/:hub(.*-vs-.*)-for-:mod([a-z0-9-]+)', '/:hub/');
  push('/:hub(.*-vs-.*)-for-:mod([a-z0-9-]+)/', '/:hub/');

  return redirects;
}

export function buildGoAliasRedirects() {
  return [
    { source: '/go/oyster', destination: '/go/oyster-hr/', statusCode: REDIRECT_STATUS },
    { source: '/go/oyster/', destination: '/go/oyster-hr/', statusCode: REDIRECT_STATUS },
    { source: '/go/papaya', destination: '/go/papaya-global/', statusCode: REDIRECT_STATUS },
    { source: '/go/papaya/', destination: '/go/papaya-global/', statusCode: REDIRECT_STATUS },
  ];
}

export function buildVercelRedirects() {
  const redirects = [
    ...buildLeapsomeCatchAllRedirects(),
    ...buildPurgedVendorRedirects(),
    ...buildLiveMasterRedirects(),
    ...buildSegmentCatchAllRedirects(),
    ...buildGoAliasRedirects(),
  ];
  assertSafeVercelRedirects(redirects);
  return redirects;
}

/** Reverse-order hubs only. Used by Astro preview; production 308s live in vercel.json. */
export function reverseHubRedirects() {
  const redirects = {};
  for (const hub of loadCanonicalHubs()) {
    const parts = splitVs(hub);
    if (!parts) continue;
    const inverted = `${parts.toolB}-vs-${parts.toolA}`;
    if (inverted === hub) continue;
    redirects[`/${inverted}/`] = `/${hub}/`;
  }
  return redirects;
}

/**
 * Absolute path of the built client output, captured from the Astro config so
 * the filter can read each page's rendered `robots` meta. @astrojs/sitemap
 * hands the filter a URL and nothing else, and it runs at `astro:build:done`
 * once every static page is already on disk.
 */
let sitemapOutputDir = null;

/**
 * Registers the output directory used by `includeInSitemap`. Must be listed in
 * `astro.config.mjs` integrations; without it the sitemap cannot tell an
 * indexable page from a noindex one.
 */
export function sitemapPolicy() {
  return {
    name: 'hrsg-sitemap-policy',
    hooks: {
      'astro:config:done'({ config }) {
        const dir = config.build?.client ?? config.outDir;
        sitemapOutputDir = dir ? fileURLToPath(dir) : null;
      },
    },
  };
}

function rendersNoindex(normalized) {
  if (!sitemapOutputDir) {
    // Failing loudly beats emitting a sitemap that quietly submits noindex URLs.
    throw new Error(
      'sitemapPolicy() is missing from astro.config.mjs integrations, so the sitemap ' +
        'filter cannot read rendered robots meta. Add it before the sitemap() integration.',
    );
  }

  let html;
  try {
    html = fs.readFileSync(path.join(sitemapOutputDir, normalized, 'index.html'), 'utf-8');
  } catch {
    // No prerendered HTML to inspect (on-demand route). Nothing contradicts
    // the default, so let the remaining rules decide.
    return false;
  }
  return ROBOTS_NOINDEX_RE.test(html);
}

/**
 * Include every built page by default; exclude only what the policy above
 * rules out. Returning `true` for an unknown-but-indexable page is the
 * intended behaviour, so new pages never need an entry here.
 */
export function includeInSitemap(page) {
  let pathname = page;
  try {
    pathname = new URL(page).pathname;
  } catch {
    /* already a path */
  }
  const normalized = withTrailingSlash(pathname);

  if (SITEMAP_EXCLUDED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return false;
  if (SITEMAP_EXCLUDED_PATHS.has(normalized)) return false;
  // `-for-{segment}` URLs, reverse vendor order, and purged-vendor slugs are
  // all 308 sources; submitting a redirect is a crawl-budget own goal.
  if (SEGMENT_SUFFIX_RE.test(stripTrailingSlash(pathname))) return false;
  if (resolveMasterRedirect(normalized)) return false;
  if (rendersNoindex(normalized)) return false;

  return true;
}
