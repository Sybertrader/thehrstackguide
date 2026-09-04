import type { Comparison, FeatureSpec } from '../types/comparison';
import { atsPersonaByToolId } from '../data/personaData.ats';
import { performancePersonaByToolId } from '../data/personaData.pm';
import { globalPayrollPersonaByToolId } from '../data/personaData.payroll';

export interface ComparisonVariantLink {
  slug: string;
  nicheId: string;
  nicheName: string;
  href: string;
  titleSuffix: string;
}

export interface PersonaMatrixRow {
  id: string;
  label: string;
  a: FeatureSpec;
  b: FeatureSpec;
}

/** Display suffix after "for" in child titles, e.g. "US & LATAM Teams". */
export const MODIFIER_TITLE_SUFFIX: Record<string, string> = {
  'tech-startups': 'Tech Startups',
  startups: 'Startups',
  scaleups: 'Scaleups',
  agencies: 'Agencies',
  'us-latam': 'US & LATAM Teams',
  'web3-crypto': 'Web3 & Crypto Teams',
  enterprise: 'Enterprise Teams',
  'remote-teams': 'Remote-First Teams',
  'people-ops': 'People Ops Teams',
};

const NICHE_TO_PERSONA_KEY: Record<string, string> = {
  'tech-startups': 'startupFeatures',
  startups: 'startupFeatures',
  scaleups: 'scaleupFeatures',
  agencies: 'agencyFeatures',
  'us-latam': 'latamFeatures',
  'web3-crypto': 'web3Features',
  enterprise: 'enterpriseFeatures',
  'remote-teams': 'remoteFeatures',
  'people-ops': 'peopleOpsFeatures',
};

const PAYROLL_LABELS: Record<string, string> = {
  ownedLocalEntities: 'Owned local entities',
  eorCountryCoverage: 'EOR country coverage',
  contractorPayments: 'Contractor payments & 1099/W-8BEN',
  nativePayrollFilings: 'Native payroll filings',
  fxAndMultiCurrency: 'FX, multi-currency & USDC',
  statutoryBenefits: 'Statutory benefits & Works Council',
  ipAndWorkProductAssignment: 'IP & work product assignment',
  onboardingSla: 'Onboarding SLA',
};

const ATS_LABELS: Record<string, string> = {
  structuredScorecards: 'Structured scorecards',
  sourcingCrm: 'Sourcing CRM & client portals',
  interviewScheduling: 'Scheduling & async video',
  careerSiteAndJobBoards: 'Career site & job boards',
  complianceAndEeoc: 'EEO / OFCCP compliance',
  reportingAndAnalytics: 'Reporting & analytics',
  integrations: 'Checkr, SMS & integrations',
  seatOrUsagePricing: 'Seat / usage pricing',
};

const PM_LABELS: Record<string, string> = {
  okrsAndGoals: 'OKRs & goals',
  continuousFeedback: 'Continuous feedback',
  structuredReviews: 'Structured & billable reviews',
  calibration: 'Calibration',
  engagementSurveys: 'Engagement surveys & HRBP dashboards',
  compensation: 'Compensation',
  managerCadence: 'Manager cadence',
  ssoAndHrisIntegrations: 'SSO, Slack/Teams, GitHub/Jira',
};

const HUB_NICHE_PREFERENCE = ['scaleups', 'tech-startups', 'startups'] as const;

export function modifierTitleSuffix(nicheId: string, nicheName: string): string {
  return MODIFIER_TITLE_SUFFIX[nicheId] ?? nicheName;
}

export function personaKeyForNiche(nicheId: string): string | undefined {
  return NICHE_TO_PERSONA_KEY[nicheId];
}

export function pickHubComparison(rows: Comparison[]): Comparison {
  for (const nicheId of HUB_NICHE_PREFERENCE) {
    const hit = rows.find((row) => row.niche_id === nicheId);
    if (hit) return hit;
  }
  const first = rows[0];
  if (!first) throw new Error('Cannot build a comparison hub from an empty pairing group');
  return first;
}

export function variantsForPair(rows: Comparison[]): ComparisonVariantLink[] {
  return rows.map((row) => ({
    slug: row.slug,
    nicheId: row.niche_id,
    nicheName: row.niche_name,
    href: `/${row.slug}/`,
    titleSuffix: modifierTitleSuffix(row.niche_id, row.niche_name),
  }));
}

