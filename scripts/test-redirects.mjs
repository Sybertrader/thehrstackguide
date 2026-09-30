#!/usr/bin/env node
/**
 * Temporary production probe for legacy comparison URLs.
 *
 * Confirms Vercel no longer 502s (ROUTER_CANNOT_MATCH) on purged-vendor
 * and `-for-{persona}` routes. Does not follow redirects, so a successful
 * edge rule shows up as 308 rather than the destination's 200.
 *
 * Usage: node scripts/test-redirects.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://www.thehrstackguide.com';
const ROOT = process.cwd();
const CONCURRENCY = 8;
const TIMEOUT_MS = 15_000;

const ALLOWED = new Set([200, 301, 302, 307, 308, 404]);

const PERSONAS = ['startups', 'web3', 'enterprise', 'scaleups', 'tech-startups'];

const PURGED = [
  { id: 'greenhouse', partner: 'breezy-hr' },
  { id: 'clearcompany', partner: 'lattice' },
  { id: 'peoplefluent', partner: 'performyard' },
  { id: '15five', partner: 'culture-amp' },
  { id: 'leapsome', partner: 'lattice' },
  { id: 'plane', partner: 'deel' },
];

const LIVE_PAIRS = [
  ['breezy-hr', 'jazzhr'],
  ['deel', 'remote'],
  ['lattice', 'culture-amp'],
  ['ashby', 'lever'],
];

function loadVercelSources() {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf-8'));
  return (config.redirects ?? []).map((rule) => rule.source);
}

function personaPaths() {
  const paths = [];
  const seen = new Set();

  function add(pathname) {
    const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    paths.push(normalized);
  }

  for (const { id, partner } of PURGED) {
    add(`/${id}-vs-${partner}/`);
    add(`/${partner}-vs-${id}/`);
    add(`/go/${id}/`);
    for (const persona of PERSONAS) {
      add(`/${id}-vs-${partner}-for-${persona}/`);
      add(`/${partner}-vs-${id}-for-${persona}/`);
    }
  }

  for (const [a, b] of LIVE_PAIRS) {
    add(`/${a}-vs-${b}/`);
    add(`/${a}-vs-${b}-for-startups/`);
    add(`/${a}-vs-${b}-for-enterprise/`);
    add(`/${a}-vs-${b}-for-web3/`);
  }

  add('/greenhouse-vs-breezy-hr-for-startups/');
  add('/this-path-should-not-exist-legacy-probe/');

  return paths;
}

async function probe(pathname) {
  const url = `${ORIGIN}${pathname}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  async function once(method) {
    const res = await fetch(url, {
      method,
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'hrsg-redirect-probe/1.0' },
    });
    return {
      path: pathname,
      method,
      status: res.status,
      location: res.headers.get('location') ?? '',
    };
  }

  try {
    try {
      const head = await once('HEAD');
      if (head.status !== 405 && head.status !== 501) return head;
    } catch {
      /* fall through to GET */
    }
    return await once('GET');
  } catch (error) {
    return {
      path: pathname,
      method: 'GET',
      status: 0,
      location: '',
      error: error.name === 'AbortError' ? 'timeout' : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function pad(value, width) {
  return String(value).padEnd(width);
}

const sources = loadVercelSources();
const paths = personaPaths();

console.log(`vercel.json redirect sources: ${sources.length}`);
console.log(`probed routes:                ${paths.length}`);
console.log(`origin:                       ${ORIGIN}`);
console.log('');

const results = await mapPool(paths, CONCURRENCY, probe);

const byStatus = new Map();
for (const row of results) {
  byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
}

const serverErrors = results.filter((row) => row.status >= 500 || row.status === 0);
const unexpected = results.filter(
  (row) => row.status > 0 && row.status < 500 && !ALLOWED.has(row.status),
);

console.log('Status counts');
for (const status of [...byStatus.keys()].sort((a, b) => a - b)) {
  const label = status === 0 ? 'network/timeout' : status;
  console.log(`  ${pad(label, 16)} ${byStatus.get(status)}`);
}
console.log('');

console.log('Results');
for (const row of results) {
  const loc = row.location ? ` → ${row.location}` : '';
  const err = row.error ? ` (${row.error})` : '';
  console.log(`  ${String(row.status).padStart(3)}  ${row.path}${loc}${err}`);
}
console.log('');

if (serverErrors.length) {
  console.error(`FAIL: ${serverErrors.length} route(s) returned >= 500 or failed to connect`);
  for (const row of serverErrors) {
    console.error(`  ${row.status || 'ERR'}  ${row.path}${row.error ? ` (${row.error})` : ''}`);
  }
  process.exit(1);
}

if (unexpected.length) {
  console.error(`FAIL: ${unexpected.length} route(s) returned an unexpected 4xx`);
  for (const row of unexpected) {
    console.error(`  ${row.status}  ${row.path}`);
  }
  process.exit(1);
}

console.log('PASS: zero routes returned HTTP >= 500 (including 502).');
console.log('All probed legacy routes returned 308, 200, 301, 302, 307, or 404.');
