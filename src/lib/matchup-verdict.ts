import type { ToolProfile } from './tools';

export interface MatchupVerdict {
  pickA: string;
  pickB: string;
  tradeoff: string;
}

/**
 * Pair-only buying tests. Each line is the operational reason to pick that
 * vendor, not a recycled category brochure.
 */
const PICK_IF: Record<string, string> = {
  deel: 'owned in-country entities so Deel is the local legal employer, with a published $599 per employee EOR fee and $49 contractor fee',
  remote: 'employment through companies Remote owns in each market, so a partner agency is not sitting in the contract chain, at $599 EOR and $29 contractor',
  'oyster-hr': 'a mid-market employment console with a 30-day contractor trial at $29 per month and EOR listed at $699 per employee',
  multiplier: 'APAC and EMEA hiring at a $400 per employee EOR list price rather than a global sticker above $599',
  'papaya-global': 'one payroll report that covers workers on your own entities and EOR seats side by side, with EOR from $650 per employee',
  'remote-people': 'a published EOR Flex rate of $199 per employee per month, contractor management at $29, and in-house recruitment on the same account',
  rippling: 'US HR, payroll, laptops, and app access on a single employee record, with global EOR sold as a module rather than the core product',
  gusto: 'US W-2 payroll, tax filings, and benefits for a domestic roster (Gusto can pay overseas contractors, it cannot employ them)',
  'payoneer-workforce-management': 'batch contractor payouts into 190+ countries from multi-currency wallets at $0 monthly seat, with W-8BEN and W-9 collection in the same flow',
  ashby: 'stage-to-offer conversion reporting inside the ATS, billed by company size (Foundations from $400 per month) rather than per interviewer seat',
  lever: 'outbound sourcing and silver-medalist nurture (LeverTRM) on the same pipeline as inbound applications, sold on a custom annual contract',
  workable: 'one-click posting to 200+ job boards with a published Standard plan from $299 per month for teams of 1 to 20 employees',
  'breezy-hr': 'a kanban hiring pipeline with built-in video screening, including a free Bootstrap tier and paid plans commonly from about $157 per month',
  jazzhr: 'unlimited interviewer seats from about $75 per month, with syndication to Indeed, ZipRecruiter, and Google for Jobs',
  recruitee: 'EU data residency and a multi-language careers site, with GDPR as the default rather than an add-on, from $199 per month',
  'bamboohr-ats': 'hiring records that become BambooHR employee files, which only makes sense if BambooHR is already the HRIS',
  performyard: 'configurable review cycles, 1:1s, and 360s at about $5 per user per month without a long implementation project',
  lattice: 'compensation calibration on the same table as performance ratings, with modules commonly from about $10 per user per month',
  'culture-amp': 'science-backed engagement surveys and external benchmarks first, with performance sitting on that survey data under a custom quote',
};

function priceMechanism(
  id: string,
  name: string,
  profile: ToolProfile | null | undefined,
  csvPrice: string,
): string {
  if (id === 'payoneer-workforce-management') {
    return `${name} charges $0 monthly platform fee and takes a cut of each contractor payout (often 0% to 1% plus FX on the corridor)`;
  }
  if (id === 'gusto') {
    return `${name} bills US payroll from $49 per month plus $6 per worker, with no EOR vehicle`;
  }
  if (id === 'rippling') {
    return `${name} lists the core workforce graph at $8 per user per month, then quotes payroll, devices, and EOR as separate modules`;
  }
  if (id === 'ashby') {
    return `${name} bills a flat company-size tier from $400 per month with unlimited interviewer seats`;
  }
  if (id === 'lever' || id === 'bamboohr-ats' || id === 'culture-amp') {
    return `${name} sells on a custom annual quote rather than a public self-serve seat`;
  }
  if (id === 'workable') {
    return `${name} publishes Standard at $299 per month for 1 to 20 employees, with Premier and Enterprise raising the bill`;
  }
  if (id === 'breezy-hr') {
    return `${name} offers a free Bootstrap tier and paid plans commonly from about $157 per month by active jobs`;
  }
  if (id === 'jazzhr') {
    return `${name} starts near $75 per month with unlimited interviewer seats`;
  }
  if (id === 'recruitee') {
    return `${name} starts at $199 per month on a job-slot Launch tier with unlimited team members`;
  }
  if (id === 'performyard') {
    return `${name} is typically about $5 per user per month for review cycles`;
  }
  if (id === 'lattice') {
    return `${name} stacks performance from about $10 per user per month, with goals and engagement sold as add-on modules`;
  }
  const eor = profile?.eor_price;
  const contractor = profile?.contractor_price;
  if (typeof eor === 'number' && typeof contractor === 'number') {
    return `${name} publishes EOR at $${eor} per employee per month and contractors at $${contractor} per month`;
  }
  if (typeof eor === 'number') {
    return `${name} publishes EOR at $${eor} per employee per month`;
  }
  const sticker = profile?.starting_price || csvPrice || 'a custom quote';
  return `${name} starts at ${sticker}`;
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
  const pickANeed = PICK_IF[args.aId] ?? args.aProfile?.choose_if?.[0] ?? args.aProfile?.positioning ?? 'the capability documented on this pair';
  const pickBNeed = PICK_IF[args.bId] ?? args.bProfile?.choose_if?.[0] ?? args.bProfile?.positioning ?? 'the capability documented on this pair';

  const pickA = `Pick ${args.aName} if your team needs ${pickANeed}.`;
  const pickB = `Pick ${args.bName} if your priority is ${pickBNeed}.`;

  let tradeoff = `Commercial trade-off on ${args.aName} vs ${args.bName}: ${priceMechanism(args.aId, args.aName, args.aProfile, args.aCsvPrice)}, whereas ${priceMechanism(args.bId, args.bName, args.bProfile, args.bCsvPrice)}.`;
  if (args.differingFeature) {
    tradeoff += ` The first grid split unique to this ${args.aName} vs ${args.bName} shortlist is ${args.differingFeature}.`;
  }

  return { pickA, pickB, tradeoff };
}
