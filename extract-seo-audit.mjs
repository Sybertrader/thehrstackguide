#!/usr/bin/env node
/**
 * Extract <title> and <h1> from every static HTML file in dist/.
 *
 * Usage:
 *   node extract-seo-audit.mjs
 *
 * If ./dist is missing, this script runs `npm run build` first.
 * Writes h1-titles-audit.csv at the project root.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, 'dist');
const outPath = path.join(rootDir, 'h1-titles-audit.csv');

function ensureDist() {
  if (fs.existsSync(distDir) && fs.statSync(distDir).isDirectory()) return;
  console.log('dist/ not found. Running npm run build…');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

function walkHtmlFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function fileToUrlPath(filePath) {
  const rel = path.relative(distDir, filePath).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

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

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : '';
}

function extractH1(html) {
  const matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  return matches
    .map((m) => stripTags(m[1]))
    .filter(Boolean)
    .join(' | ');
}

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

ensureDist();

const files = walkHtmlFiles(distDir).sort((a, b) => fileToUrlPath(a).localeCompare(fileToUrlPath(b)));
if (files.length === 0) {
  console.error('No HTML files found in dist/.');
  process.exit(1);
}

const rows = [['URL Path', 'Page Title', 'H1 Title']];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  rows.push([fileToUrlPath(file), extractTitle(html), extractH1(html)]);
}

const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
fs.writeFileSync(outPath, csv, 'utf8');

console.log(`Wrote ${files.length} pages to ${path.relative(rootDir, outPath)}`);
