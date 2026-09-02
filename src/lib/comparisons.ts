import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'csv-parse/sync';
import { loadToolProfiles } from './tools';

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
  /** Sub-niche positioning tag, e.g. "Best for US SMBs (1–50)". */
  tool_a_badge: string;
  tool_a_logo_url: string;
  tool_a_rating: string;
  tool_a_starting_price: string;
  tool_a_pricing_model: string;
  /** Fine print behind the headline price: add-ons, FX spreads, module gating. */
  tool_a_pricing_nuance: string;
  tool_a_free_trial: string;
  tool_a_affiliate_url: string;
  tool_a_key_features: string;
  tool_a_pros: string;
  tool_a_cons: string;
  tool_b_id: string;
  tool_b_name: string;
  tool_b_badge: string;
  tool_b_logo_url: string;
  tool_b_rating: string;
  tool_b_starting_price: string;
  tool_b_pricing_model: string;
  tool_b_pricing_nuance: string;
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
  /** Two-sentence editorial takeaway rendered as the "The HR Stack Take" blockquote. */
  hr_stack_take: string;
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

/**
 * Related-comparison cards for internal-link hubs ("SEO colonies").
 * Titles are the visible anchor text, so they stay keyword-rich and unique
 * per slot rather than repeating a single "{A} vs {B}" pattern on every card.
 */
export interface RelatedComparisonCard {
  title: string;
  slug: string;
  vendorA: string;
  vendorB: string;
}

const RELATED_LIMIT = 4;
const RELATED_MIN = 3;

function pairKey(toolA: string, toolB: string): string {
  return toolA < toolB ? `${toolA}::${toolB}` : `${toolB}::${toolA}`;
}

function sharesEitherTool(candidate: Comparison, current: Comparison): boolean {
  return (
    candidate.tool_a_id === current.tool_a_id ||
    candidate.tool_a_id === current.tool_b_id ||
    candidate.tool_b_id === current.tool_a_id ||
    candidate.tool_b_id === current.tool_b_id
  );
}

function toolFrequency(all: Comparison[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const row of all) {
    freq.set(row.tool_a_id, (freq.get(row.tool_a_id) ?? 0) + 1);
    freq.set(row.tool_b_id, (freq.get(row.tool_b_id) ?? 0) + 1);
  }
  return freq;
}

function popularity(row: Comparison, freq: Map<string, number>): number {
  return (freq.get(row.tool_a_id) ?? 0) + (freq.get(row.tool_b_id) ?? 0);
}

function categoryOf(
  toolId: string,
  profiles: Record<string, { category?: string }>,
): string | undefined {
  return profiles[toolId]?.category;
}

function sameCategory(
  row: Comparison,
  current: Comparison,
  profiles: Record<string, { category?: string }>,
): boolean {
  const currentCategory =
    categoryOf(current.tool_a_id, profiles) ?? categoryOf(current.tool_b_id, profiles);
  const rowCategory = categoryOf(row.tool_a_id, profiles) ?? categoryOf(row.tool_b_id, profiles);
  return Boolean(currentCategory && rowCategory && currentCategory === rowCategory);
}

function featuresTool(row: Comparison, toolId: string): boolean {
  return row.tool_a_id === toolId || row.tool_b_id === toolId;
}

function otherToolId(row: Comparison, current: Comparison): string | null {
  const currentTools = new Set([current.tool_a_id, current.tool_b_id]);
  if (!currentTools.has(row.tool_a_id)) return row.tool_a_id;
  if (!currentTools.has(row.tool_b_id)) return row.tool_b_id;
  return null;
}

function pickUniquePairs(
  candidates: Comparison[],
  takenPairs: Set<string>,
  takenSlugs: Set<string>,
  remaining: number,
  takenOthers?: Set<string>,
  current?: Comparison,
): Comparison[] {
  if (remaining <= 0) return [];
  const picked: Comparison[] = [];
  for (const row of candidates) {
    if (picked.length >= remaining) break;
    if (takenSlugs.has(row.slug)) continue;
    const key = pairKey(row.tool_a_id, row.tool_b_id);
    if (takenPairs.has(key)) continue;
    if (takenOthers && current) {
      const other = otherToolId(row, current);
      if (other && takenOthers.has(other)) continue;
    }
    takenPairs.add(key);
    takenSlugs.add(row.slug);
    if (takenOthers && current) {
      const other = otherToolId(row, current);
      if (other) takenOthers.add(other);
    }
    picked.push(row);
  }
  return picked;
}

/**
 * Alternate Tool A pairings with Tool B pairings so a Deel vs Remote page
 * links out to both Deel-vs-X and Remote-vs-Y, not four Deel cards.
 * Unique third vendors are preferred; repeats are allowed only to fill a side.
 */
