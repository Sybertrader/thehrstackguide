#!/usr/bin/env node
/**
 * Manual IndexNow submission. Not run by `astro build` or `npm run build`.
 *
 * Usage: npm run ping:indexnow
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const DEFAULT_HOST = 'www.thehrstackguide.com';
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

const SITEMAP_CANDIDATES = [
  path.join(rootDir, 'dist/client/sitemap-0.xml'),
  path.join(rootDir, 'dist/sitemap-0.xml'),
  path.join(rootDir, '.vercel/output/static/sitemap-0.xml'),
];

const DIST_CANDIDATES = [
  path.join(rootDir, 'dist/client'),
  path.join(rootDir, 'dist'),
  path.join(rootDir, '.vercel/output/static'),
];

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

function firstNonEmpty(...values) {
  for (const value of values) {
    const trimmed = String(value || '').trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function hostFromOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    return url.host;
  } catch {
    return '';
  }
}

function resolveHost(sitemapUrls) {
  const envFile = readEnvFile();
  const fromEnv = hostFromOrigin(
    firstNonEmpty(
      process.env.INDEXNOW_HOST,
      process.env.SITE_URL,
      process.env.PUBLIC_SITE_URL,
      envFile.INDEXNOW_HOST,
      envFile.SITE_URL,
      envFile.PUBLIC_SITE_URL,
    ),
  );
  if (fromEnv) return fromEnv;

  for (const loc of sitemapUrls) {
    try {
      return new URL(loc).host;
    } catch {
      continue;
    }
  }

  return DEFAULT_HOST;
}

function keysFromPublicDir() {
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) return [];

  return fs
    .readdirSync(publicDir)
    .filter((entry) => entry.endsWith('.txt'))
    .map((entry) => path.basename(entry, '.txt'))
    .filter((key) => KEY_PATTERN.test(key))
    .filter((key) => {
      const contents = fs.readFileSync(path.join(publicDir, `${key}.txt`), 'utf-8').trim();
      return contents === key;
    });
}

function resolveKey() {
  const envFile = readEnvFile();
  const fromEnv = firstNonEmpty(
    process.env.INDEXNOW_KEY,
    process.env.PUBLIC_INDEXNOW_KEY,
    envFile.INDEXNOW_KEY,
    envFile.PUBLIC_INDEXNOW_KEY,
  );
  if (fromEnv) {
    if (!KEY_PATTERN.test(fromEnv)) {
      throw new Error('INDEXNOW_KEY is not a valid IndexNow key (8–128 alphanumeric or hyphen characters).');
    }
    console.log(`IndexNow key: ${fromEnv} (environment)`);
    return fromEnv;
  }

  const keys = keysFromPublicDir();
  if (!keys.length) {
    throw new Error(
      'No IndexNow key found. Set INDEXNOW_KEY or add public/<key>.txt whose filename equals its contents.',
    );
  }

  const preferred = '51f7bb598c8d4b77a96fcba4cf952b3d';
  const key = keys.includes(preferred) ? preferred : keys[0];
  console.log(`IndexNow key: ${key} (verified public/${key}.txt)`);
  return key;
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

function parseSitemapUrls(xml) {
  if (/<sitemapindex/i.test(xml)) {
    throw new Error('sitemap-0.xml is a sitemap index; expected a urlset with page <loc> entries.');
  }

  const urls = [];
  for (const match of xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)) {
    const raw = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
    const url = decodeXmlEntities(raw);
    if (url.startsWith('http://') || url.startsWith('https://')) urls.push(url);
  }
  return [...new Set(urls)];
}

function collectHtmlFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...collectHtmlFiles(fullPath));
    } else if (item.endsWith('.html') && !item.includes('404')) {
      files.push(fullPath);
    }
  }
  return files;
}

function htmlPathToUrl(filePath, distRoot, host) {
  let relative = path.relative(distRoot, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return `https://${host}/`;
  if (relative.endsWith('/index.html')) relative = relative.slice(0, -'index.html'.length);
  else if (relative.endsWith('.html')) relative = relative.slice(0, -'.html'.length);
  if (!relative.startsWith('/')) relative = `/${relative}`;
  if (!relative.endsWith('/')) relative = `${relative}/`;
  return `https://${host}${relative}`;
}

function urlsFromDist(host) {
  const distRoot = DIST_CANDIDATES.find((dir) => fs.existsSync(dir));
  if (!distRoot) return [];

  return [...new Set(collectHtmlFiles(distRoot).map((file) => htmlPathToUrl(file, distRoot, host)))];
}

function collectUrls(host) {
  const sitemapPath = SITEMAP_CANDIDATES.find((filePath) => fs.existsSync(filePath));
  if (sitemapPath) {
    const xml = fs.readFileSync(sitemapPath, 'utf-8');
    const urls = parseSitemapUrls(xml);
    console.log(`Read ${urls.length} URL(s) from ${path.relative(rootDir, sitemapPath)}`);
    return urls;
  }

  const urls = urlsFromDist(host);
  console.log(`No sitemap-0.xml found; derived ${urls.length} URL(s) from dist HTML.`);
  return urls;
}

function statusLabel(status) {
  if (status === 200) return 'Success';
  if (status === 202) return 'Accepted';
  return 'Failed';
}

async function main() {
  const sitemapPath = SITEMAP_CANDIDATES.find((filePath) => fs.existsSync(filePath));
  const sitemapUrls = sitemapPath ? parseSitemapUrls(fs.readFileSync(sitemapPath, 'utf-8')) : [];
  const host = resolveHost(sitemapUrls);
  const key = resolveKey();
  const urlList = collectUrls(host);

  if (!urlList.length) {
    throw new Error('No URLs found. Run `npm run build` first so dist/ (or sitemap-0.xml) exists.');
  }

  const payload = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList,
  };

  console.log(`POST ${ENDPOINT} (${urlList.length} URLs) host=${host}`);
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const body = (await response.text()).trim();
  const label = statusLabel(response.status);
  console.log(`IndexNow HTTP ${response.status} ${response.statusText} (${label})`);
  console.log(`URLs submitted: ${urlList.length}`);
  if (body) console.log(`Response body: ${body}`);

  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow submission failed with HTTP ${response.status}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
