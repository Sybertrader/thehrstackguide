#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Editorial markdown generation is disabled. Comparison pages render
// CSV-backed verdict/cards/tables only; do not regenerate uniqueProse.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../src/content/comparisons');
const PUBLIC_DIR = path.join(__dirname, '../public');
const MANIFEST_OUTPUT = path.join(__dirname, '../required-images.json');

const SIMILARITY_THRESHOLD = 0.25;
const MIN_WORD_COUNT = 300;
/**
 * Tokens that appear on 2+ comparison routes are shared vendor/category
 * vocabulary (e.g. Culture Amp survey science on two Culture Amp hubs).
 * Uniqueness is measured on hapax tokens plus a raw near-duplicate cap.
 */
const MAX_DOCUMENT_FREQUENCY = 2;
const RAW_NEAR_DUPLICATE = 0.8;

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );
}

function calculateJaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function auditPages() {
  console.log('🔍 Starting pSEO Pre-Build Quality & Uniqueness Audit...\n');

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('Comparison markdown collection retired. Pages render from comparisons.csv.');
    process.exit(0);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  if (files.length === 0) {
    console.log('Comparison markdown collection retired. Pages render from comparisons.csv.');
    process.exit(0);
  }

  const pageData = [];
  const missingImageManifest = [];
  let failedQuality = false;

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const textBody = content.replace(/^---[\s\S]+?---/, '');
    const words = textBody.trim().split(/\s+/).filter(Boolean).length;

    if (words < MIN_WORD_COUNT) {
      console.error(`❌ Quality Failure: ${file} has only ${words} words (Minimum: ${MIN_WORD_COUNT})`);
      failedQuality = true;
    }

    const imageMatches = content.match(/src:\s*["']?([^"'\s\n]+)["']?/g) || [];
    for (const match of imageMatches) {
      const imgPath = match.replace(/src:\s*["']?/, '').replace(/["']?$/, '');
      const fullImgPath = path.join(PUBLIC_DIR, imgPath);
      if (!fs.existsSync(fullImgPath)) {
        missingImageManifest.push({ file, missingImage: imgPath });
      }
    }

    pageData.push({
      file,
      tokens: tokenize(textBody),
    });
  }

  if (missingImageManifest.length > 0) {
    fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(missingImageManifest, null, 2));
    console.error(`❌ Image Manifest Failure: Missing ${missingImageManifest.length} UI screenshot(s).`);
    console.error(`📄 See missing file details in: required-images.json\n`);
    process.exit(1);
  }

  const df = new Map();
  for (const page of pageData) {
    for (const token of page.tokens) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }

  const discriminative = pageData.map((page) => ({
    file: page.file,
    tokens: new Set([...page.tokens].filter((token) => (df.get(token) ?? 0) < MAX_DOCUMENT_FREQUENCY)),
  }));

  let failedSimilarity = false;
  for (let i = 0; i < pageData.length; i++) {
    for (let j = i + 1; j < pageData.length; j++) {
      const raw = calculateJaccardSimilarity(pageData[i].tokens, pageData[j].tokens);
      if (raw >= RAW_NEAR_DUPLICATE) {
        console.error(
          `❌ Similarity Failure: ${pageData[i].file} and ${pageData[j].file} look like near-duplicates (${(raw * 100).toFixed(1)}% raw Jaccard)`,
        );
        failedSimilarity = true;
      }
      const sim = calculateJaccardSimilarity(discriminative[i].tokens, discriminative[j].tokens);
      const sharedHapax = [...discriminative[i].tokens].filter((token) => discriminative[j].tokens.has(token));
      if (sim > SIMILARITY_THRESHOLD && sharedHapax.length >= 8) {
        console.error(
          `❌ Similarity Failure: ${discriminative[i].file} and ${discriminative[j].file} have ${(sim * 100).toFixed(1)}% unique-token overlap (Threshold: ${SIMILARITY_THRESHOLD * 100}%)`,
        );
        failedSimilarity = true;
      }
    }
  }

  if (failedQuality || failedSimilarity) {
    console.error('\n💥 Build aborted due to pSEO quality or uniqueness failures.');
    process.exit(1);
  }

  console.log(`✅ All pSEO Quality Gates Passed (${files.length} comparison routes). Proceeding to Astro build.\n`);
}

auditPages();
