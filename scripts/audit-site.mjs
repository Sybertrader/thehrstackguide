#!/usr/bin/env node
/**
 * Production crawl of every URL in sitemap-0.xml.
 *
 * Checks per URL:
 *   1. HTTP 200 with no redirect
 *   2. robots meta is not noindex / none / nofollow-only crawl blocks
 *   3. Canonical href equals the requested URL (trailing slash included)
 *   4. Parseable JSON-LD; comparison pages must include SoftwareApplication,
 *      ItemPage, or Review; other pages need any valid schema.org @type.
 *      Offer.price must be a bare number (no $, /mo, or "Custom quote").
 *   5. Non-empty unique <title> and meta description
 *
 * Also flags same-host links that 200 but are absent from the sitemap
 * (orphans), ignoring /go/, /api/, and static assets.
 *
 * Usage:
 *   node scripts/audit-site.mjs
 *   AUDIT_SITEMAP=dist/client/sitemap-0.xml AUDIT_FETCH_ORIGIN=http://127.0.0.1:4173 node scripts/audit-site.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.thehrstackguide.com';
const FETCH_ORIGIN = (process.env.AUDIT_FETCH_ORIGIN || ORIGIN).replace(/\/$/, '');
const SITEMAP = process.env.AUDIT_SITEMAP || `${ORIGIN}/sitemap-0.xml`;
const STATIC_DIR = process.env.AUDIT_STATIC_DIR
  ? path.resolve(process.env.AUDIT_STATIC_DIR)
  : '';
const CONCURRENCY = 6;
const TIMEOUT_MS = 20_000;

const COMPARISON_SCHEMA = new Set(['softwareapplication', 'itempage', 'review']);
const ANY_SCHEMA = new Set([
  'softwareapplication',
  'itempage',
  'review',
  'webpage',
  'website',
  'organization',
  'collectionpage',
  'faqpage',
  'contactpage',
  'article',
  'breadcrumblist',
  'itemlist',
]);

const SKIP_ORPHAN_PREFIXES = ['/go/', '/api/', '/_astro/', '/~partytown/'];
const ASSET_EXT = /\.(png|jpe?g|webp|svg|gif|ico|css|js|mjs|woff2?|xml|txt|webmanifest)$/i;

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

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
  return match ? decodeEntities(match[1]).trim() : '';
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : '';
}

function extractMeta(html, name) {
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of tags) {
    const key = attr(tag, 'name') || attr(tag, 'property');
    if (key.toLowerCase() === name.toLowerCase()) return attr(tag, 'content');
  }
  return '';
}

function extractCanonical(html) {
  const tags = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of tags) {
    if (attr(tag, 'rel').toLowerCase() === 'canonical') return attr(tag, 'href');
  }
  return '';
}

function robotsBlocked(html) {
  const content = extractMeta(html, 'robots').toLowerCase();
  if (!content) return false;
  return /\bnoindex\b|\bnone\b|\bno-crawl\b|\bnocrawl\b/.test(content);
}

const NUMERIC_OFFER_PRICE = /^\d+(?:\.\d+)?$/;

function parseJsonLd(html) {
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes = [];
  const errors = [];
  const invalidPrices = [];

  function inspectOffer(offer) {
    if (!offer || typeof offer !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(offer, 'price')) {
      const price = offer.price;
      if (typeof price !== 'number' && !NUMERIC_OFFER_PRICE.test(String(price))) {
        invalidPrices.push(String(price));
      }
    }
  }

  function walk(value) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (value['@graph']) walk(value['@graph']);
    if (value['@type']) {
      const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
      nodes.push(...types.map((t) => String(t).toLowerCase()));
    }
    if (value.offers) {
      if (Array.isArray(value.offers)) value.offers.forEach(inspectOffer);
      else inspectOffer(value.offers);
    }
    if (value.mainEntity) walk(value.mainEntity);
    if (value.itemListElement) walk(value.itemListElement);
    if (value.item) walk(value.item);
  }

  for (const block of blocks) {
    const raw = stripTags(block[1]);
    try {
      walk(JSON.parse(raw));
    } catch (error) {
      errors.push(error.message);
    }
  }

  return { nodes: [...new Set(nodes)], errors, invalidPrices: [...new Set(invalidPrices)], count: blocks.length };
}

function isComparisonUrl(url) {
  try {
    return /\/[a-z0-9-]+-vs-[a-z0-9-]+\/?$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function stripNonMarkup(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<template\b[\s\S]*?<\/template>/gi, '');
}

function extractInternalHrefs(html, pageUrl) {
  const hrefs = new Set();
  const tags = [...stripNonMarkup(html).matchAll(/<a\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of tags) {
    const href = attr(tag, 'href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    let resolved;
    try {
      resolved = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (resolved.origin !== ORIGIN) continue;
    resolved.hash = '';
    resolved.search = '';
    const pathname = resolved.pathname.endsWith('/') || resolved.pathname === '/'
      ? resolved.pathname
      : `${resolved.pathname}/`;
    if (ASSET_EXT.test(pathname)) continue;
    if (SKIP_ORPHAN_PREFIXES.some((prefix) => pathname.startsWith(prefix) || pathname === prefix.slice(0, -1) + '/')) {
      continue;
    }
    resolved.pathname = pathname;
    hrefs.add(resolved.href);
  }
  return hrefs;
}

function toFetchUrl(url) {
  if (FETCH_ORIGIN === ORIGIN) return url;
  try {
    const parsed = new URL(url);
    if (parsed.origin === ORIGIN) return `${FETCH_ORIGIN}${parsed.pathname}${parsed.search}`;
  } catch {
    /* keep url */
  }
  return url;
}

