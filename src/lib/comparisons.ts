import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

export interface FeatureMatrixEntry {
  a: boolean;
  b: boolean;
}

export interface Comparison {
  slug: string;
  niche_id: string;
  niche_name: string;
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
