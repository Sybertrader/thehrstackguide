import type { CategoryHubFamily } from './comparison-routes';

export type ContrastLens =
  | 'pricing'
  | 'pipeline'
  | 'compliance'
  | 'reviews'
  | 'global-coverage'
  | 'implementation';

const LENS_LABEL: Record<ContrastLens, string> = {
  pricing: 'published pricing and contract terms',
  pipeline: 'hiring pipeline and interview workflow',
  compliance: 'owned-entity employment and IP assignment',
  reviews: 'review cycles and calibration',
  'global-coverage': 'country coverage and payout rails',
  implementation: 'implementation scope and onboarding',
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
  return ranked.filter((item) => item.trim()).slice(0, limit);
}

function lowerFirst(text: string): string {
  const trimmed = text.trim().replace(/\.$/, '');
  if (!trimmed) return '';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
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
  const feature = pickMatching(args.aFeatures, lens, 1)[0];
  const pro = pickMatching(args.aPros, lens, 1)[0];
  const con = pickMatching(args.aCons, lens, 1)[0];
  const focus = feature ? lowerFirst(feature) : '';

  const summary = focus
    ? `${args.aName} focuses on ${focus} rather than a broader ${args.bName} deployment when the buying test is ${lensLabel}.`
    : '';

  return {
    lens,
    lensLabel,
    summary,
    bullets: [feature, pro].filter((item): item is string => Boolean(item)).slice(0, 2),
    chooseIf: focus
      ? [`Choose ${args.aName} over ${args.bName} when you need ${focus} and ${lensLabel} decides the purchase.`]
      : [],
    skipIf: con
      ? [`Skip ${args.aName} on this ${args.aName} vs ${args.bName} shortlist when ${lowerFirst(con)}.`]
      : [],
  };
}

export interface VendorBContrast {
  lens: ContrastLens;
  lensLabel: string;
  summary: string;
  bullets: string[];
  chooseIf: string[];
  skipIf: string[];
}

export function contrastVendorB(args: {
  aName: string;
  bName: string;
  aId: string;
  bId: string;
  family: CategoryHubFamily | null;
  aPrice: string;
  bPrice: string;
  bFeatures: string[];
  bPros: string[];
  bCons: string[];
}): VendorBContrast {
  const lens = pickContrastLens(args.aId, args.family);
  const lensLabel = LENS_LABEL[lens];
  const feature = pickMatching(args.bFeatures, lens, 1)[0];
  const pro = pickMatching(args.bPros, lens, 1)[0];
  const con = pickMatching(args.bCons, lens, 1)[0];
  const focus = feature ? lowerFirst(feature) : '';

  const summary = focus
    ? `${args.bName} focuses on ${focus} rather than a broader ${args.aName} deployment when the buying test is ${lensLabel}.`
    : '';

  return {
    lens,
    lensLabel,
    summary,
    bullets: [feature, pro].filter((item): item is string => Boolean(item)).slice(0, 2),
    chooseIf: focus
      ? [`Choose ${args.bName} over ${args.aName} when you need ${focus} and ${lensLabel} decides the purchase.`]
      : [],
    skipIf: con
      ? [`Skip ${args.bName} on this ${args.aName} vs ${args.bName} shortlist when ${lowerFirst(con)}.`]
      : [],
  };
}
