import type { ToolProfile } from './tools';
import { publishedEorStatement } from '../data/vendors/eor-platform-rates';

export interface MatchupVerdict {
  pickA: string;
  pickB: string;
  tradeoff: string;
}

/**
 * What the vendor is for, and the extra scope a buyer takes on by choosing it.
 * Verdicts name both products so the same vendor line is not reused unchanged.
 */
const VENDOR_CASE: Record<string, { need: string; adds: string }> = {
  deel: {
    need: 'owned in-country entities so Deel is the legal employer',
    adds: 'a published EOR fee of $599 per employee per month and a $49 contractor fee, with employer taxes and FX still on top',
  },
  remote: {
    need: 'employment through companies Remote owns in each market, with no partner agency in the contract chain',
    adds: 'EOR at $699 per employee per month billed monthly, or $599 per employee per month on an annual commitment, plus contractors at $29',
  },
  'oyster-hr': {
    need: 'a mid-market employment console with a published EOR rate',
    adds: 'EOR listed at $699 per employee per month and contractors at $29 per month after a 30-day trial',
  },
  multiplier: {
    need: 'APAC and EMEA hiring at a published $400 per employee EOR rate',
    adds: 'a lower EOR list price than the $599-and-up global stickers, with employer taxes still extra',
  },
  'papaya-global': {
    need: 'one payroll report covering workers on your own entities and EOR seats',
    adds: 'EOR from $650 per employee per month and an enterprise implementation',
  },
  'remote-people': {
    need: 'a published EOR Flex rate of $199 per employee per month with contractor management at $29',
    adds: 'in-house recruitment on the same account, and a country-level check of which entities are owned',
  },
  rippling: {
    need: 'US HR, payroll, laptops, and app access on a single employee record',
    adds: 'a core platform at $8 per user per month, with payroll, devices, and global EOR quoted as separate modules',
  },
  gusto: {
    need: 'US W-2 payroll, tax filings, and benefits for a domestic roster',
    adds: 'Simple-plan pricing from $49 per month plus $6 per worker, and no Employer of Record product',
  },
  'payoneer-workforce-management': {
    need: 'batch contractor payouts into 190+ countries without a monthly seat fee',
    adds: 'a $0 platform fee, with cost on the payout corridor and FX rather than an employment contract',
  },
  ashby: {
    need: 'stage-to-offer conversion reporting inside the ATS, billed by company size',
    adds: 'Foundations from $400 per month with unlimited interviewer seats',
  },
  lever: {
    need: 'outbound sourcing and silver-medalist nurture on the same pipeline as inbound applications',
    adds: 'a custom annual contract rather than a public self-serve seat',
  },
  workable: {
    need: 'one-click posting to 200+ job boards on a published plan',
    adds: 'Standard from $299 per month for teams of 1 to 20 employees',
  },
  'breezy-hr': {
    need: 'a kanban hiring pipeline with built-in video screening',
    adds: 'a free Bootstrap tier and paid plans commonly from about $157 per month',
  },
  jazzhr: {
    need: 'unlimited interviewer seats and syndication to major job boards',
    adds: 'a published start near $75 per month',
  },
  recruitee: {
    need: 'EU data residency and a multi-language careers site',
    adds: 'a Launch tier from $199 per month with unlimited team members',
  },
  'bamboohr-ats': {
    need: 'hiring records that become BambooHR employee files',
    adds: 'a custom quote, and it only pays off if BambooHR is already the HRIS',
  },
  performyard: {
    need: 'lightweight, dedicated review cycles, 1:1s, and 360s',
    adds: 'review workflows at about $5 per user per month without an engagement or compensation suite',
  },
  lattice: {
    need: 'unified 1:1s, compensation management, and career tracks on the same record as the review',
    adds: 'performance from about $10 per user per month, with goals and engagement sold as add-on modules',
  },
  'culture-amp': {
    need: 'science-backed engagement surveys and external benchmarks, with performance sitting on that data',
    adds: 'a custom annual quote rather than a public per-seat price',
  },
};

function commercialTerms(
  id: string,
  name: string,
  profile: ToolProfile | null | undefined,
  csvPrice: string,
): string {
  const eor = publishedEorStatement(id);
  if (eor) return `${name} publishes ${eor}`;
  const entry = VENDOR_CASE[id];
  if (entry) return `${name} ${entry.adds}`;
  const sticker = profile?.starting_price || csvPrice;
  if (sticker && !/custom quote/i.test(sticker)) return `${name} lists a starting price of ${sticker}`;
  return `${name} does not publish a self-serve seat price`;
}

export function buildMatchupVerdict(args: {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  aCsvPrice: string;
  bCsvPrice: string;
  aProfile?: ToolProfile | null;
  bProfile?: ToolProfile | null;
  differingFeature?: string;
}): MatchupVerdict {
  const aCase = VENDOR_CASE[args.aId];
  const bCase = VENDOR_CASE[args.bId];

  const pickA = aCase
    ? `Choose ${args.aName} over ${args.bName} if you need ${aCase.need}, and you do not need what ${args.bName} adds: ${bCase?.adds ?? 'the other product scope on this shortlist'}.`
    : '';
  const pickB = bCase
    ? `Choose ${args.bName} over ${args.aName} if you need ${bCase.need}, and you do not need what ${args.aName} adds: ${aCase?.adds ?? 'the other product scope on this shortlist'}.`
    : '';

  let tradeoff = `Commercial terms for ${args.aName} vs ${args.bName}: ${commercialTerms(args.aId, args.aName, args.aProfile, args.aCsvPrice)}. ${commercialTerms(args.bId, args.bName, args.bProfile, args.bCsvPrice)}.`;
  if (args.differingFeature) {
    tradeoff += ` On the feature grid, the first split between these two products is ${args.differingFeature}.`;
  }

  return { pickA, pickB, tradeoff };
}
