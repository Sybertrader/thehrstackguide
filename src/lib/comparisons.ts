import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'csv-parse/sync';
import { personaDataForComparison } from '../data/personaData';
import { isComparisonRouteSlug } from './comparison-routes';
import type { Comparison } from '../types/comparison';

export type {
  AtsFeatures,
  AtsPersonaData,
  Comparison,
  ComparisonSubNiche,
  FeatureMatrixEntry,
  FeatureSpec,
  GlobalPayrollFeatures,
  GlobalPayrollPersonaData,
  PerformanceMgmtFeatures,
  PerformanceMgmtPersonaData,
  PersonaData,
} from '../types/comparison';

export function loadComparisons(): Comparison[] {
  const csvPath = path.join(process.cwd(), 'comparisons.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as Comparison[];
  return rows
    .filter((row) => isComparisonRouteSlug(row.slug))
    .map((row) => {
      const personaData = personaDataForComparison(
        row.tool_a_id,
        row.tool_b_id,
        row.tool_a_name,
        row.tool_b_name
      );
      if (!personaData) {
        throw new Error(
          `Missing personaData pack for ${row.tool_a_id} vs ${row.tool_b_id} (${row.slug})`
        );
      }
      return { ...row, personaData };
    });
}

/**
 * Freshness dates are intentionally tied to the real git history of
 * `comparisons.csv` (the source of truth for every rating, price, and URL on
 * the site) rather than the current wall-clock time. This keeps "Updated: ..."
 * badges and dateModified/datePublished schema accurate to when the
 * underlying data actually changed, avoiding "date spam" (showing a
 * perpetually-current date regardless of whether content was really
 * refreshed), which search engines treat as a manipulative freshness signal.
 */
function getGitDateForCsv(gitLogArgs: string[]): Date | null {
  try {
    const csvPath = path.join(process.cwd(), 'comparisons.csv');
    const output = execFileSync('git', ['log', ...gitLogArgs, '--', csvPath], {
      cwd: process.cwd(),
      encoding: 'utf-8',
    }).trim();
    const isoDate = output.split('\n').filter(Boolean).pop();
    if (!isoDate) return null;
    const parsed = new Date(isoDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function getCsvFileMtime(): Date | null {
  try {
    const csvPath = path.join(process.cwd(), 'comparisons.csv');
    return fs.statSync(csvPath).mtime;
  } catch {
    return null;
  }
}

/** Most recent date `comparisons.csv` was actually changed (falls back to file mtime, then now). */
export function getComparisonsLastUpdated(): Date {
  return getGitDateForCsv(['-1', '--format=%cI']) ?? getCsvFileMtime() ?? new Date();
}

/** Date `comparisons.csv` was first added to the repo (falls back to the last-updated date). */
export function getComparisonsFirstPublished(): Date {
  return (
    getGitDateForCsv(['--follow', '--diff-filter=A', '--format=%cI']) ?? getComparisonsLastUpdated()
  );
}
