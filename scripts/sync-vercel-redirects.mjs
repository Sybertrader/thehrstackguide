#!/usr/bin/env node
/**
 * Writes vercel.json 308 rules for the master 1-1 architecture.
 *
 * Order is load-bearing:
 *   1. Leapsome contains-path catch-all → /performance-management/
 *   2. Purged vendors → category hubs
 *   3. Reverse-order + alias hubs (and their -for-* variants) → canonical master
 *   4. Catch-all `-for-{segment}` → same-path hub (covers leftover modifiers)
 *   5. /go/oyster and /go/papaya aliases
 *
 * Every rule uses statusCode 308 and destinations already include a trailing
 * slash so Vercel trailingSlash cannot insert a second hop.
 *
 * Never emit `:param*` glued to a literal in the same path segment
 * (`/greenhouse-vs-:rest*`). That compiles locally and 502s on Vercel as
 * ROUTER_CANNOT_MATCH. Use `/:path(named-regex)` instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildVercelRedirects,
  isUnsafeVercelRedirectSource,
  resolveMasterRedirect,
} from '../src/lib/master-redirects.ts';

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
  ['/greenhouse-vs-breezy-hr-for-startups/', '/applicant-tracking-systems/'],
  ['/breezy-hr-vs-greenhouse-for-startups/', '/applicant-tracking-systems/'],
  ['/greenhouse-vs-breezy-hr/', '/applicant-tracking-systems/'],
  ['/deel-vs-remote-for-startups/', '/deel-vs-remote/'],
  ['/deel-vs-remote-for-tech-startups/', '/deel-vs-remote/'],
  ['/remote-vs-deel-for-scaleups/', '/deel-vs-remote/'],
  ['/lattice-vs-culture-amp-for-enterprise/', '/lattice-vs-culture-amp/'],
  ['/performyard-vs-lattice-for-people-ops/', '/performyard-vs-lattice/'],
  ['/rippling-vs-gusto-for-web3-crypto/', '/rippling-vs-gusto/'],
  ['/ashby-vs-lever-for-enterprises/', '/ashby-vs-lever/'],
];

for (const [from, to] of PROBES) {
  const got = resolveMasterRedirect(from);
  if (got !== to) {
    throw new Error(`resolveMasterRedirect(${from}) → ${got}, expected ${to}`);
  }
}

fs.writeFileSync(VERCEL_PATH, `${JSON.stringify(config, null, 2)}\n`);
console.log(
  `Wrote ${config.redirects.length} HTTP 308 redirects and ${config.rewrites.length} rewrites to vercel.json`,
);
