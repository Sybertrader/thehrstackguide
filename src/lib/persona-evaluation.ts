import type { Comparison, FeatureSpec } from '../types/comparison';
import { atsPersonaByToolId } from '../data/personaData.ats';
import { performancePersonaByToolId } from '../data/personaData.pm';
import { globalPayrollPersonaByToolId } from '../data/personaData.payroll';
import { comparisonHubSlug } from './comparison-routes';

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
  'tech-startups': 'Startups',
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
  const hasStartupsNiche = rows.some((row) => row.niche_id === 'startups');
  const techStartups = rows.find((row) => row.niche_id === 'tech-startups');
  const links: ComparisonVariantLink[] = [];

  for (const row of rows) {
    if (row.niche_id === 'tech-startups' || row.slug.endsWith('-for-tech-startups')) continue;
    const titleSuffix = row.niche_id === 'startups' ? 'Startups' : modifierTitleSuffix(row.niche_id, row.niche_name);
    links.push({
      slug: row.slug,
      nicheId: row.niche_id,
      nicheName: row.niche_name === 'Tech Startups' ? 'Startups' : row.niche_name,
      href: `/${row.slug}/`,
      titleSuffix,
    });
  }

  if (techStartups && !hasStartupsNiche) {
    const slug = `${comparisonHubSlug(techStartups.tool_a_id, techStartups.tool_b_id)}-for-startups`;
    links.unshift({
      slug,
      nicheId: 'startups',
      nicheName: 'Startups',
      href: `/${slug}/`,
      titleSuffix: 'Startups',
    });
  }

  return links;
}

/** Payroll CSV still uses `tech-startups`; expose a `for-startups` alias for hub cards. */
export function startupAliasForPair(rows: Comparison[]): Comparison | null {
  const techStartups = rows.find((row) => row.niche_id === 'tech-startups');
  if (!techStartups) return null;
  if (rows.some((row) => row.niche_id === 'startups')) return null;
  const hubSlug = comparisonHubSlug(techStartups.tool_a_id, techStartups.tool_b_id);
  return {
    ...techStartups,
    slug: `${hubSlug}-for-startups`,
    niche_id: 'startups',
    niche_name: 'Startups',
  };
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

const BUYER_WORKFLOW_ITEMS: Record<string, string[]> = {
  'tech-startups': [
    'Prioritize speed: stand up payroll or hiring without a specialist admin.',
    'Revisit entity ownership, compliance reporting, and seat math once headcount clears the first twenty people.',
  ],
  startups: [
    'Prioritize speed: stand up the process without a specialist admin.',
    'Revisit compliance reporting and seat math once hiring volume or review cycles actually exist.',
  ],
  scaleups: [
    'Treat this as an operating-system replacement: consolidate multi-country or multi-team processes onto one vendor.',
    'Instrument reporting so People and Finance are not reconciling spreadsheets at month end.',
  ],
  agencies: [
    'Optimize for client-facing throughput: batch contractor or candidate movement across accounts.',
    'Keep submissions or payouts auditable, and avoid tools that assume a single in-house headcount plan.',
  ],
  'us-latam': [
    'Lock the Brazil/Mexico employment vehicle (owned entity versus partner) before you run offers.',
    'Accrue 13th-month and social charges into the offer, then onboard only after FX and IP assignment are in the contract.',
  ],
  'web3-crypto': [
    'Confirm whether USDC or crypto payouts are native before you model treasury plus employment.',
    'Keep token compensation off the payroll rail unless the vendor actually supports it, and model fiat FX on the rest of the bench.',
  ],
  enterprise: [
    'Run this as procurement: require SAML 2.0 SSO and audit-ready EEO or works-council evidence.',
    'Demand compensation or structured-hiring calibration that survives legal review—not a self-serve SMB checkout.',
  ],
  'remote-teams': [
    'Require async-first workflows: multi-time-zone scheduling or Slack/Teams check-ins must work without hallway context.',
    'Reject vendors that assume one office language or one shared calendar.',
  ],
  'people-ops': [
    'Score the HRBP console: engagement science, talent calibration, and people analytics should land in one place.',
    'Avoid a stack that forces business partners to export CSV into a second dashboard.',
  ],
};

export interface PersonaWinPoint {
  label: string;
  spec: string;
}

export interface PersonaEvaluationContent {
  modifierLabel: string;
  toolAName: string;
  toolBName: string;
  bottomLine: string;
  whereAWins: PersonaWinPoint[];
  whereBWins: PersonaWinPoint[];
  buyerConsiderations: string[];
}

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

function winPoint(row: PersonaMatrixRow, side: 'a' | 'b'): PersonaWinPoint {
  return { label: row.label, spec: clipSpec(row[side].spec, 22) };
}

function fillWinColumn(
  exclusive: PersonaWinPoint[],
  fallbackRows: PersonaMatrixRow[],
  side: 'a' | 'b',
  max = 5
): PersonaWinPoint[] {
  const points = exclusive.slice(0, max);
  if (points.length >= 3) return points;

  for (const row of fallbackRows) {
    if (points.length >= max) break;
    if (!row[side].supported) continue;
    if (points.some((point) => point.label === row.label)) continue;
    points.push(winPoint(row, side));
  }

  return points;
}

function whereTheyWin(rows: PersonaMatrixRow[]): {
  a: PersonaWinPoint[];
  b: PersonaWinPoint[];
} {
  const exclusiveA: PersonaWinPoint[] = [];
  const exclusiveB: PersonaWinPoint[] = [];

  for (const row of rows) {
    if (row.a.supported && !row.b.supported) exclusiveA.push(winPoint(row, 'a'));
    else if (row.b.supported && !row.a.supported) exclusiveB.push(winPoint(row, 'b'));
  }

  return {
    a: fillWinColumn(exclusiveA, rows, 'a'),
    b: fillWinColumn(exclusiveB, rows, 'b'),
  };
}

/**
 * Structured persona evaluation for the child-page verdict UI.
 * Copy stays in real headings, paragraphs, and lists for crawler indexability.
 */
export function buildPersonaEvaluation(
  comparison: Comparison,
  rows: PersonaMatrixRow[]
): PersonaEvaluationContent | null {
  if (rows.length === 0) return null;

  const modifierLabel = modifierTitleSuffix(comparison.niche_id, comparison.niche_name);
  const a = comparison.tool_a_name;
  const b = comparison.tool_b_name;
  const wins = whereTheyWin(rows);
  const workflowItems = BUYER_WORKFLOW_ITEMS[comparison.niche_id] ?? BUYER_WORKFLOW_ITEMS.scaleups;

  return {
    modifierLabel,
    toolAName: a,
    toolBName: b,
    bottomLine: `${a} versus ${b} for ${modifierLabel} is a workflow decision, not a brand-preference exercise. ${fitSentence(comparison, modifierLabel)}`.replace(
      /\s{2,}/g,
      ' '
    ),
    whereAWins: wins.a,
    whereBWins: wins.b,
    buyerConsiderations: [
      ...workflowItems,
      `Treat the persona matrix on this page as the source of record for ${modifierLabel}, not the generic ${a} vs ${b} hub.`,
      'Confirm current country lists, add-on SKUs, and SSO packaging on a live demo before you sign.',
    ],
  };
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
