import type { CategoryHubFamily } from './comparison-routes';
import { selectLayoutVariant } from '../utils/layoutHasher';

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

const B_SUMMARY_FRAMES: Array<
  (a: string, b: string, lensLabel: string, item: string, aPrice: string, bPrice: string) => string
> = [
  (a, b, lensLabel, item, aPrice, bPrice) =>
    `${b} is not reprinted as a catalog here. Against ${a} the ${lensLabel} foil is "${item}" (${bPrice} vs ${a}'s ${aPrice}).`,
  (a, b, lensLabel, item, aPrice, bPrice) =>
    `Treat ${b} as ${a}'s ${lensLabel} counterweight, not a stock ${b} blast. Kept line: "${item}". Sticker ${bPrice} beside ${a} at ${aPrice}.`,
  (a, b, lensLabel, item, aPrice, bPrice) =>
    `This ${a} vs ${b} card keeps one ${b} proof on ${lensLabel}: "${item}". ${a} stays at ${aPrice}; ${b} stays at ${bPrice}.`,
  (a, b, lensLabel, item, aPrice, bPrice) =>
    `${b} overview for ${a} buyers only: ${lensLabel} via "${item}". Ignore generic ${b} pages. Math is ${aPrice} against ${bPrice}.`,
  (a, b, lensLabel, item, aPrice, bPrice) =>
    `Spare ${b} copy. The ${a} matchup tests ${lensLabel} with "${item}" (${bPrice}), not a duplicated ${b} feature dump beside ${aPrice}.`,
  (a, b, lensLabel, item, aPrice, bPrice) =>
    `${a} sets the ${lensLabel} exam; ${b} answers with "${item}" at ${bPrice} while ${a} quotes ${aPrice}. No recycled ${b} dossier.`,
];

export interface VendorBContrast {
  lens: ContrastLens;
  lensLabel: string;
  variant: number;
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
  slug: string;
  family: CategoryHubFamily | null;
  aPrice: string;
  bPrice: string;
  bFeatures: string[];
  bPros: string[];
  bCons: string[];
}): VendorBContrast {
  const lens = pickContrastLens(args.aId, args.family);
  const lensLabel = LENS_LABEL[lens];
  const variant = selectLayoutVariant(args.slug, B_SUMMARY_FRAMES.length);
  const ranked = pickMatching(args.bFeatures, lens, Math.max(args.bFeatures.length, 1));
  const pickedFeature = ranked.length ? ranked[variant % ranked.length] : '';
  const rankedPros = pickMatching(args.bPros, lens, Math.max(args.bPros.length, 1));
  const pickedPro = rankedPros.length ? rankedPros[(variant + 1) % rankedPros.length] : '';
  const rankedCons = pickMatching(args.bCons, lens, Math.max(args.bCons.length, 1));
  const pickedCon = rankedCons.length ? rankedCons[(variant + 2) % rankedCons.length] : '';
  const frame = B_SUMMARY_FRAMES[variant];
  const item = pickedFeature || pickedPro || lensLabel;
  const bullets = [pickedFeature, pickedPro].filter(Boolean).slice(0, 2);

  return {
    lens,
    lensLabel,
    variant,
    summary: frame(
      args.aName,
      args.bName,
      lensLabel,
      item,
      args.aPrice || 'quoted',
      args.bPrice || 'quoted',
    ),
    bullets,
    chooseIf: [
      `Choose ${args.bName} over ${args.aName} on this hub when ${lensLabel} favors "${item}".${pickedPro ? ` ${args.bName} note vs ${args.aName}: ${pickedPro}` : ''}`,
    ],
    skipIf: [
      `Skip ${args.bName} versus ${args.aName} when ${args.aName} already wins ${lensLabel}.${pickedCon ? ` ${args.bName} watch-out in this pairing: ${pickedCon}` : ''}`,
    ],
  };
}
