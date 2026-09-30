#!/usr/bin/env node
/**
 * Post-build IndexNow ping. Runs after `astro build`, reads sitemap-0.xml,
 * and POSTs every <loc> to https://api.indexnow.org/indexnow.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const HOST = 'www.thehrstackguide.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

const SITEMAP_CANDIDATES = [
  path.join(rootDir, 'dist/client/sitemap-0.xml'),
  path.join(rootDir, 'dist/sitemap-0.xml'),
  path.join(rootDir, '.vercel/output/static/sitemap-0.xml'),
  path.join(rootDir, 'public/sitemap-0.xml'),
];

function resolveKey() {
  const publicDir = path.join(rootDir, 'public');
  const keys = fs
    .readdirSync(publicDir)
    .filter((entry) => entry.endsWith('.txt'))
    .map((entry) => path.basename(entry, '.txt'))
    .filter((key) => KEY_PATTERN.test(key))
    .filter((key) => {
      const contents = fs.readFileSync(path.join(publicDir, `${key}.txt`), 'utf-8').trim();
      return contents === key;
    });

  if (!keys.length) {
    throw new Error('No IndexNow key file found in public/ (filename must equal file contents).');
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

function findSitemap() {
  const found = SITEMAP_CANDIDATES.find((filePath) => fs.existsSync(filePath));
  if (!found) {
    throw new Error(
      `sitemap-0.xml not found. Looked in:\n${SITEMAP_CANDIDATES.map((p) => `  ${p}`).join('\n')}`,
    );
  }
  return found;
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

async function main() {
  const key = resolveKey();
  const sitemapPath = findSitemap();
  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  const urlList = parseSitemapUrls(xml);

  console.log(`Read ${urlList.length} URL(s) from ${path.relative(rootDir, sitemapPath)}`);

  if (!urlList.length) {
    throw new Error('sitemap-0.xml contained no <loc> URLs.');
  }

  const payload = {
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList,
  };

  console.log(`POST ${ENDPOINT} (${urlList.length} URLs)`);
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const body = (await response.text()).trim();
  console.log(`IndexNow status: ${response.status} ${response.statusText}`);
  if (body) console.log(`IndexNow body: ${body}`);

  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow submission failed with HTTP ${response.status}`);
  }

  console.log('IndexNow submission successful.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