function pickOverlappingMix(
  overlapping: Comparison[],
  current: Comparison,
  takenPairs: Set<string>,
  takenSlugs: Set<string>,
  remaining: number,
): Comparison[] {
  const perSide = Math.ceil(remaining / 2);
  const aSide = overlapping.filter((row) => featuresTool(row, current.tool_a_id));
  const bSide = overlapping.filter((row) => featuresTool(row, current.tool_b_id));
  const takenOthers = new Set<string>();

  const aPicks = pickUniquePairs(aSide, takenPairs, takenSlugs, perSide, takenOthers, current);
  if (aPicks.length < perSide) {
    aPicks.push(
      ...pickUniquePairs(aSide, takenPairs, takenSlugs, perSide - aPicks.length),
    );
  }

  const bPicks = pickUniquePairs(bSide, takenPairs, takenSlugs, remaining - aPicks.length, takenOthers, current);
  if (aPicks.length + bPicks.length < remaining) {
    bPicks.push(
      ...pickUniquePairs(bSide, takenPairs, takenSlugs, remaining - aPicks.length - bPicks.length),
    );
  }

  const mixed: Comparison[] = [];
  const maxLen = Math.max(aPicks.length, bPicks.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (i < aPicks.length) mixed.push(aPicks[i]);
    if (i < bPicks.length) mixed.push(bPicks[i]);
  }
  return mixed;
}

function relatedTitle(item: Comparison, index: number): string {
  switch (index % 3) {
    case 1:
      return `${item.tool_a_name} vs ${item.tool_b_name} Pricing`;
    case 2:
      return `${item.tool_a_name} vs ${item.tool_b_name} for ${item.niche_name}`;
    default:
      return `${item.tool_a_name} vs ${item.tool_b_name} Comparison`;
  }
}

/**
 * Pick 3–4 other comparisons to link from `current`.
 *
 * Priority:
 *   1. Other pairings that feature Tool A or Tool B, interleaved so both
 *      vendors get colony links. Same tool-pair in a different niche is
 *      skipped so the grid does not fill with audience variants of the
 *      same two vendors.
 *   2. Same-category pairings, ranked by how often their vendors appear
 *      across the dataset (a cheap "popular" signal).
 *   3. Site-wide popular pairings, if a sparse tool still cannot fill 3 slots.
 */
export function getRelatedComparisons(
  all: Comparison[],
  current: Comparison,
): RelatedComparisonCard[] {
  const profiles = loadToolProfiles();
  const freq = toolFrequency(all);
  const others = all.filter((row) => row.slug !== current.slug);

  const overlapScore = (row: Comparison): number => {
    let score = 0;
    if (row.tool_a_id === current.tool_a_id || row.tool_a_id === current.tool_b_id) score += 2;
    if (row.tool_b_id === current.tool_a_id || row.tool_b_id === current.tool_b_id) score += 2;
    if (row.niche_id === current.niche_id) score += 1;
    if (pairKey(row.tool_a_id, row.tool_b_id) !== pairKey(current.tool_a_id, current.tool_b_id)) {
      score += 3;
    }
    return score;
  };

  const overlapping = others
    .filter((row) => sharesEitherTool(row, current))
    .sort(
      (a, b) =>
        overlapScore(b) - overlapScore(a) ||
        popularity(b, freq) - popularity(a, freq) ||
        a.slug.localeCompare(b.slug),
    );

  const takenPairs = new Set([pairKey(current.tool_a_id, current.tool_b_id)]);
  const takenSlugs = new Set([current.slug]);
  const selected: Comparison[] = pickOverlappingMix(
    overlapping,
    current,
    takenPairs,
    takenSlugs,
    RELATED_LIMIT,
  );

  if (selected.length < RELATED_MIN) {
    const categoryBackfill = others
      .filter((row) => sameCategory(row, current, profiles))
      .sort(
        (a, b) =>
          Number(b.niche_id === current.niche_id) - Number(a.niche_id === current.niche_id) ||
          popularity(b, freq) - popularity(a, freq) ||
          a.slug.localeCompare(b.slug),
      );
    selected.push(
      ...pickUniquePairs(categoryBackfill, takenPairs, takenSlugs, RELATED_LIMIT - selected.length),
    );
  }

  if (selected.length < RELATED_MIN) {
    const globalBackfill = [...others].sort(
      (a, b) => popularity(b, freq) - popularity(a, freq) || a.slug.localeCompare(b.slug),
    );
    selected.push(
      ...pickUniquePairs(globalBackfill, takenPairs, takenSlugs, RELATED_LIMIT - selected.length),
    );
  }

  return selected.map((item, index) => ({
    title: relatedTitle(item, index),
    slug: item.slug,
    vendorA: item.tool_a_name,
    vendorB: item.tool_b_name,
  }));
}
