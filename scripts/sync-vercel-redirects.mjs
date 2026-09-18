#!/usr/bin/env node
/**
 * Writes vercel.json 308 rules for the master 1-1 architecture.
 *
 * Order is load-bearing:
 *   1. Purged vendors → category hubs
 *   2. Reverse-order + alias hubs (and their -for-* variants) → canonical master
 *   3. Catch-all `-for-{segment}` → same-path hub (covers leftover modifiers)
 *   4. /go/oyster and /go/papaya aliases
 *
 * Every rule uses statusCode 308 and destinations already include a trailing
 * slash so Vercel trailingSlash cannot insert a second hop.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildVercelRedirects } from '../src/lib/master-redirects.ts';

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

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  trailingSlash: true,
  redirects: buildVercelRedirects(),
  headers: HEADERS,
};

fs.writeFileSync(VERCEL_PATH, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${config.redirects.length} HTTP 308 redirects to vercel.json`);
