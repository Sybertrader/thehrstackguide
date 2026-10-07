#!/usr/bin/env node
/**
 * Writes vercel.json 308 rules for the master 1-1 architecture.
 *
 * Order is load-bearing:
 *   1. Exact long-tail → 1:1 parent comparison hubs (the 51, top of array)
 *   2. Leapsome contains-path catch-all → /performance-management/
 *      (excludes reflektive and `-for-*` long-tails)
 *   3. Purged vendors → category hubs (exact a-vs-b only, no `-for-*`)
 *   4. Reverse-order + alias hubs (and their `-for-*` variants) → canonical master
 *   5. Catch-all `-for-{segment}` → same-path 1:1 hub (not a category hub)
 *   6. /go/oyster and /go/papaya aliases
 *
 * Every rule uses statusCode 308 and destinations already include a trailing
 * slash so Vercel trailingSlash cannot insert a second hop.
 *
 * Never emit `:param*` glued to a literal in the same path segment
 * (`/greenhouse-vs-:rest*`). That compiles locally and 502s on Vercel as
 * ROUTER_CANNOT_MATCH. Use `/:path(named-regex)` instead.
 * Never emit a `routes` array: it ignores redirects/headers/trailingSlash.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { goneVercelRewrites, isGonePath } from '../src/lib/gone.ts';
import {
  buildVercelRedirects,
  EXACT_PARENT_HUB_REDIRECTS,
  isUnsafeVercelRedirectSource,
  resolveMasterRedirect,
} from '../src/lib/master-redirects.ts';

const require = createRequire(import.meta.url);
const { pathToRegexp } = require('path-to-regexp');

const ROOT = process.cwd();
const VERCEL_PATH = path.join(ROOT, 'vercel.json');

const HEADERS = [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  },
  {
    source: '/((?!api/|go/|_astro/).*)',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    ],
  },
  {
    source: '/go',
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
  },
  {
    source: '/go/',
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
  },
  {
    source: '/go/:path*',
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
  },
  {
    source: '/go/:path*/',
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
  },
  {
    source: '/api/:path*',
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
  },
];

const REWRITES = [
  { source: '/api/calculate-eor.json', destination: '/api/calculate-eor' },
  { source: '/api/calculate-eor.json/', destination: '/api/calculate-eor' },
  { source: '/api/calculate-eor/', destination: '/api/calculate-eor' },
  // Do not add a vercel.json `routes` array: it ignores redirects/headers/trailingSlash.
  // These rewrites map deleted URLs to /api/gone, which returns HTTP 410.
  ...goneVercelRewrites(),
];

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  trailingSlash: true,
  rewrites: REWRITES,
  redirects: buildVercelRedirects(),
  headers: HEADERS,
};

const unsafeHeaders = HEADERS.map((rule) => rule.source).filter((source) =>
  isUnsafeVercelRedirectSource(source),
);
if (unsafeHeaders.length) {
  throw new Error(`Unsafe Vercel header sources: ${unsafeHeaders.join(', ')}`);
}

const PROBES = [
  ['/greenhouse-vs-breezy-hr-for-startups/', '/greenhouse-vs-breezy-hr/'],
  ['/breezy-hr-vs-greenhouse-for-startups/', '/applicant-tracking-systems/'],
  ['/greenhouse-vs-breezy-hr/', '/applicant-tracking-systems/'],
  ['/deel-vs-remote-for-startups/', '/deel-vs-remote/'],
  ['/deel-vs-remote-for-tech-startups/', '/deel-vs-remote/'],
  ['/remote-vs-deel-for-scaleups/', '/deel-vs-remote/'],
  ['/lattice-vs-culture-amp-for-enterprise/', '/lattice-vs-culture-amp/'],
  ['/performyard-vs-lattice-for-people-ops/', '/performyard-vs-lattice/'],
  ['/rippling-vs-gusto-for-web3-crypto/', '/rippling-vs-gusto/'],
  ['/ashby-vs-lever-for-enterprises/', '/ashby-vs-lever/'],
  ['/oyster-vs-plane-for-tech-startups/', '/oyster-vs-plane/'],
  ['/15five-vs-lattice-for-enterprise/', '/15five-vs-lattice/'],
  ['/leapsome-vs-clearcompany-for-scaleups/', '/leapsome-vs-clearcompany/'],
];

for (const [from, to] of PROBES) {
  const got = resolveMasterRedirect(from);
  if (got !== to) {
    throw new Error(`resolveMasterRedirect(${from}) → ${got}, expected ${to}`);
  }
}

if (
  !isGonePath('/culture-amp-vs-reflektive-for-remote-teams') ||
  !isGonePath('/performyard-vs-reflektive-for-enterprise/') ||
  !isGonePath('/leapsome-vs-reflektive-for-scaleups') ||
  !isGonePath('/foo-vs-reflektive/') ||
  !isGonePath('/Reflektive-vs-lattice-for-enterprise') ||
  !isGonePath('/old-category/retired-hub/')
) {
  throw new Error('isGonePath() does not match DELETED_PATHS, DELETED_PREFIXES, or reflektive');
}
if (
  isGonePath('/about') ||
  isGonePath('/deel-vs-remote/') ||
  isGonePath('/leapsome-vs-lattice/')
) {
  throw new Error('isGonePath() must not match live or leapsome-only pages');
}

