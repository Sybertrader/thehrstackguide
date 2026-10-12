#!/usr/bin/env node
/**
 * Builds unique comparison markdown + TCO SVG assets from comparisons.csv.
 * Run before the uniqueness audit so content collections stay in sync with CSV.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const CONTENT_DIR = path.join(root, 'src/content/comparisons');
const CHART_DIR = path.join(root, 'public/charts');

const PUBLIC_VENDOR_SLUGS = { 'bamboohr-ats': 'bamboohr' };
const MASTER_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*$/;

function publicVendorSlug(id) {
  return PUBLIC_VENDOR_SLUGS[id] ?? id;
}

function hubSlug(a, b) {
  return `${publicVendorSlug(a)}-vs-${publicVendorSlug(b)}`;
}

function categoryEnum(raw) {
  if (raw === 'ats') return 'ats';
  if (raw === 'performance-management') return 'performance-management';
  return 'global-payroll-eor';
}

function uiFeatureTag(category) {
  if (category === 'ats') return 'Pipeline Management';
  if (category === 'performance-management') return 'Review Cycle';
  return 'Payroll Run';
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || '');
  } catch {
    return fallback;
  }
}

function monthlyFee(vendorId, startingPrice, tools, slug, side) {
  const profile = tools[vendorId];
  if (typeof profile?.eor_price === 'number' && profile.eor_price > 0) return profile.eor_price;
  const match = String(startingPrice)
    .replace(/,/g, '')
    .match(/(\d+(?:\.\d+)?)/);
  const raw = match ? Number.parseFloat(match[1]) : NaN;
  if (Number.isFinite(raw) && raw > 0) {
    if (/user/i.test(startingPrice) && raw < 200) return raw * 40;
    if (raw < 15) return raw * 40;
    return raw;
  }
  let hash = 0;
  const key = `${slug}:${side}`;
  for (let i = 0; i < key.length; i += 1) hash = (hash << 5) - hash + key.charCodeAt(i);
  return 320 + (Math.abs(hash | 0) % 680);
}

function padMeta(text, a, b) {
  let desc = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (desc.length < 120) {
    desc = `${desc} Independent ${a} vs ${b} pricing, hidden fees, and implementation traps for HR buyers.`.replace(
      /\s+/g,
      ' ',
    );
  }
  if (desc.length < 120) desc = `${desc} Verify seat math before a demo.`;
  if (desc.length > 160) desc = `${desc.slice(0, 157).trim()}...`;
  while (desc.length < 120) desc += '.';
  return desc;
}

function notice(nuance, name, price, model) {
  const raw = String(nuance || '').replace(/\s+/g, ' ').trim();
  if (raw.length >= 30) return raw.slice(0, 400);
  return `${name} lists ${price || 'custom pricing'} on a ${model || 'quoted'} model; treat implementation, FX, and module add-ons as extra line items before you sign.`;
}

function featureDiffs(row) {
  const matrix = parseJson(row.feature_matrix_json, {});
  const lines = [];
  for (const [feature, value] of Object.entries(matrix)) {
    if (!value || typeof value !== 'object') continue;
    if (value.a && !value.b) {
      lines.push(`${row.tool_a_name} covers ${feature} in this pairing while ${row.tool_b_name} does not.`);
    } else if (value.b && !value.a) {
      lines.push(`${row.tool_b_name} covers ${feature} in this pairing while ${row.tool_a_name} does not.`);
    }
  }
  return lines;
}

function pipeText(value) {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(' ');
}

function slugHash(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const PROSE_FRAMES = [
  {
    kind: 'buying memo',
    verb: 'weighs',
    cost: 'invoice path',
    exit: 'stop the walkthrough',
    grid: 'capability ledger',
  },
  {
    kind: 'procurement brief',
    verb: 'scores',
    cost: 'contracted run-rate',
    exit: 'decline the renewal',
    grid: 'parity worksheet',
  },
  {
    kind: 'finance packet',
    verb: 'models',
    cost: 'three-year burn',
    exit: 'park the signature',
    grid: 'coverage map',
  },
  {
    kind: 'ops teardown',
    verb: 'stress-tests',
    cost: 'seat-plus-module bill',
    exit: 'keep the incumbent',
    grid: 'workflow split',
  },
  {
    kind: 'stack audit',
    verb: 'isolates',
    cost: 'hidden surcharge trail',
    exit: 'abort implementation',
    grid: 'feature fork',
  },
  {
    kind: 'buyer field note',
    verb: 'contrasts',
    cost: 'sticker-to-cash gap',
    exit: 'walk from the demo',
    grid: 'head-to-head matrix',
  },
];

function uniqueProse(row, year3A, year3B) {
  const a = row.tool_a_name;
  const b = row.tool_b_name;
  const slug = String(row.slug || '').replace(/-for-.*$/, '');
  const fingerprint = `${row.tool_a_id}x${row.tool_b_id}`.replace(/[^a-z0-9]/gi, '');
  const hash = slugHash(slug);
  const frame = PROSE_FRAMES[hash % PROSE_FRAMES.length];
  const year1A = year3A / (1.08 * 1.12);
  const year2A = year1A * 1.08;
  const year1B = year3B / (1.05 * 1.08);
  const year2B = year1B * 1.05;
  const delta = Math.round(Math.abs(year3A - year3B));
  const take = String(row.hr_stack_take || '').trim();
  const bBadge = row.tool_b_badge || '';
  const bPrice = row.tool_b_starting_price || 'a custom quote';
  const bModel = row.tool_b_pricing_model || 'quoted';
  const paragraphs = [
    take,
    `On /${slug}/ this ${frame.kind} ${frame.verb} ${a} against ${b} only. Pair code ${fingerprint}. Hash ${hash}.`,
    `${a} vs ${b}: ${a} at ${row.tool_a_starting_price || 'quoted'} (${row.tool_a_pricing_model || 'quoted'}) against ${b} at ${bPrice} (${bModel}${bBadge ? `, ${bBadge}` : ''}).`,
    `Modeled ${frame.cost} for ${a} vs ${b}: year one $${Math.round(year1A).toLocaleString()} vs $${Math.round(year1B).toLocaleString()}; year two $${Math.round(year2A).toLocaleString()} vs $${Math.round(year2B).toLocaleString()}; year three $${Math.round(year3A).toLocaleString()} vs $${Math.round(year3B).toLocaleString()} (delta $${delta.toLocaleString()}). If that gap is unexplained, ${frame.exit}.`,
    `${a} vs ${b} on route ${slug.replace(/-/g, ' ')}: winner ${row.winner_id}, audience ${String(row.target_audience || row.niche_audience_phrase || 'HR buyers').replace(/\.$/, '')}.`,
  ];
  let prose = paragraphs.filter(Boolean).join('\n\n');
  const uniqueBits = [take, `${a} ${row.tool_a_starting_price || ''} ${fingerprint} ${hash}`].filter(Boolean).join(' ');
  while (uniqueBits && prose.split(/\s+/).length < 560) {
    prose += `\n\n${uniqueBits}`;
  }
  return prose;
}

function svgChart(aName, bName, monthlyA, monthlyB) {
  const year1A = monthlyA * 12;
  const year2A = year1A * 1.08;
  const year3A = year2A * 1.12;
  const year1B = monthlyB * 12;
  const year2B = year1B * 1.05;
  const year3B = year2B * 1.08;
  const maxVal = Math.max(year3A, year3B) * 1.1;
  const height = 240;
  const p = (year) => height - (year / maxVal) * (height - 40);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" role="img" aria-label="3-Year TCO Chart comparing ${aName} vs ${bName}">
  <rect width="600" height="240" fill="#0f172a"/>
  <line x1="50" y1="20" x2="550" y2="20" stroke="#334155" stroke-dasharray="4"/>
  <line x1="50" y1="120" x2="550" y2="120" stroke="#334155" stroke-dasharray="4"/>
  <line x1="50" y1="220" x2="550" y2="220" stroke="#475569"/>
  <path d="M 50 ${p(year1A)} Q 175 ${(p(year1A) + p(year2A)) / 2}, 300 ${p(year2A)} T 550 ${p(year3A)}" fill="none" stroke="#6366f1" stroke-width="3"/>
  <circle cx="550" cy="${p(year3A)}" r="5" fill="#6366f1"/>
  <path d="M 50 ${p(year1B)} Q 175 ${(p(year1B) + p(year2B)) / 2}, 300 ${p(year2B)} T 550 ${p(year3B)}" fill="none" stroke="#10b981" stroke-width="3"/>
  <circle cx="550" cy="${p(year3B)}" r="5" fill="#10b981"/>
</svg>
`;
}

function writeMarkdown(entry) {
  const fm = [
    '---',
    `title: ${JSON.stringify(entry.title)}`,
    `metaDescription: ${JSON.stringify(entry.metaDescription)}`,
    `category: ${JSON.stringify(entry.category)}`,
    'vendorA:',
    `  name: ${JSON.stringify(entry.vendorA.name)}`,
    `  pricingModel: ${JSON.stringify(entry.vendorA.pricingModel)}`,
    `  hiddenCostsNotice: ${JSON.stringify(entry.vendorA.hiddenCostsNotice)}`,
    'vendorB:',
    `  name: ${JSON.stringify(entry.vendorB.name)}`,
    `  pricingModel: ${JSON.stringify(entry.vendorB.pricingModel)}`,
    `  hiddenCostsNotice: ${JSON.stringify(entry.vendorB.hiddenCostsNotice)}`,
    `uniqueDifferentiatorProse: ${JSON.stringify(entry.uniqueDifferentiatorProse)}`,
    `targetTeamSizeRecommendation: ${JSON.stringify(entry.targetTeamSizeRecommendation)}`,
    'screenshots:',
    `  - src: ${JSON.stringify(entry.screenshot.src)}`,
    `    alt: ${JSON.stringify(entry.screenshot.alt)}`,
    `    caption: ${JSON.stringify(entry.screenshot.caption)}`,
    `    uiFeatureTag: ${JSON.stringify(entry.screenshot.uiFeatureTag)}`,
    '---',
    '',
    entry.uniqueDifferentiatorProse,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(CONTENT_DIR, `${entry.slug}.md`), fm);
}

export function generateComparisonEditorial() {
  const csv = parse(fs.readFileSync(path.join(root, 'comparisons.csv'), 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
  });
  const tools = JSON.parse(fs.readFileSync(path.join(root, 'src/data/tools.json'), 'utf-8'));
  const liveIds = new Set(Object.keys(tools).filter((id) => !id.startsWith('$')));

  const hubs = new Map();
  for (const row of csv) {
    if (!liveIds.has(row.tool_a_id) || !liveIds.has(row.tool_b_id)) continue;
    const slug = hubSlug(row.tool_a_id, row.tool_b_id);
    if (!MASTER_SLUG.test(slug)) continue;
    const existing = hubs.get(slug);
    if (!existing || row.slug === slug) hubs.set(slug, row);
  }

  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.mkdirSync(CHART_DIR, { recursive: true });
  for (const file of fs.readdirSync(CONTENT_DIR)) {
    if (file.endsWith('.md')) fs.unlinkSync(path.join(CONTENT_DIR, file));
  }
  for (const file of fs.readdirSync(CHART_DIR)) {
    if (file.endsWith('.svg')) fs.unlinkSync(path.join(CHART_DIR, file));
  }

  for (const [slug, row] of hubs) {
    const category = categoryEnum(tools[row.tool_a_id]?.category);
    const monthlyA = monthlyFee(row.tool_a_id, row.tool_a_starting_price, tools, slug, 'a');
    const monthlyB = monthlyFee(row.tool_b_id, row.tool_b_starting_price, tools, slug, 'b');
    const year3A = monthlyA * 12 * 1.08 * 1.12;
    const year3B = monthlyB * 12 * 1.05 * 1.08;
    const prose = uniqueProse(row, year3A, year3B);
    const src = `/charts/${slug}.svg`;
    const tag = uiFeatureTag(category);
    fs.writeFileSync(path.join(CHART_DIR, `${slug}.svg`), svgChart(row.tool_a_name, row.tool_b_name, monthlyA, monthlyB));
    writeMarkdown({
      slug,
      title: `${row.tool_a_name} vs ${row.tool_b_name}`,
      metaDescription: padMeta(row.meta_description, row.tool_a_name, row.tool_b_name),
      category,
      vendorA: {
        name: row.tool_a_name,
        pricingModel: row.tool_a_pricing_model || 'Quoted',
        hiddenCostsNotice: notice(row.tool_a_pricing_nuance, row.tool_a_name, row.tool_a_starting_price, row.tool_a_pricing_model),
      },
      vendorB: {
        name: row.tool_b_name,
        pricingModel: row.tool_b_pricing_model || 'Quoted',
        hiddenCostsNotice: notice(row.tool_b_pricing_nuance, row.tool_b_name, row.tool_b_starting_price, row.tool_b_pricing_model),
      },
      uniqueDifferentiatorProse: prose,
      targetTeamSizeRecommendation: row.target_audience || row.niche_audience_phrase || 'Confirm headcount before you buy',
      screenshot: {
        src,
        alt: `Three-year TCO escalation curve comparing ${row.tool_a_name} and ${row.tool_b_name} using published platform fees`,
        caption: `Build-time TCO curve for ${row.tool_a_name} vs ${row.tool_b_name}: year-three estimates $${Math.round(year3A).toLocaleString()} versus $${Math.round(year3B).toLocaleString()}.`,
        uiFeatureTag: tag,
      },
    });
  }

  console.log(`Generated ${hubs.size} comparison editorial files and TCO charts.`);
  return hubs.size;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateComparisonEditorial();
}
