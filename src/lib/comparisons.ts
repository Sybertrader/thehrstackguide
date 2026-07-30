import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'csv-parse/sync';

export interface FeatureMatrixEntry {
  a: boolean;
  b: boolean;
}

export interface Comparison {
  slug: string;
  niche_id: string;
  niche_name: string;
  niche_audience_phrase: string;
  target_audience: string;
  tool_a_id: string;
  tool_a_name: string;
  tool_a_logo_url: string;
  tool_a_rating: string;
  tool_a_starting_price: string;
  tool_a_pricing_model: string;
  tool_a_free_trial: string;
  tool_a_affiliate_url: string;
  tool_a_key_features: string;
  tool_a_pros: string;
  tool_a_cons: string;
  tool_b_id: string;
  tool_b_name: string;
  tool_b_logo_url: string;
  tool_b_rating: string;
  tool_b_starting_price: string;
  tool_b_pricing_model: string;
  tool_b_free_trial: string;
  tool_b_affiliate_url: string;
  tool_b_key_features: string;
  tool_b_pros: string;
  tool_b_cons: string;
  winner_id: string;
  winner_category: string;
  winner_label: string;
  winner_bullets: string;
  winner_reason: string;
  verdict_summary: string;
  feature_matrix_json: string;
  meta_title: string;
  meta_description: string;
}

export function loadComparisons(): Comparison[] {
  const csvPath = path.join(process.cwd(), 'comparisons.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true }) as Comparison[];
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
