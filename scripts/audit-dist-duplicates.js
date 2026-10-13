#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../dist');
const CLIENT_DIR = path.join(DIST_DIR, 'client');
const CATALOG_PATH = path.join(__dirname, '../src/data/vendor-catalog.json');

const THRESHOLD = {
  crossVertical: 0.35,
  independentSameVertical: 0.55,
  sibling: 0.8,
  identical: 0,
};

const TIER_LABEL = {
  crossVertical: 'Cross-Vertical',
  independentSameVertical: 'Independent Same-Vertical',
  sibling: 'Sibling Shared Vendor',
  identical: 'Identical Vendor Pair',
};

function loadVendorMeta() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  const idToCategory = new Map();
  const publicToId = new Map();
  for (const vendor of catalog.keepVendors ?? []) {
    idToCategory.set(vendor.id, vendor.category);
    publicToId.set(vendor.id, vendor.id);
  }
  for (const [publicSlug, internalId] of Object.entries(catalog.stableIdAliases ?? {})) {
    publicToId.set(publicSlug, internalId);
    const category = idToCategory.get(internalId);
    if (category) idToCategory.set(publicSlug, category);
  }
  // Public comparison URLs remap bamboohr-ats → bamboohr.
  publicToId.set('bamboohr', 'bamboohr-ats');
  idToCategory.set('bamboohr', idToCategory.get('bamboohr-ats'));
  return { idToCategory, publicToId };
}

function getAllHtmlFiles(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllHtmlFiles(fullPath));
    } else if (item.endsWith('.html') && !item.includes('404')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractMainHtml(htmlContent) {
  const tagged = htmlContent.match(/<main\b[^>]*\bid=["']main-content["'][^>]*>[\s\S]*?<\/main>/i);
  if (tagged) return tagged[0];
  const anyMain = htmlContent.match(/<main\b[^>]*>[\s\S]*?<\/main>/i);
  return anyMain ? anyMain[0] : '';
}

function extractShingles(htmlContent) {
  const mainHtml = extractMainHtml(htmlContent);
  const textContent = mainHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ');

  const words = textContent.split(/\s+/).filter((word) => word.length > 1);
  const shingles = new Set();
  for (let i = 0; i < words.length - 2; i += 1) {
    shingles.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return shingles;
}

function calculateJaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  const [smaller, larger] = setA.size < setB.size ? [setA, setB] : [setB, setA];
  for (const token of smaller) {
    if (larger.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function parseComparison(relPath, publicToId) {
  const normalized = relPath.replace(/\\/g, '/');
  const segment = normalized.split('/').find((part) => part.includes('-vs-'));
  if (!segment) return null;
  const vsIndex = segment.indexOf('-vs-');
  if (vsIndex === -1) return null;
  let toolA = segment.slice(0, vsIndex);
  let toolB = segment.slice(vsIndex + 4);
  const forIndex = toolB.indexOf('-for-');
  if (forIndex !== -1) toolB = toolB.slice(0, forIndex);
  if (!toolA || !toolB) return null;
  return {
    a: publicToId.get(toolA) ?? toolA,
    b: publicToId.get(toolB) ?? toolB,
    publicA: toolA,
    publicB: toolB,
  };
}

function vendorSetKey(comparison) {
  return [comparison.a, comparison.b].sort().join('|');
}

function pairVertical(comparison, idToCategory) {
  const catA = idToCategory.get(comparison.a);
  const catB = idToCategory.get(comparison.b);
  if (catA && catA === catB) return catA;
  return null;
}

function classifyPair(pageA, pageB, idToCategory) {
  const a = pageA.comparison;
  const b = pageB.comparison;
  if (!a || !b) {
    return { tier: 'crossVertical', threshold: THRESHOLD.crossVertical };
  }
  if (vendorSetKey(a) === vendorSetKey(b)) {
    return { tier: 'identical', threshold: THRESHOLD.identical };
  }
  const vendorsA = new Set([a.a, a.b]);
  const shared = [b.a, b.b].filter((id) => vendorsA.has(id)).length;
  const verticalA = pairVertical(a, idToCategory);
  const verticalB = pairVertical(b, idToCategory);
  if (shared === 1) {
    return { tier: 'sibling', threshold: THRESHOLD.sibling };
  }
  if (shared === 0 && verticalA && verticalA === verticalB) {
    return { tier: 'independentSameVertical', threshold: THRESHOLD.independentSameVertical };
  }
  return { tier: 'crossVertical', threshold: THRESHOLD.crossVertical };
}

function runAudit() {
  const htmlRoot = fs.existsSync(CLIENT_DIR) ? CLIENT_DIR : DIST_DIR;
  if (!fs.existsSync(htmlRoot)) {
    console.error('❌ Error: dist/ directory not found. Run "npx astro build" first.');
    process.exit(1);
  }

  const { idToCategory, publicToId } = loadVendorMeta();
  const htmlFiles = getAllHtmlFiles(htmlRoot);
  console.log(`Auditing ${htmlFiles.length} rendered HTML pages (trigram Jaccard on <main id="main-content">).\n`);

  const pages = htmlFiles.map((filePath) => {
    const html = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(htmlRoot, filePath);
    return {
      path: relativePath,
      tokens: extractShingles(html),
      comparison: parseComparison(relativePath, publicToId),
    };
  });

  const counts = {
    crossVertical: 0,
    independentSameVertical: 0,
    sibling: 0,
    identical: 0,
  };
  const violations = [];
  let pairCount = 0;

  for (let i = 0; i < pages.length; i += 1) {
    for (let j = i + 1; j < pages.length; j += 1) {
      pairCount += 1;
      const { tier, threshold } = classifyPair(pages[i], pages[j], idToCategory);
      counts[tier] += 1;
      const similarity = calculateJaccard(pages[i].tokens, pages[j].tokens);
      if (similarity > threshold) {
        violations.push({
          tier,
          threshold,
          similarity,
          a: pages[i].path,
          b: pages[j].path,
        });
      }
    }
  }

  console.log(`Total pairs audited: ${pairCount}`);
  console.log('Breakdown by tier:');
  console.log(`  Cross-Vertical: ${counts.crossVertical} (max ${(THRESHOLD.crossVertical * 100).toFixed(0)}%)`);
  console.log(
    `  Independent Same-Vertical: ${counts.independentSameVertical} (max ${(THRESHOLD.independentSameVertical * 100).toFixed(0)}%)`,
  );
  console.log(`  Sibling Shared Vendor: ${counts.sibling} (max ${(THRESHOLD.sibling * 100).toFixed(0)}%)`);
  console.log(`  Identical Vendor Pair: ${counts.identical} (max ${(THRESHOLD.identical * 100).toFixed(0)}%)`);

  if (violations.length === 0) {
    console.log('\nAudit passed. 0 threshold violations.');
    process.exit(0);
  }

  violations.sort((x, y) => y.similarity - x.similarity);
  console.log(`\n${violations.length} pair(s) exceeded the calibrated threshold:\n`);
  for (const row of violations) {
    console.error(
      `[${TIER_LABEL[row.tier]}] ${(row.similarity * 100).toFixed(1)}% > ${(row.threshold * 100).toFixed(0)}%: ${row.a} <--> ${row.b}`,
    );
  }
  process.exit(1);
}

runAudit();