if ('routes' in config) {
  throw new Error('Do not emit a vercel.json routes array (it ignores redirects/headers/trailingSlash)');
}

const hasReflektiveRewrite = config.rewrites.some(
  (rule) => rule.destination === '/api/gone' && /:path\(.*reflektive.*\)/.test(rule.source),
);
if (!hasReflektiveRewrite) {
  throw new Error('Missing Vercel rewrite matcher /:path(.*reflektive.*) → /api/gone');
}

const CATEGORY_HUBS = new Set([
  '/global-payroll-eor/',
  '/performance-management/',
  '/applicant-tracking-systems/',
]);

const REFLEKTIVE_PROBES = [
  '/culture-amp-vs-reflektive-for-remote-teams',
  '/culture-amp-vs-reflektive-for-remote-teams/',
  '/leapsome-vs-reflektive-for-scaleups',
  '/leapsome-vs-reflektive-for-scaleups/',
  '/foo-vs-reflektive/',
  '/reflektive-vs-lattice',
  '/Reflektive-vs-lattice-for-enterprise',
  '/performyard-vs-reflektive-for-enterprise/',
];

const LONG_TAIL_PROBES = [
  ['/oyster-vs-plane-for-tech-startups', '/oyster-vs-plane/'],
  ['/oyster-vs-plane-for-tech-startups/', '/oyster-vs-plane/'],
  ['/15five-vs-lattice-for-enterprise/', '/15five-vs-lattice/'],
  ['/rippling-vs-remote-for-scaleups', '/rippling-vs-remote/'],
];

function redirectSourceMatches(source, pathname) {
  if (!source.includes(':')) return source === pathname;
  try {
    return pathToRegexp(source).test(pathname);
  } catch {
    throw new Error(`Cannot compile Vercel redirect source: ${source}`);
  }
}

function firstMatchingRedirect(pathname) {
  return config.redirects.find((rule) => redirectSourceMatches(rule.source, pathname));
}

const REFLEKTIVE_LOOKAHEAD_TOKEN = '(?!.*reflektive)';
const reflektiveRedirects = config.redirects.filter((rule) =>
  rule.source.toLowerCase().replaceAll(REFLEKTIVE_LOOKAHEAD_TOKEN, '').includes('reflektive'),
);
if (reflektiveRedirects.length) {
  throw new Error(
    `308 sources must not contain reflektive (except negative lookahead): ${reflektiveRedirects
      .map((rule) => rule.source)
      .slice(0, 8)
      .join(', ')}`,
  );
}

for (const pathname of REFLEKTIVE_PROBES) {
  const hit = firstMatchingRedirect(pathname);
  if (hit) {
    throw new Error(
      `308 ${hit.source} → ${hit.destination} must not match Reflektive path ${pathname}`,
    );
  }
}

const expectedExactPrefix = [];
for (const [source, destination] of EXACT_PARENT_HUB_REDIRECTS) {
  if (CATEGORY_HUBS.has(destination)) {
    throw new Error(`Exact parent-hub 308 ${source} must not target category hub ${destination}`);
  }
  expectedExactPrefix.push(
    { source, destination },
    { source: `${source}/`, destination },
  );
}

const prefix = config.redirects.slice(0, expectedExactPrefix.length);
for (let i = 0; i < expectedExactPrefix.length; i += 1) {
  const got = prefix[i];
  const want = expectedExactPrefix[i];
  if (
    !got ||
    got.source !== want.source ||
    got.destination !== want.destination ||
    got.statusCode !== 308
  ) {
    throw new Error(
      `Exact 51 must lead vercel.json redirects. Index ${i}: expected ${want.source} → ${want.destination}, got ${got?.source} → ${got?.destination}`,
    );
  }
}

for (const [source, destination] of EXACT_PARENT_HUB_REDIRECTS) {
  const found = config.redirects.some(
    (rule) =>
      rule.source === source && rule.destination === destination && rule.statusCode === 308,
  );
  if (!found) {
    throw new Error(`Missing exact 308 ${source} → ${destination}`);
  }
}

for (const [pathname, destination] of LONG_TAIL_PROBES) {
  const hit = firstMatchingRedirect(pathname);
  if (!hit || hit.destination !== destination || hit.statusCode !== 308) {
    throw new Error(
      `Long-tail ${pathname} must 308 to ${destination}, got ${hit?.source} → ${hit?.destination}`,
    );
  }
}

fs.writeFileSync(VERCEL_PATH, `${JSON.stringify(config, null, 2)}\n`);
console.log(
  `Wrote ${config.redirects.length} HTTP 308 redirects and ${config.rewrites.length} rewrites to vercel.json`,
);
