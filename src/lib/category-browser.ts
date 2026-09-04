import type { Comparison } from '../types/comparison';
import { comparisonHubSlug, publicModifierSlug } from './comparison-routes';

/** Short pill labels. Keys are live URL modifiers, never CSV aliases. */
export const CATEGORY_PILL_LABELS: Record<string, string> = {
  startups: 'Startups',
  scaleups: 'Scaleups',
  agencies: 'Agencies',
  enterprise: 'Enterprise',
  'remote-teams': 'Remote Teams',
  'us-latam': 'US & LATAM',
  'web3-crypto': 'Web3 & Crypto',
  'people-ops': 'People Ops',
};

/** Sort order only. A pill is emitted only when the category has that child modifier. */
const PILL_ORDER = [
  'startups',
  'scaleups',
  'enterprise',
  'agencies',
  'people-ops',
  'remote-teams',
  'us-latam',
  'web3-crypto',
] as const;

export interface CategoryPersonaPill {
  slug: string;
  label: string;
}

export interface CategoryPairingCard {
  baseSlug: string;
  toolAId: string;
  toolBId: string;
  toolAName: string;
  toolBName: string;
  modifiers: string[];
}

export function childHref(baseSlug: string, personaSlug: string): string {
  return `/${baseSlug}-for-${personaSlug}/`;
}

function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildCategoryBrowser(comparisons: Comparison[]): {
  pills: CategoryPersonaPill[];
  pairings: CategoryPairingCard[];
} {
  const pairingsByHub = new Map<string, CategoryPairingCard>();
  const modifiers = new Set<string>();

  for (const row of comparisons) {
    const personaSlug = publicModifierSlug(row.niche_id);
    modifiers.add(personaSlug);

    const baseSlug = comparisonHubSlug(row.tool_a_id, row.tool_b_id);
    let pairing = pairingsByHub.get(baseSlug);
    if (!pairing) {
      pairing = {
        baseSlug,
        toolAId: row.tool_a_id,
        toolBId: row.tool_b_id,
        toolAName: row.tool_a_name,
        toolBName: row.tool_b_name,
        modifiers: [],
      };
      pairingsByHub.set(baseSlug, pairing);
    }
    if (!pairing.modifiers.includes(personaSlug)) {
      pairing.modifiers.push(personaSlug);
    }
  }

  const pills = [...modifiers]
    .sort((left, right) => {
      const leftRank = PILL_ORDER.indexOf(left as (typeof PILL_ORDER)[number]);
      const rightRank = PILL_ORDER.indexOf(right as (typeof PILL_ORDER)[number]);
      return (leftRank === -1 ? PILL_ORDER.length : leftRank) - (rightRank === -1 ? PILL_ORDER.length : rightRank);
    })
    .map((slug) => ({
      slug,
      label: CATEGORY_PILL_LABELS[slug] ?? titleCaseSlug(slug),
    }));

  return {
    pills,
    pairings: [...pairingsByHub.values()],
  };
}