function packAndLabels(toolAId: string, toolBId: string): {
  packA: Record<string, Record<string, FeatureSpec>>;
  packB: Record<string, Record<string, FeatureSpec>>;
  labels: Record<string, string>;
} | null {
  const payrollA = globalPayrollPersonaByToolId[toolAId];
  const payrollB = globalPayrollPersonaByToolId[toolBId];
  if (payrollA && payrollB) {
    return {
      packA: payrollA as unknown as Record<string, Record<string, FeatureSpec>>,
      packB: payrollB as unknown as Record<string, Record<string, FeatureSpec>>,
      labels: PAYROLL_LABELS,
    };
  }

  const atsA = atsPersonaByToolId[toolAId];
  const atsB = atsPersonaByToolId[toolBId];
  if (atsA && atsB) {
    return {
      packA: atsA as unknown as Record<string, Record<string, FeatureSpec>>,
      packB: atsB as unknown as Record<string, Record<string, FeatureSpec>>,
      labels: ATS_LABELS,
    };
  }

  const pmA = performancePersonaByToolId[toolAId];
  const pmB = performancePersonaByToolId[toolBId];
  if (pmA && pmB) {
    return {
      packA: pmA as unknown as Record<string, Record<string, FeatureSpec>>,
      packB: pmB as unknown as Record<string, Record<string, FeatureSpec>>,
      labels: PM_LABELS,
    };
  }

  return null;
}

export function personaRowsForComparison(comparison: Comparison): PersonaMatrixRow[] {
  const personaKey = personaKeyForNiche(comparison.niche_id);
  if (!personaKey) return [];

  const resolved = packAndLabels(comparison.tool_a_id, comparison.tool_b_id);
  if (!resolved) return [];

  const featuresA = resolved.packA[personaKey];
  const featuresB = resolved.packB[personaKey];
  if (!featuresA || !featuresB) return [];

  return Object.keys(featuresA).flatMap((id) => {
    const a = featuresA[id];
    const b = featuresB[id];
    if (!a || !b) return [];
    return [{ id, label: resolved.labels[id] ?? id, a, b }];
  });
}

function clipSpec(spec: string, maxWords = 24): string {
  const trimmed = spec.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) {
    return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  }
  return `${words.slice(0, maxWords).join(' ').replace(/[.,;:]+$/, '')}.`;
}

const WORKFLOW_BY_NICHE: Record<string, string> = {
  'tech-startups':
    'The buying workflow is speed first: stand up payroll or hiring without a specialist admin, then revisit entity ownership, compliance reporting, and seat math once headcount clears the first twenty people.',
  startups:
    'The buying workflow is speed first: stand up the process without a specialist admin, then revisit compliance reporting and seat math once hiring volume or review cycles actually exist.',
  scaleups:
    'The buying workflow is operating-system replacement: consolidate multi-country or multi-team processes onto one vendor, then instrument reporting so People and Finance are not reconciling spreadsheets at month end.',
  agencies:
    'The buying workflow is client-facing throughput: batch contractor or candidate movement across accounts, keep submissions or payouts auditable, and avoid tools that assume a single in-house headcount plan.',
  'us-latam':
    'The buying workflow is country-by-country employment: lock the Brazil/Mexico vehicle (owned entity versus partner), accrue 13th-month and social charges into the offer, then run onboarding only after FX and IP assignment are in the contract.',
  'web3-crypto':
    'The buying workflow is treasury plus employment: confirm whether USDC or crypto payouts are native, model fiat FX on the rest of the bench, and keep token compensation off the payroll rail unless the vendor actually supports it.',
  enterprise:
    'The buying workflow is procurement: SAML 2.0 SSO, audit-ready EEO or works-council evidence, and compensation or structured-hiring calibration that survives legal review—not a self-serve SMB checkout.',
  'remote-teams':
    'The buying workflow is async-first: multi-time-zone scheduling or Slack/Teams check-ins have to work without hallway context, and the vendor must not assume one office language or one calendar.',
  'people-ops':
    'The buying workflow is the HRBP console: engagement science, talent calibration, and people analytics have to land in one place so business partners are not exporting CSV into a second dashboard.',
};

