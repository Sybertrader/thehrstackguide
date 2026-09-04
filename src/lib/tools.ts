import fs from 'node:fs';
import path from 'node:path';

/**
 * Tool-level narrative content used to power the SEO deep-dive sections on
 * comparison pages. Keyed by `tool_a_id`/`tool_b_id` from comparisons.csv
 * rather than duplicated per-comparison, since this content describes the
 * tool itself (not a specific A-vs-B pairing).
 */
/**
 * One vendor's take on a single enterprise analysis topic (IP assignment, tax
 * withholding, statutory benefits, fee structure). Rendered as a short summary
 * plus scannable bullets in the enterprise deep-dive on comparison pages.
 */
export interface EnterpriseAnalysis {
  summary: string;
  bullets: string[];
}

/**
 * Enterprise-tier analysis topics. Only populated for Employer of Record and
 * Global Payroll vendors — these questions (cross-border IP transfer, 13th
 * month salary, severance liability, EOR deposits) have no meaningful answer
 * for an ATS or performance management tool, so those profiles omit the key
 * entirely and the comparison template hides the section.
 */
export interface EnterpriseAnalysisSet {
  ip_assignment?: EnterpriseAnalysis;
  tax_withholding?: EnterpriseAnalysis;
  statutory_benefits?: EnterpriseAnalysis;
  fee_structure?: EnterpriseAnalysis;
}

export interface ToolProfile {
  category?: string;
  logo?: string;
  rating?: string;
  review_count?: string;
  rating_source?: string;
  starting_price?: string;
  free_trial?: boolean;
  hasFreeTrial?: boolean;
  isManualLead?: boolean;
  partner_landing_url?: string;
  /** First-party marketing host, e.g. `plane.com`. Used for UTM fallbacks. */
  domain?: string;
  website?: string;
  affiliate_url?: string;
  has_active_affiliate?: boolean;
  is_partner?: boolean;
  contractor_price?: number;
  eor_price?: number;
  countries?: string;
  target_segment?: string;
  positioning: string;
  text_compliance: string;
  text_global_reach: string;
  text_pricing_truth: string;
  choose_if: string[];
  enterprise_analysis?: EnterpriseAnalysisSet;
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
