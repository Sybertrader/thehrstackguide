#!/usr/bin/env node
/**
 * Vendor catalog purge for The HR Stack Guide.
 *
 * Retains only allowlisted vendors in tools.json and comparisons.csv.
 * Existing keep-list vendor ids are treated as route parameters and are
 * never renamed (deel, oyster-hr, payoneer-workforce-management, etc.).
 *
 * Categories stay frozen: payroll-eor, ats, performance-management.
 *
 * Usage:
 *   node scripts/purge-vendors.mjs
 *   node scripts/purge-vendors.mjs --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');

const CATALOG_PATH = path.join(ROOT, 'src/data/vendor-catalog.json');
const TOOLS_PATH = path.join(ROOT, 'src/data/tools.json');
const TOOLS_SCHEMA_PATH = path.join(ROOT, 'src/data/tools.schema.json');
const COMPARISONS_PATH = path.join(ROOT, 'comparisons.csv');
const AUDIT_PATH = path.join(ROOT, 'h1-titles-audit.csv');

const FROZEN_CATEGORIES = new Set(['payroll-eor', 'ats', 'performance-management']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function stringifyCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header] ?? '')).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function loadCatalog() {
  const catalog = readJson(CATALOG_PATH);
  const keepVendors = catalog.keepVendors ?? [];
  const keepIds = keepVendors.map((vendor) => vendor.id);
  const keepSet = new Set(keepIds);
  const aliases = catalog.stableIdAliases ?? {};

  if (keepSet.size !== keepIds.length) {
    throw new Error('vendor-catalog.json keepVendors contains duplicate ids');
  }

  for (const vendor of keepVendors) {
    if (!FROZEN_CATEGORIES.has(vendor.category)) {
      throw new Error(`Keep vendor ${vendor.id} has illegal category ${vendor.category}`);
    }
  }

  for (const [alias, target] of Object.entries(aliases)) {
    if (keepSet.has(alias)) {
      throw new Error(`Alias ${alias} collides with a live vendor id`);
    }
    if (!keepSet.has(target) && !(catalog.purgeVendors ?? []).some((vendor) => vendor.id === target)) {
      throw new Error(`Alias ${alias} points at unknown id ${target}`);
    }
  }

  return { catalog, keepVendors, keepIds, keepSet, aliases };
}

function resolveStableId(rawId, keepSet, aliases) {
  if (!rawId) return rawId;
  if (keepSet.has(rawId)) return rawId;
  return aliases[rawId] ?? rawId;
}

function filterTools(tools, keepSet, aliases) {
  const kept = {};
  const removed = [];
  const renamedAttempt = [];

  for (const [id, profile] of Object.entries(tools)) {
    if (id.startsWith('$')) continue;

    const resolved = resolveStableId(id, keepSet, aliases);
    if (resolved !== id && keepSet.has(resolved)) {
      renamedAttempt.push({ from: id, to: resolved });
    }

    if (!keepSet.has(id)) {
      removed.push(id);
      continue;
    }

    if (profile?.category && !FROZEN_CATEGORIES.has(profile.category)) {
      throw new Error(`Refusing to keep ${id}: category ${profile.category} is not in the frozen category set`);
    }

    kept[id] = profile;
  }

  const missing = [...keepSet].filter((id) => !Object.prototype.hasOwnProperty.call(kept, id));
  return { kept, removed, renamedAttempt, missing };
}

function filterComparisons(rows, keepSet, aliases) {
  const kept = [];
  const removed = [];

  for (const row of rows) {
    const toolA = resolveStableId(row.tool_a_id, keepSet, aliases);
    const toolB = resolveStableId(row.tool_b_id, keepSet, aliases);

    if (toolA !== row.tool_a_id || toolB !== row.tool_b_id) {
      throw new Error(
        `Refusing to rewrite comparison ${row.slug}: vendor ids are route parameters (${row.tool_a_id}, ${row.tool_b_id})`,
      );
    }

    if (keepSet.has(row.tool_a_id) && keepSet.has(row.tool_b_id)) {
      kept.push(row);
      continue;
    }

    removed.push({
      slug: row.slug,
      tool_a_id: row.tool_a_id,
      tool_b_id: row.tool_b_id,
    });
  }

  return { kept, removed };
}

function slugMentionsPurgedVendor(urlPath, keepSet) {
  const slug = urlPath.replace(/^\/+|\/+$/g, '');
  if (!slug || !slug.includes('-vs-')) return false;
  const hub = slug.split('-for-')[0];
  const vsIndex = hub.indexOf('-vs-');
  if (vsIndex === -1) return false;
  const toolA = hub.slice(0, vsIndex);
  const toolB = hub.slice(vsIndex + 4);
  return Boolean(toolA && toolB && (!keepSet.has(toolA) || !keepSet.has(toolB)));
}

function filterAudit(rows, keepSet) {
  const kept = [];
  const removed = [];
  for (const row of rows) {
    const url = row['URL Path'] ?? row.url ?? '';
    if (slugMentionsPurgedVendor(url, keepSet)) {
      removed.push(url);
      continue;
    }
    kept.push(row);
  }
  return { kept, removed };
}

function assertSchemaAllowlist(schema, keepIds) {
  const names = schema.propertyNames?.enum ?? [];
  const required = schema.required ?? [];
  const sortedKeep = [...keepIds].sort();
  const sortedNames = [...names].sort();
  const sortedRequired = [...required].sort();
  if (JSON.stringify(sortedKeep) !== JSON.stringify(sortedNames)) {
    throw new Error('tools.schema.json propertyNames.enum does not match vendor-catalog keep ids');
  }
  if (JSON.stringify(sortedKeep) !== JSON.stringify(sortedRequired)) {
    throw new Error('tools.schema.json required keys do not match vendor-catalog keep ids');
  }
}

function countByCategory(tools) {
  const counts = {};
  for (const profile of Object.values(tools)) {
    const category = profile.category ?? 'unknown';
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}

function hubKey(row) {
  return `${row.tool_a_id}-vs-${row.tool_b_id}`;
}

function main() {
  const { keepVendors, keepIds, keepSet, aliases } = loadCatalog();
  const schema = readJson(TOOLS_SCHEMA_PATH);
  assertSchemaAllowlist(schema, keepIds);

  const tools = readJson(TOOLS_PATH);
  const toolResult = filterTools(tools, keepSet, aliases);
  if (toolResult.missing.length > 0) {
    throw new Error(`Keep-list vendors missing from tools.json: ${toolResult.missing.join(', ')}`);
  }
  if (toolResult.renamedAttempt.length > 0) {
    console.warn('Alias keys found in tools.json and dropped (ids were not rewritten):');
    for (const attempt of toolResult.renamedAttempt) {
      console.warn(`  ${attempt.from} -> ${attempt.to}`);
    }
  }

  const comparisonContent = fs.readFileSync(COMPARISONS_PATH, 'utf-8');
  const comparisonRows = parse(comparisonContent, { columns: true, skip_empty_lines: true });
  const comparisonHeaders = parse(comparisonContent, { columns: false, skip_empty_lines: true })[0];
  const comparisonResult = filterComparisons(comparisonRows, keepSet, aliases);

  let auditResult = { kept: null, removed: [] };
  if (fs.existsSync(AUDIT_PATH)) {
    const auditContent = fs.readFileSync(AUDIT_PATH, 'utf-8');
    const auditRows = parse(auditContent, { columns: true, skip_empty_lines: true });
    const auditHeaders = parse(auditContent, { columns: false, skip_empty_lines: true })[0];
    auditResult = filterAudit(auditRows, keepSet);
    auditResult.headers = auditHeaders;
  }

  const hubs = new Set(comparisonResult.kept.map(hubKey));
  const categoryCounts = countByCategory(toolResult.kept);

  const report = {
    dryRun: DRY_RUN,
    keepVendorCount: keepIds.length,
    keepVendors,
    removedToolIds: toolResult.removed,
    retainedToolIds: Object.keys(toolResult.kept),
    toolsByCategory: categoryCounts,
    comparisonsBefore: comparisonRows.length,
    comparisonsAfter: comparisonResult.kept.length,
    comparisonsRemoved: comparisonResult.removed.length,
    liveHubs: hubs.size,
    auditRowsRemoved: auditResult.removed.length,
  };

  console.log(JSON.stringify(report, null, 2));

  if (DRY_RUN) {
    console.log('\nDry run only. Re-run without --dry-run to write files.');
    return;
  }

  writeJson(TOOLS_PATH, toolResult.kept);
  fs.writeFileSync(COMPARISONS_PATH, stringifyCsv(comparisonHeaders, comparisonResult.kept));
  if (auditResult.kept && auditResult.headers) {
    fs.writeFileSync(AUDIT_PATH, stringifyCsv(auditResult.headers, auditResult.kept));
  }

  console.log('\nWrote src/data/tools.json, comparisons.csv, and h1-titles-audit.csv');
}

main();