function fitSentence(comparison: Comparison, modifierLabel: string): string {
  const winnerName =
    comparison.winner_id === comparison.tool_a_id
      ? comparison.tool_a_name
      : comparison.winner_id === comparison.tool_b_id
        ? comparison.tool_b_name
        : comparison.winner_id;
  const reason = comparison.winner_reason.replace(/\s+/g, ' ').trim();
  const ended = reason.endsWith('.') ? reason : `${reason}.`;
  return `${winnerName} is the recommended lean for ${modifierLabel}. ${ended}`;
}

/**
 * 150–200 word persona evaluation unique to this pairing and modifier.
 * Specs are clipped so long technical notes cannot blow the cap.
 */
export function buildPersonaEvaluation(comparison: Comparison, rows: PersonaMatrixRow[]): string {
  const modifierLabel = modifierTitleSuffix(comparison.niche_id, comparison.niche_name);
  const a = comparison.tool_a_name;
  const b = comparison.tool_b_name;
  const highlight = rows.slice(0, 4);
  const specBlock = highlight
    .map((row) => {
      const aSpec = clipSpec(row.a.spec, 20);
      const bSpec = clipSpec(row.b.spec, 20);
      return `On ${row.label.toLowerCase()}, ${a} ${row.a.supported ? 'covers the need' : 'falls short'}: ${aSpec} ${b} ${row.b.supported ? 'covers it' : 'does not'}: ${bSpec}`;
    })
    .join(' ');

  const workflow = WORKFLOW_BY_NICHE[comparison.niche_id] ?? WORKFLOW_BY_NICHE.scaleups;
  const closing = `Treat the persona matrix on this page as the source of record for ${modifierLabel}, not the generic ${a} vs ${b} hub. Confirm current country lists, add-on SKUs, and SSO packaging on a live demo before you sign.`;

  let text = `${a} versus ${b} for ${modifierLabel} is a workflow decision, not a brand-preference exercise. ${fitSentence(comparison, modifierLabel)} ${specBlock} ${workflow} ${closing}`;
  text = text.replace(/\s{2,}/g, ' ').trim();

  let words = text.split(/\s+/);
  if (words.length < 150) {
    text = `${text} If both vendors appear close on the scorecard, prefer the one whose entity, compliance, or integration flags are native rather than partner-routed, because that is what fails first in this buyer’s operating model.`;
    words = text.split(/\s+/);
  }
  if (words.length > 200) {
    text = `${words.slice(0, 200).join(' ').replace(/[.,;:]+$/, '')}.`;
  }
  return text;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildPersonaFaqItems(
  comparison: Comparison,
  rows: PersonaMatrixRow[],
  modifierLabel: string,
  pricingAnswer: string
): FaqItem[] {
  const a = comparison.tool_a_name;
  const b = comparison.tool_b_name;
  const winnerName =
    comparison.winner_id === comparison.tool_a_id
      ? a
      : comparison.winner_id === comparison.tool_b_id
        ? b
        : comparison.winner_id;
  const top = rows[0];
  const capabilityQ = top
    ? `How do ${a} and ${b} differ on ${top.label.toLowerCase()} for ${modifierLabel}?`
    : `Which capabilities should ${modifierLabel} compare first in ${a} vs ${b}?`;
  const capabilityA = top
    ? `${a}: ${top.a.spec} ${b}: ${top.b.spec}`
    : `${a} and ${b} should be scored against the persona matrix on this page rather than a generic feature list.`;

  return [
    {
      question: `Is ${a} or ${b} better for ${modifierLabel}?`,
      answer: `${winnerName} is the recommended lean for ${modifierLabel}. ${comparison.winner_reason}`.replace(/\s{2,}/g, ' '),
    },
    {
      question: capabilityQ,
      answer: capabilityA,
    },
    {
      question: `What should ${modifierLabel} verify before choosing ${a} or ${b}?`,
      answer: `Verify the persona flags on this page—especially compliance, payout or integration coverage, and seat pricing—against your actual countries, hiring volume, or review cadence. ${pricingAnswer}`,
    },
  ];
}
