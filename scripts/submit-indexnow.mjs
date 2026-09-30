#!/usr/bin/env node
/**
 * Submits new and updated sitemap URLs to IndexNow
 * (https://www.indexnow.org/) so Bing, Yandex, Seznam, and Naver do not wait
 * on an organic crawl.
 *
 * Production Vercel builds run this automatically after `astro build`. It
 * reads the sitemap that was just written to disk, diffs loc + lastmod
 * against the currently live sitemap, and POSTs only the delta.
 *
 * Local / preview builds skip unless INDEXNOW_FORCE=1.
 * INDEXNOW_STRICT=1 fails the process if the API call errors.
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs
 *   INDEXNOW_FORCE=1 node scripts/submit-indexnow.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const host = 'www.thehrstackguide.com';
const siteOrigin = `https://${host}`;
const liveSitemapUrl = `${siteOrigin}/sitemap-0.xml`;
const liveSitemapIndexUrl = `${siteOrigin}/sitemap-index.xml`;
const endpoint = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10_000;
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

const LOCAL_SITEMAP_CANDIDATES = [
  'dist/client/sitemap-0.xml',
  'dist/client/sitemap-index.xml',
  '.vercel/output/static/sitemap-0.xml',
  '.vercel/output/static/sitemap-index.xml',
];

function isProductionBuild() {
  return process.env.VERCEL_ENV === 'production' || process.env.INDEXNOW_FORCE === '1';
}

function isStrict() {
  return process.env.INDEXNOW_STRICT === '1';
}

function keyLocationFor(key) {
  return `${siteOrigin}/${key}.txt`;
}

function readEnvFile() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return {};

  const vars = {};
  for (const rawLine of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const name = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (name) vars[name] = value;
  }
  return vars;
}

function keyFromEnv() {
  const envFile = readEnvFile();
  const candidates = [
    process.env.INDEXNOW_KEY,
    process.env.PUBLIC_INDEXNOW_KEY,
    import.meta.env?.INDEXNOW_KEY,
    import.meta.env?.PUBLIC_INDEXNOW_KEY,
    envFile.INDEXNOW_KEY,
    envFile.PUBLIC_INDEXNOW_KEY,
  ];

  for (const candidate of candidates) {
    const key = candidate?.trim();
    if (key && KEY_PATTERN.test(key)) return key;
  }
  return null;
}

function keysFromPublicDir() {
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) return [];

  return fs
    .readdirSync(publicDir)
    .filter((entry) => entry.endsWith('.txt'))
    .filter((entry) => KEY_PATTERN.test(path.basename(entry, '.txt')))
    .filter((entry) => {
      const key = path.basename(entry, '.txt');
      const contents = fs.readFileSync(path.join(publicDir, entry), 'utf-8');
      return contents.trim() === key;
    })
    .map((entry) => path.basename(entry, '.txt'))
    .sort();
}

async function isKeyPublished(key) {
  try {
    const response = await fetch(keyLocationFor(key), { redirect: 'follow' });
    if (!response.ok) return false;
    const body = await response.text();
    return body.trim() === key;
  } catch {
    return false;
  }
}

async function resolveKey() {
  const envKey = keyFromEnv();
  if (envKey) {
    console.log(`Using IndexNow key from environment: ${envKey}`);
    return envKey;
  }

  const localKeys = keysFromPublicDir();
  if (localKeys.length === 0) {
    throw new Error(
      'No IndexNow key found. Add public/<key>.txt containing the key, or set INDEXNOW_KEY.',
    );
  }

  // During the production build the key file ships with this deploy, so a
  // live GET can still 404 if this is the first time that key is published.
  if (process.env.VERCEL === '1') {
    console.log(`Using IndexNow key from public/: ${localKeys[0]}`);
    return localKeys[0];
  }

  console.log(`Found ${localKeys.length} candidate key file(s) in public/: ${localKeys.join(', ')}`);
  for (const key of localKeys) {
    if (await isKeyPublished(key)) {
      console.log(`Verified key is published at ${keyLocationFor(key)}`);
      return key;
    }
    console.warn(`Key not reachable at ${keyLocationFor(key)}, trying next candidate.`);
  }

  console.warn(`None of the candidate keys verified live; using ${localKeys[0]}.`);
  return localKeys[0];
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&');
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) return '';
  const raw = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
  return decodeXmlEntities(raw);
}

function parseUrlset(xml) {
  const entries = [];
  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
    const loc = extractTag(match[1], 'loc');
    if (!loc.startsWith('http://') && !loc.startsWith('https://')) continue;
    entries.push({ url: loc, lastmod: extractTag(match[1], 'lastmod') });
  }
  return entries;
}

function parseSitemapIndexLocs(xml) {
  if (!/<sitemapindex/i.test(xml)) return [];
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .map((match) => {
      const raw = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      return decodeXmlEntities(raw);
    })
    .filter((url) => url.startsWith('http://') || url.startsWith('https://'));
}

function onHost(entries) {
  return entries.filter((entry) => {
    try {
      return new URL(entry.url).host === host;
    } catch {
      return false;
    }
  });
}

function lastmodMs(value) {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function diffSitemapEntries(localEntries, liveEntries) {
  const liveByUrl = new Map(liveEntries.map((entry) => [entry.url, entry]));
  const added = [];
  const updated = [];

  for (const entry of localEntries) {
    const previous = liveByUrl.get(entry.url);
    if (!previous) {
      added.push(entry.url);
      continue;
    }
    if (lastmodMs(entry.lastmod) > lastmodMs(previous.lastmod)) {
      updated.push(entry.url);
    }
  }

  return { added, updated, urlList: [...new Set([...added, ...updated])] };
}

function readLocalXml(filePath) {
  return fs.readFileSync(path.join(rootDir, filePath), 'utf-8');
}

function findLocalSitemapFiles() {
  return LOCAL_SITEMAP_CANDIDATES.filter((relative) => fs.existsSync(path.join(rootDir, relative)));
}

async function loadEntriesFromLocal() {
  const files = findLocalSitemapFiles();
  if (!files.length) return [];

  const entries = [];
  const seen = new Set();

  async function ingestXml(xml, sourceLabel) {
    const indexLocs = parseSitemapIndexLocs(xml);
    if (indexLocs.length) {
      for (const loc of indexLocs) {
        const filename = path.basename(new URL(loc).pathname);
        const sibling = files.find((file) => path.basename(file) === filename);
        if (sibling) {
          await ingestXml(readLocalXml(sibling), sibling);
          continue;
        }
        try {
          const response = await fetch(loc, { headers: { Accept: 'application/xml' } });
          if (response.ok) await ingestXml(await response.text(), loc);
        } catch {
          console.warn(`Could not load child sitemap ${loc}`);
        }
      }
      return;
    }

    const parsed = onHost(parseUrlset(xml));
    console.log(`Read ${parsed.length} URL(s) from ${sourceLabel}`);
    for (const entry of parsed) {
      if (seen.has(entry.url)) continue;
      seen.add(entry.url);
      entries.push(entry);
    }
  }

  const indexFile = files.find((file) => file.endsWith('sitemap-index.xml'));
  const start = indexFile ?? files[0];
  await ingestXml(readLocalXml(start), start);
  return entries;
}

async function fetchXml(url) {
  const response = await fetch(url, { headers: { Accept: 'application/xml' } });
  if (!response.ok) {
    throw new Error(`${url} → ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function loadEntriesFromLive() {
  const entries = [];
  const seen = new Set();

  async function ingest(url) {
    const xml = await fetchXml(url);
    const indexLocs = parseSitemapIndexLocs(xml);
    if (indexLocs.length) {
      for (const loc of indexLocs) await ingest(loc);
      return;
    }
    for (const entry of onHost(parseUrlset(xml))) {
      if (seen.has(entry.url)) continue;
      seen.add(entry.url);
      entries.push(entry);
    }
  }

  try {
    await ingest(liveSitemapIndexUrl);
  } catch {
    await ingest(liveSitemapUrl);
  }

  console.log(`Live sitemap has ${entries.length} URL(s)`);
  return entries;
}

async function submitToIndexNow(key, urlList) {
  for (let offset = 0; offset < urlList.length; offset += MAX_URLS_PER_REQUEST) {
    const batch = urlList.slice(offset, offset + MAX_URLS_PER_REQUEST);
    const payload = {
      host,
      key,
      keyLocation: keyLocationFor(key),
      urlList: batch,
    };

    console.log(`Submitting ${batch.length} URL(s) to ${endpoint} ...`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const body = (await response.text()).trim();
    console.log(`HTTP status: ${response.status} ${response.statusText}`);
    if (body) console.log(`Response body: ${body}`);

    if (![200, 202].includes(response.status)) {
      throw new Error(`IndexNow submission failed with status ${response.status}`);
    }
  }

  console.log(`IndexNow accepted ${urlList.length} URL(s) for ${host}.`);
}

async function main() {
  if (!isProductionBuild()) {
    console.log(
      `Skipping IndexNow (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}). Set INDEXNOW_FORCE=1 to submit.`,
    );
    return;
  }

  const localEntries = await loadEntriesFromLocal();
  if (!localEntries.length) {
    throw new Error(
      'No local sitemap URLs found under dist/client or .vercel/output/static. Run astro build first.',
    );
  }

  let liveEntries = [];
  try {
    liveEntries = await loadEntriesFromLive();
  } catch (error) {
    console.warn(`Live sitemap unavailable (${error.message}); submitting the full local sitemap.`);
  }

  const { added, updated, urlList } = diffSitemapEntries(localEntries, liveEntries);
  console.log(`Sitemap delta: ${added.length} new, ${updated.length} updated, ${urlList.length} to submit`);

  if (!urlList.length) {
    console.log('No new or updated sitemap URLs; nothing sent to IndexNow.');
    return;
  }

  const key = await resolveKey();
  await submitToIndexNow(key, urlList);
}

main().catch((error) => {
  console.error(`IndexNow submission error: ${error.message}`);
  if (isStrict() || !process.env.VERCEL) {
    process.exitCode = 1;
    return;
  }
  console.warn('Continuing the production build; set INDEXNOW_STRICT=1 to fail on IndexNow errors.');
});
