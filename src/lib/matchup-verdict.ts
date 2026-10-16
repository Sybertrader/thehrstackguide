import type { ToolProfile } from './tools';
import { publishedEorStatement } from '../data/vendors/eor-platform-rates';

export interface MatchupVerdict {
  pickA: string;
  pickB: string;
  tradeoff: string;
}

/**
 * Operational reason to choose the vendor. Prices live only in `commercial`,
 * and only for vendors that do not have a published EOR sticker.
 */
const VENDOR_CASE: Record<string, { fit: string; commercial?: string }> = {
  deel: {
    fit: 'require owned in-country entities so Deel is the legal employer, with contractor management on the same worker file',
  },
  remote: {
    fit: 'want the employment contract issued by companies Remote owns in each market, with no partner agency in the chain',
  },
  'oyster-hr': {
    fit: 'want a mid-market console for employing staff through Oyster\'s local entities',
  },
  multiplier: {
    fit: 'are hiring across APAC and EMEA and want those countries on one employment platform',
  },
  'papaya-global': {
    fit: 'need one payroll report covering workers on your own entities and workers on EOR seats',
  },
  'remote-people': {
    fit: 'want EOR and contractor management on one account, and will confirm which local entities are owned before you sign',
  },
  rippling: {
    fit: 'want US HR, payroll, laptops, and app access on a single employee record',
    commercial: 'lists a core platform at $8 per user per month, with payroll, devices, and global EOR quoted as separate modules',
  },
  gusto: {
    fit: 'run US W-2 payroll, tax filings, and benefits for a domestic roster and do not need an Employer of Record',
    commercial: 'lists Simple-plan pricing from $49 per month plus $6 per worker, and does not sell an Employer of Record product',
  },
  'payoneer-workforce-management': {
    fit: 'need batch contractor payouts into 190+ countries and are not buying an employment contract',
    commercial: 'lists a $0 platform fee, with the cost on the payout corridor and FX rather than a monthly seat',
  },
  ashby: {
    fit: 'want stage-to-offer conversion reporting inside the ATS, without metering interviewer seats',
    commercial: 'lists Foundations from $400 per month with unlimited interviewer seats',
  },
  lever: {
    fit: 'want outbound sourcing and silver-medalist nurture on the same pipeline as inbound applications',
    commercial: 'sells on a custom annual contract rather than a public self-serve seat',
  },
  workable: {
    fit: 'want one-click posting to 200+ job boards from a single hiring plan',
    commercial: 'lists Standard from $299 per month for teams of 1 to 20 employees',
  },
  'breezy-hr': {
    fit: 'want a kanban hiring pipeline with built-in video screening',
    commercial: 'lists a free Bootstrap tier and paid plans commonly from about $157 per month',
  },
  jazzhr: {
    fit: 'want unlimited interviewer seats and syndication to major job boards',
    commercial: 'lists a published start near $75 per month',
  },
  recruitee: {
    fit: 'need EU data residency and a multi-language careers site',
    commercial: 'lists a Launch tier from $199 per month with unlimited team members',
  },
  'bamboohr-ats': {
    fit: 'want hiring records that become BambooHR employee files, and BambooHR is already the HRIS',
    commercial: 'prices applicant tracking on a custom quote',
  },
  performyard: {
    fit: 'want dedicated review cycles, 1:1s, and 360s without an engagement or compensation suite',
    commercial: 'lists review workflows at about $5 per user per month',
  },
  lattice: {
    fit: 'want 1:1s, compensation management, and career tracks on the same record as the review',
    commercial: 'lists performance from about $10 per user per month, with goals and engagement sold as add-on modules',
  },
  'culture-amp': {
    fit: 'want science-backed engagement surveys and external benchmarks, with performance reviews sitting on that data',
    commercial: 'prices engagement and performance on a custom annual quote rather than a public per-seat price',
  },
};

function commercialClause(
  id: string,
  name: string,
  profile: ToolProfile | null | undefined,
  csvPrice: string,
): string {
  const eor = publishedEorStatement(id);
  if (eor) return `${name} lists ${eor}`;
  const entry = VENDOR_CASE[id];
  if (entry?.commercial) return `${name} ${entry.commercial}`;
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

  const pickA = aCase ? `Choose ${args.aName} if you ${aCase.fit}.` : '';
  const pickB = bCase ? `Choose ${args.bName} if you ${bCase.fit}.` : '';
  const tradeoff = `Commercial Overview: ${commercialClause(args.aId, args.aName, args.aProfile, args.aCsvPrice)}. ${commercialClause(args.bId, args.bName, args.bProfile, args.bCsvPrice)}.`;

  return { pickA, pickB, tradeoff };
}