async function fetchText(url, { method = 'GET', follow = false } = {}) {
  if (STATIC_DIR && /^https?:\/\//i.test(url) && !url.includes('sitemap')) {
    const pathname = new URL(url).pathname;
    const relative = pathname === '/' ? 'index.html' : `${pathname.replace(/\/$/, '')}/index.html`;
    const filePath = path.join(STATIC_DIR, relative);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return { status: 200, location: '', body: method === 'HEAD' ? '' : fs.readFileSync(filePath, 'utf-8') };
    }
    return { status: 404, location: '', body: '' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(toFetchUrl(url), {
      method,
      redirect: follow ? 'follow' : 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'hrsg-site-audit/1.0' },
    });
    const location = res.headers.get('location') ?? '';
    const body = method === 'HEAD' ? '' : await res.text();
    return { status: res.status, location, body };
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
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function loadSitemapUrls() {
  if (!/^https?:\/\//i.test(SITEMAP)) {
    const filePath = path.resolve(SITEMAP);
    const body = fs.readFileSync(filePath, 'utf-8');
    const locs = [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1].trim()));
    return [...new Set(locs)];
  }
  const { status, body, location } = await fetchText(SITEMAP, { follow: true });
  if (status !== 200) {
    throw new Error(`Failed to fetch sitemap (${status}${location ? ` → ${location}` : ''})`);
  }
  const locs = [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1].trim()));
  return [...new Set(locs)];
}

function formatIssues(issues) {
  return issues.map((issue) => `      - ${issue}`).join('\n');
}

console.log(`Fetching ${SITEMAP}`);
const sitemapUrls = await loadSitemapUrls();
console.log(`Sitemap URLs: ${sitemapUrls.length}\n`);

const pageResults = await mapPool(sitemapUrls, CONCURRENCY, async (url, index) => {
  process.stderr.write(`  [${index + 1}/${sitemapUrls.length}] ${url}\n`);
  const issues = [];
  let html = '';
  let status = 0;
  let location = '';
  let title = '';
  let description = '';
  let canonical = '';
  let schemaTypes = [];
  let internalLinks = [];

  try {
    const res = await fetchText(url, { follow: false });
    status = res.status;
    location = res.location;
    html = res.body;
  } catch (error) {
    issues.push(`request failed (${error.name === 'AbortError' ? 'timeout' : error.message})`);
    return { url, status, location, title, description, canonical, schemaTypes, internalLinks, issues };
  }

  if (status !== 200) {
    issues.push(`status ${status}${location ? ` → ${location}` : ''} (expected 200, no redirect)`);
    return { url, status, location, title, description, canonical, schemaTypes, internalLinks, issues };
  }

  title = extractTitle(html);
  description = extractMeta(html, 'description');
  canonical = extractCanonical(html);

  if (!title) issues.push('empty <title>');
  if (!description) issues.push('empty meta description');
  if (robotsBlocked(html)) {
    issues.push(`robots meta blocks indexing (${extractMeta(html, 'robots')})`);
  }
  if (!canonical) {
    issues.push('missing canonical');
  } else if (canonical !== url) {
    issues.push(`canonical mismatch: ${canonical}`);
  }

  const jsonLd = parseJsonLd(html);
  schemaTypes = jsonLd.nodes;
  if (jsonLd.errors.length) issues.push(`JSON-LD parse error: ${jsonLd.errors[0]}`);
  if (jsonLd.count === 0) issues.push('no JSON-LD');
  if (jsonLd.invalidPrices.length) {
    issues.push(`Offer.price must be numeric (found: ${jsonLd.invalidPrices.join(', ')})`);
  }
  const comparison = isComparisonUrl(url);
  const hasComparisonSchema = schemaTypes.some((t) => COMPARISON_SCHEMA.has(t));
  const hasAnySchema = schemaTypes.some((t) => ANY_SCHEMA.has(t));
  if (comparison && !hasComparisonSchema) {
    issues.push(`comparison JSON-LD missing SoftwareApplication/ItemPage/Review (found: ${schemaTypes.join(', ') || 'none'})`);
  } else if (!comparison && !hasAnySchema) {
    issues.push(`JSON-LD missing a recognized @type (found: ${schemaTypes.join(', ') || 'none'})`);
  }

  internalLinks = [...extractInternalHrefs(html, url)];
  return { url, status, location, title, description, canonical, schemaTypes, internalLinks, issues };
});

