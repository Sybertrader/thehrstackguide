#!/usr/bin/env node
/**
 * Collapse multi-hop production redirects into direct 308s.
 *
 * Reads audit-report.json `multiHopChains` and rewrites vercel.json so each
 * chained pathname, and its slash twin, points straight at the terminal 200.
 * Catch-alls for purged vendors stay first, then /go/ aliases, then the
 * exact 1-hop rules. Older wildcard rules stay after those exact rules so
 * they cannot intercept a flattened path.
 *
 * Usage: node scripts/flatten-redirects.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { pathToRegexp } = require('path-to-regexp');

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'audit-report.json');
const VERCEL_PATH = path.join(ROOT, 'vercel.json');
const REDIRECT_LIMIT = 2048;

const PRIORITY_SOURCES = [
  ['/:path(.*reflektive.*)', '/performance-management/'],
  ['/:path(.*reflektive.*)/', '/performance-management/'],
  ['/:path(.*15five-vs-peoplefluent.*)', '/performance-management/'],
  ['/:path(.*15five-vs-peoplefluent.*)/', '/performance-management/'],
];

function pathnameOf(value) {
  if (!value) throw new Error('Missing URL on a multi-hop chain entry');
  const pathname = new URL(value, 'https://www.thehrstackguide.com').pathname || '/';
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function withSlash(pathname) {
  if (pathname === '/') return pathname;
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function withoutSlash(pathname) {
  if (pathname === '/') return pathname;
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function slashPair(pathname) {
  const bare = withoutSlash(pathname);
  if (bare === '/') return ['/'];
  return [bare, `${bare}/`];
}

function rule(source, destination) {
  return { source, destination: withSlash(destination), statusCode: 308 };
}

function isGoSource(source) {
  return source === '/go' || source.startsWith('/go/');
}

function terminalPath(entry) {
  return withSlash(pathnameOf(entry.terminalUrl || entry.finalUrl));
}

export function buildFlattenedRedirects(report, existingRedirects = []) {
  const chains = report.multiHopChains ?? [];
  if (!Array.isArray(chains) || chains.length === 0) {
    throw new Error('audit-report.json has no multiHopChains to flatten');
  }

  const exact = new Map();
  for (const entry of chains) {
    const destination = terminalPath(entry);
    for (const source of slashPair(pathnameOf(entry.url))) {
      if (source === destination) continue;
      const previous = exact.get(source);
      if (previous && previous !== destination) {
        throw new Error(`Conflicting terminals for ${source}: ${previous} vs ${destination}`);
      }
      exact.set(source, destination);
    }
  }

  const priority = PRIORITY_SOURCES.map(([source, destination]) => rule(source, destination));
  const used = new Set(priority.map((item) => item.source));

  const go = [];
  const direct = [];
  const sources = [...exact.keys()].sort();
  for (const source of sources) {
    if (used.has(source)) continue;
    const item = rule(source, exact.get(source));
    used.add(source);
    if (isGoSource(source)) go.push(item);
    else direct.push(item);
  }

  for (const existing of existingRedirects) {
    if (!isGoSource(existing.source) || used.has(existing.source)) continue;
    go.push(rule(existing.source, existing.destination));
    used.add(existing.source);
  }

  const preserved = [];
  for (const existing of existingRedirects) {
    if (used.has(existing.source)) continue;
    preserved.push({
      source: existing.source,
      destination: existing.destination,
      statusCode: existing.statusCode ?? 308,
    });
    used.add(existing.source);
  }

  const redirects = [...priority, ...go, ...direct, ...preserved];
  if (redirects.length > REDIRECT_LIMIT) {
    throw new Error(`Redirect array has ${redirects.length} rules; Vercel allows ${REDIRECT_LIMIT}`);
  }
  return redirects;
}

const compiledSources = new Map();

function sourceMatches(source, pathname) {
  if (!source.includes(':')) return source === pathname;
  let compiled = compiledSources.get(source);
  if (!compiled) {
    compiled = pathToRegexp(source);
    compiledSources.set(source, compiled);
  }
  return compiled.test(pathname);
}

function firstMatch(redirects, pathname) {
  return redirects.find((item) => sourceMatches(item.source, pathname));
}

export function assertDirectChains(report, redirects) {
  const failures = [];
  for (const entry of report.multiHopChains ?? []) {
    const destination = terminalPath(entry);
    for (const pathname of slashPair(pathnameOf(entry.url))) {
      if (pathname === destination) continue;
      const hit = firstMatch(redirects, pathname);
      if (!hit || hit.destination !== destination || hit.statusCode !== 308) {
        failures.push(
          `${pathname} → ${hit?.destination ?? 'no match'} (expected ${destination})`,
        );
      }
    }
  }
  if (failures.length) {
    throw new Error(
      `Flattened redirects are not 1-hop for ${failures.length} paths:\n${failures.slice(0, 12).join('\n')}`,
    );
  }
}

export function applyFlattenedRedirects(vercelConfig, report) {
  const chains = report.multiHopChains ?? [];
  if (!Array.isArray(chains) || chains.length === 0) {
    const onDisk = JSON.parse(fs.readFileSync(VERCEL_PATH, 'utf8'));
    if (!Array.isArray(onDisk.redirects) || onDisk.redirects.length === 0) {
      throw new Error('audit-report.json has no multiHopChains and vercel.json has no redirects to keep');
    }
    vercelConfig.redirects = onDisk.redirects;
    delete vercelConfig.trailingSlash;
    return vercelConfig;
  }
  const redirects = buildFlattenedRedirects(report, vercelConfig.redirects ?? []);
  assertDirectChains(report, redirects);
  vercelConfig.redirects = redirects;
  // Vercel applies `trailingSlash` before `redirects`, which adds a hop on
  // every non-slash legacy URL even when an exact 308 already exists.
  delete vercelConfig.trailingSlash;
  return vercelConfig;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const report = readJson(REPORT_PATH);
  const vercelConfig = readJson(VERCEL_PATH);
  const before = vercelConfig.redirects?.length ?? 0;
  applyFlattenedRedirects(vercelConfig, report);
  fs.writeFileSync(VERCEL_PATH, `${JSON.stringify(vercelConfig, null, 2)}\n`);
  JSON.parse(fs.readFileSync(VERCEL_PATH, 'utf8'));

  const goCount = vercelConfig.redirects.filter((item) => isGoSource(item.source)).length;
  console.log(
    `Flattened ${report.multiHopChains.length} multi-hop chains into ${vercelConfig.redirects.length} redirects (was ${before}).`,
  );
  console.log(`Priority catch-alls: 4. /go/ aliases: ${goCount}.`);
  console.log(`Wrote ${VERCEL_PATH}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
