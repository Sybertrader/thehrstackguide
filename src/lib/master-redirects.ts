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
import { comparisonHubSlug } from './comparison-routes.ts';
import { DELETED_PATHS, isGonePath } from './gone.ts';

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
  'bamboohr-ats': 'bamboohr',
};

const CANONICAL_TO_ALIASES = {
  'oyster-hr': ['oyster'],
  'papaya-global': ['papaya'],
  bamboohr: ['bamboohr-ats'],
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
    const hub = comparisonHubSlug(row.tool_a_id, row.tool_b_id);
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
  if (isGonePath(raw)) return null;
  const exactHub = exactParentHubBySource.get(stripTrailingSlash(raw));
  if (exactHub) return exactHub;
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
 * Named-regex bodies that would otherwise match any `-vs-` slug, including
 * Reflektive URLs that must 410 instead of 308. Vercel/path-to-regexp accepts
 * this lookahead (same shape as the headers matcher `/((?!api/|go/).*)`).
 */
const REFLEKTIVE_LOOKAHEAD = '(?!.*reflektive)';

/** One comparison-hub token that stops before a `-for-{persona}` suffix. */
const HUB_SLUG_TOKEN = '[a-z0-9]+(?:-(?!for-)[a-z0-9]+)*';

function excludeReflektive(regex) {
  // Non-reflektive DELETED_PATHS must not match 308 catch-alls: Vercel
  // redirects run before rewrites, so a peoplefluent/15five hub would 308
  // instead of rewriting to /api/gone. Reflektive URLs are already excluded
  // by REFLEKTIVE_LOOKAHEAD.
  const deletedLookaheads = DELETED_PATHS.filter(
    (gonePath) => !gonePath.toLowerCase().includes('reflektive'),
  )
    .map((gonePath) => `(?!${escapeRegex(gonePath.replace(/^\//, ''))})`)
    .join('');
  return `${REFLEKTIVE_LOOKAHEAD}${deletedLookaheads}${regex}`;
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
 * Exact long-tail → 1:1 parent comparison hub. Must sit before leapsome and
 * purged-vendor catch-alls so these URLs never 308 to a category hub.
 * Sources are stored without a trailing slash; destinations always have one.
 */
export const EXACT_PARENT_HUB_REDIRECTS = [
  ['/oyster-vs-plane-for-tech-startups', '/oyster-vs-plane/'],
  ['/oyster-vs-multiplier-for-us-latam', '/oyster-vs-multiplier/'],
  ['/oyster-vs-multiplier-for-tech-startups', '/oyster-vs-multiplier/'],
  ['/remote-vs-papaya-for-web3-crypto', '/remote-vs-papaya/'],
  ['/rippling-vs-remote-for-scaleups', '/rippling-vs-remote/'],
  ['/papaya-vs-multiplier-for-scaleups', '/papaya-vs-multiplier/'],
  ['/remote-vs-multiplier-for-web3-crypto', '/remote-vs-multiplier/'],
  ['/deel-vs-papaya-for-us-latam', '/deel-vs-papaya/'],
  ['/rippling-vs-remote-for-web3-crypto', '/rippling-vs-remote/'],
  ['/rippling-vs-oyster-for-agencies', '/rippling-vs-oyster/'],
  ['/workable-vs-breezy-hr-for-enterprise', '/workable-vs-breezy-hr/'],
  ['/ashby-vs-lever-for-remote-teams', '/ashby-vs-lever/'],
  ['/performyard-vs-lattice-for-scaleups', '/performyard-vs-lattice/'],
  ['/15five-vs-lattice-for-enterprise', '/15five-vs-lattice/'],
  ['/leapsome-vs-clearcompany-for-scaleups', '/leapsome-vs-clearcompany/'],
  ['/performyard-vs-lattice-for-enterprise', '/performyard-vs-lattice/'],
  ['/culture-amp-vs-clearcompany-for-enterprise', '/culture-amp-vs-clearcompany/'],
  ['/recruitee-vs-bamboohr-ats-for-scaleups', '/recruitee-vs-bamboohr-ats/'],
  ['/workable-vs-recruitee-for-startups', '/workable-vs-recruitee/'],
  ['/deel-vs-rippling-for-web3-crypto', '/deel-vs-rippling/'],
  ['/jazzhr-vs-recruitee-for-enterprise', '/jazzhr-vs-recruitee/'],
  ['/15five-vs-performyard-for-people-ops', '/15five-vs-performyard/'],
  ['/15five-vs-leapsome-for-scaleups', '/15five-vs-leapsome/'],
  ['/15five-vs-lattice-for-startups', '/15five-vs-lattice/'],
  ['/15five-vs-performyard-for-scaleups', '/15five-vs-performyard/'],
  ['/15five-vs-culture-amp-for-people-ops', '/15five-vs-culture-amp/'],
  ['/performyard-vs-lattice-for-people-ops', '/performyard-vs-lattice/'],
  ['/greenhouse-vs-lever-for-remote-teams', '/greenhouse-vs-lever/'],
  ['/greenhouse-vs-bamboohr-ats-for-scaleups', '/greenhouse-vs-bamboohr-ats/'],
  ['/ashby-vs-bamboohr-ats-for-startups', '/ashby-vs-bamboohr-ats/'],
  ['/breezy-hr-vs-jazzhr-for-startups', '/breezy-hr-vs-jazzhr/'],
  ['/lever-vs-recruitee-for-scaleups', '/lever-vs-recruitee/'],
  ['/breezy-hr-vs-jazzhr-for-enterprise', '/breezy-hr-vs-jazzhr/'],
  ['/ashby-vs-workable-for-startups', '/ashby-vs-workable/'],
  ['/papaya-vs-multiplier-for-tech-startups', '/papaya-vs-multiplier/'],
  ['/ashby-vs-breezy-hr-for-scaleups', '/ashby-vs-breezy-hr/'],
  ['/rippling-vs-plane-for-scaleups', '/rippling-vs-plane/'],
  ['/remote-vs-multiplier-for-tech-startups', '/remote-vs-multiplier/'],
  ['/greenhouse-vs-breezy-hr-for-startups', '/greenhouse-vs-breezy-hr/'],
  ['/jazzhr-vs-bamboohr-ats-for-agencies', '/jazzhr-vs-bamboohr-ats/'],
  ['/deel-vs-remote-for-agencies', '/deel-vs-remote/'],
  ['/rippling-vs-papaya-for-tech-startups', '/rippling-vs-papaya/'],
  ['/deel-vs-gusto-for-tech-startups', '/deel-vs-gusto/'],
  ['/deel-vs-papaya-for-web3-crypto', '/deel-vs-papaya/'],
  ['/deel-vs-plane-for-us-latam', '/deel-vs-plane/'],
  ['/papaya-vs-multiplier-for-web3-crypto', '/papaya-vs-multiplier/'],
  ['/deel-vs-multiplier-for-scaleups', '/deel-vs-multiplier/'],
  ['/rippling-vs-gusto-for-agencies', '/rippling-vs-gusto/'],
  ['/rippling-vs-oyster-for-us-latam', '/rippling-vs-oyster/'],
  ['/deel-vs-oyster-for-web3-crypto', '/deel-vs-oyster/'],
  ['/rippling-vs-papaya-for-agencies', '/rippling-vs-papaya/'],
  ['/greenhouse-vs-recruitee-for-scaleups', '/greenhouse-vs-recruitee/'],
  ['/performyard-vs-leapsome-for-scaleups', '/performyard-vs-leapsome/'],
  ['/performyard-vs-clearcompany-for-enterprise', '/performyard-vs-clearcompany/'],
  ['/15five-vs-leapsome-for-startups', '/15five-vs-leapsome/'],
  ['/performyard-vs-clearcompany-for-scaleups', '/performyard-vs-clearcompany/'],
  ['/leapsome-vs-culture-amp-for-enterprise', '/leapsome-vs-culture-amp/'],
  ['/leapsome-vs-culture-amp-for-scaleups', '/leapsome-vs-culture-amp/'],
  ['/leapsome-vs-culture-amp-for-people-ops', '/leapsome-vs-culture-amp/'],
  ['/performyard-vs-leapsome-for-enterprise', '/performyard-vs-leapsome/'],
  ['/leapsome-vs-lattice-for-scaleups', '/leapsome-vs-lattice/'],
  ['/greenhouse-vs-workable-for-startups', '/greenhouse-vs-workable/'],
  ['/performyard-vs-leapsome-for-people-ops', '/performyard-vs-leapsome/'],
  ['/greenhouse-vs-breezy-hr-for-scaleups', '/greenhouse-vs-breezy-hr/'],
  ['/greenhouse-vs-jazzhr-for-scaleups', '/greenhouse-vs-jazzhr/'],
  ['/leapsome-vs-lattice-for-enterprise', '/leapsome-vs-lattice/'],
  ['/greenhouse-vs-jazzhr-for-startups', '/greenhouse-vs-jazzhr/'],
  ['/performyard-vs-clearcompany-for-startups', '/performyard-vs-clearcompany/'],
  ['/rippling-vs-plane-for-startups', '/rippling-vs-plane/'],
  ['/greenhouse-vs-bamboohr-ats-for-remote-teams', '/greenhouse-vs-bamboohr-ats/'],
  ['/greenhouse-vs-workable-for-scaleups', '/greenhouse-vs-workable/'],
  ['/greenhouse-vs-lever-for-scaleups', '/greenhouse-vs-lever/'],
  ['/deel-vs-plane-for-web3-crypto', '/deel-vs-plane/'],
  ['/15five-vs-lattice-for-scaleups', '/15five-vs-lattice/'],
  ['/ashby-vs-greenhouse-for-scaleups', '/ashby-vs-greenhouse/'],
  ['/greenhouse-vs-lever-for-enterprise', '/greenhouse-vs-lever/'],
  ['/papaya-vs-plane-for-us-latam', '/papaya-vs-plane/'],
  ['/papaya-vs-plane-for-web3-crypto', '/papaya-vs-plane/'],
  ['/multiplier-vs-plane-for-web3-crypto', '/multiplier-vs-plane/'],
  ['/oyster-vs-plane-for-web3-crypto', '/oyster-vs-plane/'],
  ['/rippling-vs-plane-for-us-latam', '/rippling-vs-plane/'],
  ['/greenhouse-vs-recruitee-for-startups', '/greenhouse-vs-recruitee/'],
  ['/ashby-vs-greenhouse-for-startups', '/ashby-vs-greenhouse/'],
  ['/multiplier-vs-plane-for-scaleups', '/multiplier-vs-plane/'],
  ['/culture-amp-vs-clearcompany-for-remote-teams', '/culture-amp-vs-clearcompany/'],
  ['/performyard-vs-leapsome-for-remote-teams', '/performyard-vs-leapsome/'],
  ['/leapsome-vs-clearcompany-for-remote-teams', '/leapsome-vs-clearcompany/'],
  ['/leapsome-vs-lattice-for-startups', '/leapsome-vs-lattice/'],
  ['/15five-vs-clearcompany-for-scaleups', '/15five-vs-clearcompany/'],
  ['/lattice-vs-clearcompany-for-remote-teams', '/lattice-vs-clearcompany/'],
  ['/leapsome-vs-clearcompany-for-startups', '/leapsome-vs-clearcompany/'],
  ['/15five-vs-clearcompany-for-enterprise', '/15five-vs-clearcompany/'],
  ['/15five-vs-clearcompany-for-people-ops', '/15five-vs-clearcompany/'],
  ['/15five-vs-performyard-for-enterprise', '/15five-vs-performyard/'],
  ['/leapsome-vs-culture-amp-for-startups', '/leapsome-vs-culture-amp/'],
  ['/lattice-vs-clearcompany-for-startups', '/lattice-vs-clearcompany/'],
  ['/15five-vs-culture-amp-for-enterprise', '/15five-vs-culture-amp/'],
  ['/performyard-vs-leapsome-for-startups', '/performyard-vs-leapsome/'],
  ['/greenhouse-vs-bamboohr-ats-for-enterprise', '/greenhouse-vs-bamboohr-ats/'],
  ['/multiplier-vs-plane-for-tech-startups', '/multiplier-vs-plane/'],
  ['/greenhouse-vs-workable-for-agencies', '/greenhouse-vs-workable/'],
  ['/greenhouse-vs-bamboohr-ats-for-startups', '/greenhouse-vs-bamboohr-ats/'],
  ['/greenhouse-vs-jazzhr-for-enterprise', '/greenhouse-vs-jazzhr/'],
  ['/greenhouse-vs-recruitee-for-agencies', '/greenhouse-vs-recruitee/'],
  ['/papaya-vs-plane-for-agencies', '/papaya-vs-plane/'],
  ['/15five-vs-culture-amp-for-startups', '/15five-vs-culture-amp/'],
  ['/15five-vs-performyard-for-startups', '/15five-vs-performyard/'],
  ['/greenhouse-vs-recruitee-for-remote-teams', '/greenhouse-vs-recruitee/'],
  ['/ashby-vs-greenhouse-for-enterprise', '/ashby-vs-greenhouse/'],
  ['/gusto-vs-plane-for-us-latam', '/gusto-vs-plane/'],
  ['/greenhouse-vs-breezy-hr-for-enterprise', '/greenhouse-vs-breezy-hr/'],
  ['/greenhouse-vs-recruitee-for-enterprise', '/greenhouse-vs-recruitee/'],
  ['/oyster-vs-plane-for-scaleups', '/oyster-vs-plane/'],
  ['/papaya-vs-plane-for-tech-startups', '/papaya-vs-plane/'],
  ['/papaya-vs-plane-for-scaleups', '/papaya-vs-plane/'],
  ['/multiplier-vs-plane-for-us-latam', '/multiplier-vs-plane/'],
  ['/rippling-vs-plane-for-tech-startups', '/rippling-vs-plane/'],
  ['/ashby-vs-greenhouse-for-agencies', '/ashby-vs-greenhouse/'],
  ['/greenhouse-vs-jazzhr-for-agencies', '/greenhouse-vs-jazzhr/'],
  ['/greenhouse-vs-bamboohr-ats-for-agencies', '/greenhouse-vs-bamboohr-ats/'],
  ['/rippling-vs-plane-for-web3-crypto', '/rippling-vs-plane/'],
  ['/multiplier-vs-plane-for-agencies', '/multiplier-vs-plane/'],
  ['/rippling-vs-plane-for-agencies', '/rippling-vs-plane/'],
  ['/greenhouse-vs-lever-for-agencies', '/greenhouse-vs-lever/'],
  ['/greenhouse-vs-breezy-hr-for-agencies', '/greenhouse-vs-breezy-hr/'],
  ['/deel-vs-plane-for-scaleups', '/deel-vs-plane/'],
  ['/oyster-vs-plane-for-us-latam', '/oyster-vs-plane/'],
  ['/deel-vs-plane-for-tech-startups', '/deel-vs-plane/'],
  ['/oyster-vs-plane-for-agencies', '/oyster-vs-plane/'],
  ['/deel-vs-plane-for-agencies', '/deel-vs-plane/'],
];

const exactParentHubBySource = new Map(EXACT_PARENT_HUB_REDIRECTS);

export function buildExactParentHubRedirects() {
  const redirects = [];
  const seen = new Set();
  for (const [source, destination] of EXACT_PARENT_HUB_REDIRECTS) {
    for (const rule of slashPair(source, destination)) {
      if (seen.has(rule.source)) continue;
      seen.add(rule.source);
      redirects.push(rule);
    }
  }
  return redirects;
}

/**
 * Any URL containing `leapsome` (purged vendor) 308s to the PM hub.
 * Sits after the exact long-tail → parent-hub rules so those never
 * collapse to the category hub. Negative lookaheads keep Reflektive 410s
 * and `-for-{persona}` long-tails out of this catch-all (persona rules
 * send leftover `-for-*` to the 1:1 parent instead).
 *
 * Do not use `/:path*leapsome:path*` — duplicate `:path*` names are invalid
 * path-to-regexp and can 502 at the edge. Named regex `:path(.*leapsome.*)`
 * is the legal equivalent of “contains leapsome”.
 */
export function buildLeapsomeCatchAllRedirects() {
  const hub = '/performance-management/';
  const body = excludeReflektive(`(?!.*-for-).*leapsome.*`);
  return [
    { source: namedSegment(body), destination: hub, statusCode: REDIRECT_STATUS },
    { source: `${namedSegment(body)}/`, destination: hub, statusCode: REDIRECT_STATUS },
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
    if (id === 'clearco' || id === 'clear-co' || id === 'reflektive') continue;
    const escaped = escapeRegex(id);
    // Exact `{id}-vs-{partner}` hubs only. Do not swallow `-for-{persona}`
    // long-tails (those 308 to the 1:1 parent, including exact mappings).
    pushNamed(excludeReflektive(`${escaped}-vs-${HUB_SLUG_TOKEN}`), hub);
    pushNamed(excludeReflektive(`${HUB_SLUG_TOKEN}-vs-${escaped}`), hub);
    push(`/go/${id}`, hub);
    push(`/go/${id}/`, hub);
  }

  return redirects;
}

export function buildLiveMasterRedirects() {
  const redirects = [];
  const seen = new Set();

  function pushAll(sourceSlug, destination) {
    const forBody = excludeReflektive(`${escapeRegex(sourceSlug)}-for-.*`);
    for (const rule of [
      ...slashPair(`/${sourceSlug}`, destination),
      {
        source: namedSegment(forBody),
        destination,
        statusCode: REDIRECT_STATUS,
      },
      {
        source: `${namedSegment(forBody)}/`,
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
 * `/{brand-vs-brand}/` in one 308 (the 1:1 parent, never a category hub).
 * Named regex + a character-class param (never `:mod*`) so Vercel can
 * compile the rule. Must sit AFTER exact parent-hub + purged + reverse/alias
 * rules so those destinations stay 1-hop.
 *
 * Known persona suffixes are listed first (one named group, proven
 * leapsome-shaped). The generic `:mod([a-z0-9-]+)` rule covers typos and
 * future niche ids so they 308 to the hub instead of 502.
 * Reflektive paths are excluded so they fall through to 410.
 */
export function buildSegmentCatchAllRedirects() {
  const redirects = [];
  const seen = new Set();

  function push(source, destination) {
    if (seen.has(source)) return;
    seen.add(source);
    redirects.push({ source, destination, statusCode: REDIRECT_STATUS });
  }

  const hubGroup = `/:hub(${excludeReflektive('.*-vs-.*')})`;

  for (const suffix of LEGACY_PERSONA_SUFFIXES) {
    const escaped = escapeRegex(suffix);
    push(`${hubGroup}-for-${escaped}`, '/:hub/');
    push(`${hubGroup}-for-${escaped}/`, '/:hub/');
  }

  push(`${hubGroup}-for-:mod([a-z0-9-]+)`, '/:hub/');
  push(`${hubGroup}-for-:mod([a-z0-9-]+)/`, '/:hub/');

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
  // Exact long-tail → parent-hub rules first: Vercel first-match so they win over catch-alls.
  const redirects = [
    ...buildExactParentHubRedirects(),
    ...buildLeapsomeCatchAllRedirects(),
    ...buildPurgedVendorRedirects(),
    ...buildLiveMasterRedirects(),
    ...buildSegmentCatchAllRedirects(),
    ...buildGoAliasRedirects(),
  ].filter((rule) => rule.source.includes(':') || !isGonePath(rule.source));
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
  if (isGonePath(normalized)) return false;
  // `-for-{segment}` URLs, reverse vendor order, and purged-vendor slugs are
  // all 308 sources; submitting a redirect is a crawl-budget own goal.
  if (SEGMENT_SUFFIX_RE.test(stripTrailingSlash(pathname))) return false;
  if (resolveMasterRedirect(normalized)) return false;
  if (rendersNoindex(normalized)) return false;

  return true;
}