const titleCounts = new Map();
const descriptionCounts = new Map();
for (const row of pageResults) {
  if (row.title) titleCounts.set(row.title, (titleCounts.get(row.title) ?? 0) + 1);
  if (row.description) descriptionCounts.set(row.description, (descriptionCounts.get(row.description) ?? 0) + 1);
}
for (const row of pageResults) {
  if (row.title && titleCounts.get(row.title) > 1) {
    row.issues.push('duplicate <title>');
  }
  if (row.description && descriptionCounts.get(row.description) > 1) {
    row.issues.push('duplicate meta description');
  }
}

const sitemapSet = new Set(sitemapUrls);
const linked = new Set();
for (const row of pageResults) {
  for (const href of row.internalLinks) linked.add(href);
}

const candidateOrphans = [...linked].filter((href) => !sitemapSet.has(href));
const orphanChecks = await mapPool(candidateOrphans, CONCURRENCY, async (url) => {
  try {
    const res = await fetchText(url, { follow: false });
    return { url, status: res.status, location: res.location };
  } catch (error) {
    return { url, status: 0, location: '', error: error.message };
  }
});

const orphans = [];
const brokenLinks = [];
for (const row of orphanChecks) {
  if (row.status === 200) orphans.push(row.url);
  else if (row.status >= 400 || row.status === 0) brokenLinks.push(row);
}

const failures = pageResults.filter((row) => row.issues.length);

console.log('=== Page audit ===\n');
for (const row of pageResults) {
  const mark = row.issues.length ? 'FAIL' : 'PASS';
  console.log(`${mark}  ${row.status || 'ERR'}  ${row.url}`);
  if (row.issues.length) console.log(formatIssues(row.issues));
}

console.log('\n=== Uniqueness ===');
console.log(`  unique titles:       ${titleCounts.size}/${pageResults.filter((r) => r.title).length}`);
console.log(`  unique descriptions: ${descriptionCounts.size}/${pageResults.filter((r) => r.description).length}`);

console.log('\n=== Orphans & broken internal links ===');
if (!orphans.length) console.log('  no 200 OK pages linked from the sitemap that are missing from it');
else {
  console.log(`  ${orphans.length} linked page(s) return 200 but are not in the sitemap:`);
  for (const url of orphans.sort()) console.log(`    ${url}`);
}
if (!brokenLinks.length) console.log('  no broken same-host links from sitemap pages');
else {
  console.log(`  ${brokenLinks.length} linked URL(s) returned 4xx/5xx/network error:`);
  for (const row of brokenLinks) {
    console.log(`    ${row.status || 'ERR'}  ${row.url}${row.location ? ` → ${row.location}` : ''}`);
  }
}

const statusCounts = new Map();
for (const row of pageResults) {
  statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
}

console.log('\n=== Summary ===');
console.log(`  sitemap URLs: ${sitemapUrls.length}`);
console.log(`  status counts: ${[...statusCounts.entries()].map(([s, n]) => `${s}=${n}`).join(', ')}`);
console.log(`  failing pages: ${failures.length}`);
console.log(`  orphans:       ${orphans.length}`);
console.log(`  broken links:  ${brokenLinks.length}`);

if (failures.length) {
  console.error(`\nFAIL: ${failures.length} sitemap URL(s) failed the audit.`);
  process.exit(1);
}

if (brokenLinks.some((row) => row.status >= 500)) {
  console.error('\nFAIL: a linked URL returned HTTP >= 500.');
  process.exit(1);
}

console.log('\nPASS: every sitemap URL returned 200 with indexable robots, matching canonical, JSON-LD, and unique title/description.');
