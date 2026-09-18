import type { Comparison } from '../types/comparison';
import { comparisonHubSlug } from './comparison-routes';

export interface CategoryVendorOption {
  id: string;
  name: string;
}

export interface CategoryPairingCard {
  baseSlug: string;
  href: string;
  toolAId: string;
  toolBId: string;
  toolAName: string;
  toolBName: string;
}

export function masterHref(baseSlug: string): string {
  return `/${baseSlug}/`;
}

/** @deprecated Use masterHref. Kept so older call sites keep compiling. */
export function childHref(baseSlug: string, _personaSlug?: string): string {
  return masterHref(baseSlug);
}

export function buildCategoryBrowser(comparisons: Comparison[]): {
  vendors: CategoryVendorOption[];
  pairings: CategoryPairingCard[];
  canonicalByPair: Record<string, string>;
} {
  const pairingsByHub = new Map<string, CategoryPairingCard>();
  const vendorsById = new Map<string, string>();

  for (const row of comparisons) {
    const baseSlug = comparisonHubSlug(row.tool_a_id, row.tool_b_id);
    vendorsById.set(row.tool_a_id, row.tool_a_name);
    vendorsById.set(row.tool_b_id, row.tool_b_name);

    if (!pairingsByHub.has(baseSlug)) {
      pairingsByHub.set(baseSlug, {
        baseSlug,
        href: masterHref(baseSlug),
        toolAId: row.tool_a_id,
        toolBId: row.tool_b_id,
        toolAName: row.tool_a_name,
        toolBName: row.tool_b_name,
      });
    }
  }

  const pairings = [...pairingsByHub.values()].sort((left, right) => {
    const byA = left.toolAName.localeCompare(right.toolAName);
    return byA !== 0 ? byA : left.toolBName.localeCompare(right.toolBName);
  });

  const canonicalByPair: Record<string, string> = {};
  for (const pairing of pairings) {
    canonicalByPair[`${pairing.toolAId}|${pairing.toolBId}`] = pairing.href;
    canonicalByPair[`${pairing.toolBId}|${pairing.toolAId}`] = pairing.href;
  }

  const vendors = [...vendorsById.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return { vendors, pairings, canonicalByPair };
}
