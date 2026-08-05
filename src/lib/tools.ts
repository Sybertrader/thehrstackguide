import fs from 'node:fs';
import path from 'node:path';

/**
 * Tool-level narrative content used to power the SEO deep-dive sections on
 * comparison pages. Keyed by `tool_a_id`/`tool_b_id` from comparisons.csv
 * rather than duplicated per-comparison, since this content describes the
 * tool itself (not a specific A-vs-B pairing).
 */
export interface ToolProfile {
  category?: string;
  rating?: string;
  review_count?: string;
  rating_source?: string;
  positioning: string;
  text_compliance: string;
  text_global_reach: string;
  text_pricing_truth: string;
  choose_if: string[];
}

let cache: Record<string, ToolProfile> | null = null;

export function loadToolProfiles(): Record<string, ToolProfile> {
  if (cache) return cache;
  const dataPath = path.join(process.cwd(), 'src/data/tools.json');
  const content = fs.readFileSync(dataPath, 'utf-8');
  cache = JSON.parse(content) as Record<string, ToolProfile>;
  return cache;
}

/** Returns the tool's editorial profile, or null if it hasn't been written yet. */
export function getToolProfile(toolId: string): ToolProfile | null {
  const profiles = loadToolProfiles();
  return profiles[toolId] ?? null;
}

/** Returns all tool profiles (with their ids) matching a given category, e.g. 'payroll-eor', 'ats', or 'performance-management'. */
export function getToolsByCategory(category: string): Array<ToolProfile & { id: string }> {
  const profiles = loadToolProfiles();
  return Object.entries(profiles)
    .filter(([, profile]) => profile.category === category)
    .map(([id, profile]) => ({ id, ...profile }));
}
