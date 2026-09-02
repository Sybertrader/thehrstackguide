// Submits every URL in the live sitemap to IndexNow (https://www.indexnow.org/)
// so Bing, Yandex, Seznam, Naver, etc. pick up new/changed pages without
// waiting for an organic crawl.
//
// Unlike scripts/submit-indexnow.js, which rebuilds the URL list from
// comparisons.csv, this reads the deployed sitemap — so it can only ever
// submit URLs that are actually live.
//
// Usage: node scripts/submit-indexnow.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const host = 'www.thehrstackguide.com';
const sitemapUrl = `https://${host}/sitemap-0.xml`;
const endpoint = 'https://api.indexnow.org/indexnow';

// IndexNow rejects any request carrying more than 10,000 URLs.
const MAX_URLS_PER_REQUEST = 10_000;

// Keys are alphanumeric plus dashes, 8-128 characters.
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

function keyLocationFor(key) {
  return `https://${host}/${key}.txt`;
}

// Minimal .env reader: this script runs on bare Node, so nothing has already
// populated process.env from the file the way Astro/Vite would.
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
  // `import.meta.env` only exists when this file is bundled by Vite/Astro; the
  // optional chaining keeps it harmless under plain Node.
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

// A valid IndexNow key file is named <key>.txt and contains exactly the key,
// which is what lets us tell them apart from robots.txt and friends.
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

// public/ currently holds several valid key files, so prefer whichever one is
// genuinely reachable at its keyLocation — IndexNow discards submissions it
// cannot verify against the host.
async function resolveKey() {
  const envKey = keyFromEnv();
  if (envKey) {
    console.log(`Using IndexNow key from environment: ${envKey}`);
    return envKey;
  }

  const localKeys = keysFromPublicDir();
  if (localKeys.length === 0) {
    throw new Error(
      'No IndexNow key found. Add public/<key>.txt containing the key, or set INDEXNOW_KEY in .env.',
    );
  }

  console.log(`Found ${localKeys.length} candidate key file(s) in public/: ${localKeys.join(', ')}`);

  for (const key of localKeys) {
    if (await isKeyPublished(key)) {
      console.log(`Verified key is published at ${keyLocationFor(key)}`);
      return key;
    }
    console.warn(`Key not reachable at ${keyLocationFor(key)}, trying next candidate.`);
  }

  throw new Error(
    `None of the candidate keys are published under https://${host}/. Deploy the key file before submitting.`,
  );
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

async function fetchSitemapUrls() {
  console.log(`Fetching sitemap: ${sitemapUrl}`);
  const response = await fetch(sitemapUrl, { headers: { Accept: 'application/xml' } });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const urls = [];
  for (const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
    const raw = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
    const url = decodeXmlEntities(raw);
    if (url.startsWith('http://') || url.startsWith('https://')) urls.push(url);
  }

  // Guard against a nested <sitemapindex>, whose <loc> entries are sitemaps
  // rather than pages and would be rejected as junk submissions.
  if (/<sitemapindex/i.test(xml)) {
    throw new Error(`${sitemapUrl} is a sitemap index, not a URL set. Point this script at the child sitemap.`);
  }

  const deduped = [...new Set(urls)];

  // IndexNow only accepts URLs belonging to the submitted host.
  const offHost = deduped.filter((url) => new URL(url).host !== host);
  if (offHost.length > 0) {
    console.warn(`Skipping ${offHost.length} URL(s) not on ${host}, e.g. ${offHost[0]}`);
  }

  const onHost = deduped.filter((url) => new URL(url).host === host);
  console.log(`Extracted ${onHost.length} URL(s) from sitemap (${urls.length} <loc> entries seen).`);
  return onHost;
}

async function submitToIndexNow(key, urlList) {
  const payload = {
    host,
    key,
    keyLocation: keyLocationFor(key),
    urlList,
  };

  console.log(`Submitting ${urlList.length} URL(s) to ${endpoint} ...`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const body = (await response.text()).trim();
  console.log(`HTTP status: ${response.status} ${response.statusText}`);
  if (body) console.log(`Response body: ${body}`);

  if (!response.ok) {
    throw new Error(`IndexNow submission failed with status ${response.status}`);
  }

  console.log(`IndexNow submission successful: ${urlList.length} URL(s) accepted for ${host}.`);
}

async function main() {
  const key = await resolveKey();
  const urlList = await fetchSitemapUrls();

  if (urlList.length === 0) {
    throw new Error('Sitemap contained no submittable URLs; nothing was sent.');
  }

  if (urlList.length > MAX_URLS_PER_REQUEST) {
    throw new Error(
      `Sitemap has ${urlList.length} URLs, above the IndexNow per-request limit of ${MAX_URLS_PER_REQUEST}.`,
    );
  }

  await submitToIndexNow(key, urlList);
}

main().catch((error) => {
  console.error(`IndexNow submission error: ${error.message}`);
  process.exitCode = 1;
});
