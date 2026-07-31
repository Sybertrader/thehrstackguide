// Submits all site URLs to IndexNow (https://www.indexnow.org/) so search
// engines (Bing, Yandex, Seznam, Naver, etc.) can discover new/changed pages
// quickly instead of waiting for a crawl.
//
// Usage: node scripts/submit-indexnow.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const host = 'thehrstackguide.com';
const key = 'aa146a79ee0b4427b4e828d4908d6c7d';
const keyLocation = `https://${host}/${key}.txt`;

// Static routes that aren't generated from comparisons.csv.
const staticRoutes = ['/', '/affiliate-disclosure', '/privacy-policy', '/terms'];

function loadComparisonSlugs() {
  const csvPath = path.join(rootDir, 'comparisons.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(content, { columns: true, skip_empty_lines: true });
  return rows.map((row) => `/${row.slug}`);
}

function buildUrlList() {
  const slugRoutes = loadComparisonSlugs();
  const allRoutes = [...staticRoutes, ...slugRoutes];
  return allRoutes.map((route) => new URL(route, `https://${host}`).toString());
}

async function submitToIndexNow(urlList) {
  const payload = {
    host,
    key,
    keyLocation,
    urlList,
  };

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  console.log(`IndexNow submission: ${urlList.length} URLs`);
  console.log(`HTTP status: ${response.status} ${response.statusText}`);
  if (body) console.log(`Response body: ${body}`);

  if (!response.ok) {
    throw new Error(`IndexNow submission failed with status ${response.status}`);
  }

  console.log('IndexNow submission successful.');
}

const urlList = buildUrlList();
await submitToIndexNow(urlList);
