import type { Comparison } from './comparisons';
import { comparisonHubSlug } from './comparison-routes';
import { comparisonFamily } from './persona-evaluation';

const MIN_RELATED = 4;
const MAX_RELATED = 6;

function sharesVendor(row: Comparison, vendorId: string): boolean {
  return row.tool_a_id === vendorId || row.tool_b_id === vendorId;
}

/**
 * 4–6 other master hubs for the related-comparisons mesh:
 * vendor A pairs, then vendor B pairs, then same-category fill.
 */
export function pickRelatedHubs(
  current: Comparison,
  hubs: Comparison[],
  _min = MIN_RELATED,
  max = MAX_RELATED
): Comparison[] {
  const currentKey = comparisonHubSlug(current.tool_a_id, current.tool_b_id);
  const family = comparisonFamily(current.tool_a_id, current.tool_b_id);
  const others = hubs.filter(
    (row) => comparisonHubSlug(row.tool_a_id, row.tool_b_id) !== currentKey
  );

  const fromA = others.filter((row) => sharesVendor(row, current.tool_a_id));
  const fromB = others.filter((row) => sharesVendor(row, current.tool_b_id));
  const fromCategory = others.filter(
    (row) => comparisonFamily(row.tool_a_id, row.tool_b_id) === family
  );

  const seen = new Set<string>([currentKey]);
  const picked: Comparison[] = [];

  const take = (row: Comparison) => {
    const key = comparisonHubSlug(row.tool_a_id, row.tool_b_id);
    if (seen.has(key) || picked.length >= max) return;
    seen.add(key);
    picked.push(row);
  };

  let i = 0;
  let j = 0;
  while (picked.length < max && (i < fromA.length || j < fromB.length)) {
    if (i < fromA.length) take(fromA[i++]);
    if (j < fromB.length) take(fromB[j++]);
  }

  for (const row of fromCategory) {
    if (picked.length >= max) break;
    take(row);
  }

  return picked;
}
