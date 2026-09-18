/**
 * Master 1-1 comparison architecture.
 *
 * Live HTML is only `/vendor-a-vs-vendor-b/`. Every `-for-{segment}` URL, plus
 * reverse vendor order and legacy id aliases, 308s to that hub in one hop.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

export const SITE_ORIGIN = 'https://www.thehrstackguide.com';
export const REDIRECT_STATUS = 308;

/** Sitemap allowlist besides live master comparison hubs. */
export const SITEMAP_CORE_PATHS = [
  '/',
  '/global-payroll-eor/',
  '/applicant-tracking-systems/',
  '/performance-management/',
  '/about/',
  '/methodology/',
  '/privacy-policy/',
];

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

export function buildPurgedVendorRedirects() {
  const redirects = [];
  const seen = new Set();

  function push(source, destination) {
    if (seen.has(source)) return;
    seen.add(source);
    redirects.push({ source, destination, statusCode: REDIRECT_STATUS });
  }

  for (const [id, hub] of purgedVendorHub()) {
    if (id === 'clearco' || id === 'clear-co') continue;
    push(`/${id}-vs-:rest*`, hub);
    push(`/${id}-vs-:rest*/`, hub);
    push(`/:pair*-vs-${id}-for-:mod*`, hub);
    push(`/:pair*-vs-${id}-for-:mod*/`, hub);
    push(`/:pair*-vs-${id}`, hub);
    push(`/:pair*-vs-${id}/`, hub);
    push(`/go/${id}`, hub);
    push(`/go/${id}/`, hub);
  }

  push('/performyard-vs-reflektive-for-enterprise', '/performance-management/');
  push('/performyard-vs-reflektive-for-enterprise/', '/performance-management/');
  push('/leapsome-vs-reflektive-for-scaleups', '/performance-management/');
  push('/leapsome-vs-reflektive-for-scaleups/', '/performance-management/');
  push('/reflektive-vs-:rest*', '/performance-management/');
  push('/reflektive-vs-:rest*/', '/performance-management/');
  push('/:pair*-vs-reflektive-for-:mod*', '/performance-management/');
  push('/:pair*-vs-reflektive-for-:mod*/', '/performance-management/');
  push('/:pair*-vs-reflektive', '/performance-management/');
  push('/:pair*-vs-reflektive/', '/performance-management/');

  return redirects;
}

export function buildLiveMasterRedirects() {
  const redirects = [];
  const seen = new Set();

  function pushAll(sourceSlug, destination) {
    for (const rule of [
      ...slashPair(`/${sourceSlug}`, destination),
      {
        source: `/${sourceSlug}-for-:mod*`,
        destination,
        statusCode: REDIRECT_STATUS,
      },
      {
        source: `/${sourceSlug}-for-:mod*/`,
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
 * Catch-all: any remaining `brand-vs-brand-for-{segment}` (slash or not)
 * collapses to the hub in one 308. Must sit AFTER purged + reverse/alias
 * rules so those destinations stay 1-hop.
 */
export function buildSegmentCatchAllRedirects() {
  return [
    {
      source: '/:hub(.*-vs-.*)-for-:mod*',
      destination: '/:hub/',
      statusCode: REDIRECT_STATUS,
    },
    {
      source: '/:hub(.*-vs-.*)-for-:mod*/',
      destination: '/:hub/',
      statusCode: REDIRECT_STATUS,
    },
  ];
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
  return [
    ...buildPurgedVendorRedirects(),
    ...buildLiveMasterRedirects(),
    ...buildSegmentCatchAllRedirects(),
    ...buildGoAliasRedirects(),
  ];
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

export function includeInSitemap(page) {
  let pathname = page;
  try {
    pathname = new URL(page).pathname;
  } catch {
    /* already a path */
  }
  const normalized = withTrailingSlash(pathname);

  if (pathname.startsWith('/go/') || pathname.startsWith('/api/')) return false;
  if (SEGMENT_SUFFIX_RE.test(stripTrailingSlash(pathname))) return false;
  if (SITEMAP_CORE_PATHS.includes(normalized)) return true;
  if (MASTER_PATH_RE.test(normalized) && !resolveMasterRedirect(normalized)) return true;
  return false;
}
