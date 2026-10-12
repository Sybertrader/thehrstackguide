import type { CategoryHubFamily } from './comparison-routes';

export type ContrastLens =
  | 'pricing'
  | 'pipeline'
  | 'compliance'
  | 'reviews'
  | 'global-coverage'
  | 'implementation';

const LENS_LABEL: Record<ContrastLens, string> = {
  pricing: 'pricing tiers and seat math',
  pipeline: 'ATS pipeline depth',
  compliance: 'owned-entity compliance and IP',
  reviews: 'review cycles and calibration',
  'global-coverage': 'country coverage and payout rails',
  implementation: 'implementation speed and onboarding',
};

const LENS_KEYWORDS: Record<ContrastLens, string[]> = {
  pricing: ['price', 'seat', 'fee', 'plan', 'trial', 'cost', 'module', 'fx'],
  pipeline: ['pipeline', 'scorecard', 'sourcing', 'interview', 'crm', 'scheduling', 'hiring'],
  compliance: ['entity', 'ip', 'gdpr', 'eor', 'statutory', 'misclassif', 'owned'],
  reviews: ['review', 'okr', 'calibrat', 'engagement', '1:1', 'performance', 'survey'],
  'global-coverage': ['country', 'global', 'fx', 'currency', 'local', 'payout'],
  implementation: ['onboard', 'implement', 'sla', 'support', 'setup', 'time'],
};

export function pickContrastLens(vendorBId: string, family: CategoryHubFamily | null): ContrastLens {
  const id = vendorBId.toLowerCase();
  if (family === 'ats') {
    if (['ashby', 'lever', 'greenhouse'].includes(id)) return 'pipeline';
    if (['workable', 'breezy-hr', 'jazzhr', 'recruitee', 'bamboohr'].includes(id)) return 'pricing';
    return 'pipeline';
  }
  if (family === 'pm') return 'reviews';
  if (['remote', 'oyster-hr'].includes(id)) return 'compliance';
  if (['gusto', 'payoneer-workforce-management', 'rippling'].includes(id)) return 'pricing';
  if (['multiplier', 'papaya-global', 'remote-people'].includes(id)) return 'global-coverage';
  return 'implementation';
}

function pickMatching(items: string[], lens: ContrastLens, limit: number): string[] {
  const keys = LENS_KEYWORDS[lens];
  const ranked = [...items].sort((a, b) => {
    const sa = keys.some((k) => a.toLowerCase().includes(k)) ? 0 : 1;
    const sb = keys.some((k) => b.toLowerCase().includes(k)) ? 0 : 1;
    return sa - sb;
  });
  return ranked.slice(0, limit);
}

export interface VendorAContrast {
  lens: ContrastLens;
  lensLabel: string;
  summary: string;
  bullets: string[];
  chooseIf: string[];
  skipIf: string[];
}

export function contrastVendorA(args: {
  aName: string;
  bName: string;
  aId: string;
  bId: string;
  family: CategoryHubFamily | null;
  aPrice: string;
  bPrice: string;
  aFeatures: string[];
  aPros: string[];
  aCons: string[];
}): VendorAContrast {
  const lens = pickContrastLens(args.bId, args.family);
  const lensLabel = LENS_LABEL[lens];
  const bullets = pickMatching(args.aFeatures, lens, 2);
  const pro = pickMatching(args.aPros, lens, 1)[0];
  const con = pickMatching(args.aCons, lens, 1)[0];

  const summary = `Against ${args.bName} on ${lensLabel}, ${args.aName} is not restated as a standalone brochure. This ${args.aName} vs ${args.bName} card only keeps the ${lens} contrast: ${args.aName} at ${args.aPrice || 'quoted'} versus ${args.bName} at ${args.bPrice || 'quoted'}.`;

  return {
    lens,
    lensLabel,
    summary,
    bullets,
    chooseIf: [
      `Choose ${args.aName} over ${args.bName} when ${lensLabel} is the buying test and ${args.aPrice || 'the quoted seat'} still clears finance.${pro ? ` ${args.aName} edge: ${pro}` : ''}`,
    ],
    skipIf: [
      `Skip ${args.aName} in this ${args.aName} vs ${args.bName} matchup when ${args.bName} already wins ${lensLabel}.${con ? ` Watch: ${con}` : ''}`,
    ],
  };
}
