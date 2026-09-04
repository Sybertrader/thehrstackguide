import type { Comparison, FeatureSpec } from '../types/comparison';
import { atsPersonaByToolId } from '../data/personaData.ats';
import { performancePersonaByToolId } from '../data/personaData.pm';
import { globalPayrollPersonaByToolId } from '../data/personaData.payroll';
import { comparisonHubSlug } from './comparison-routes';
import { ATS_BOTTLENECKS, ATS_FAQS, PM_BOTTLENECKS, PM_FAQS } from './persona-vertical-copy';

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

const ATS_BUYER_ITEMS: Record<string, string[]> = {
  startups: [
    'Confirm structured scorecards can run without a dedicated recruiting-ops hire.',
    'Price year-one cost at hiring volume—seats versus a flat fee—including job-board and background-check add-ons.',
    'Test self-scheduling across the time zones you actually interview in.',
    'Skip enterprise EEO/OFCCP packaging unless you will become a federal contractor this year.',
  ],
  scaleups: [
    'Require interview kits that stay auditable as the hiring team grows past a handful of recruiters.',
    'Confirm CRM or silver-medalist nurture so you are not re-sourcing the same closed roles.',
    'Quote HRIS, background-check, and assessment integrations in the contract, not as a later marketplace surprise.',
    'Model recruiter-seat math at twice current hiring volume before you sign an annual term.',
  ],
  agencies: [
    'Confirm client portals and multi-account pipelines, not a single in-house requisition list.',
    'Keep submissions auditable per client for retainer and placement reporting.',
    'Check whether the sourcing CRM can run outbound without buying a second tool.',
    'Model cost at peak req load (surge hiring), not last month’s average openings.',
  ],
  enterprise: [
    'Require OFCCP/EEO reporting and structured-hiring methodology in the RFP, not a slide-deck promise.',
    'Ask for SSO/SCIM and a named implementation owner before procurement signs.',
    'Audit the integration catalog against your HRIS and background-check stack.',
    'Prioritize interview-kit enforcement over unlimited-seat marketing if legal will review the file.',
  ],
  'remote-teams': [
    'Require multi-time-zone self-scheduling without a shared office calendar.',
    'Confirm async video or take-home workflows for interviewers who never overlap.',
    'Check career-site language support if you hire outside one country.',
    'Run a full interview loop with no overlapping working hours before you buy.',
  ],
};

const PM_BUYER_ITEMS: Record<string, string[]> = {
  startups: [
    'Confirm weekly check-ins and 1:1s can run without a People Ops specialist.',
    'Price seats at 12-month headcount, including any extra review or goals modules.',
    'Skip compensation-calibration SKUs until you actually run a merit cycle.',
    'Check Slack or Teams so feedback does not live behind a second login.',
  ],
  scaleups: [
    'Require OKRs and reviews in one system before third-survey sprawl starts.',
    'Test calibration with quota-carrying managers, not a sandbox demo dataset.',
    'Quote the compensation-module sticker as a line item so Finance sees the all-in number.',
    'Confirm HRIS and SSO sync so a series-b headcount wave is not keyed off a shadow org chart.',
  ],
  'people-ops': [
    'Score whether engagement-science packs, talent calibration, and a people-analytics overlay live in one business-partner console lock.',
    'Refuse a stack that dumps the cycle-admin runbook into a second dashboard every review cycle.',
    'Confirm office-hours talent clinics and reviews can be templated without buying extra admin seats.',
    'Check a succession-slate facilitation kit so People Ops is not rebuilding slates in a side file.',
  ],
  'remote-teams': [
    'Require async check-ins and reviews that work across time zones without hallway context.',
    'Reject tools that assume one office language or one shared working day.',
    'Confirm Slack/Teams nudges reach managers who are not in the HRIS all day.',
    'Test a full review cycle with no overlapping working hours before you buy.',
  ],
  agencies: [
    'Confirm reviews can run across billable teams without assuming a single in-house org chart.',
    'Keep cycle completion auditable per client or studio, not only company-wide.',
    'Check whether 1:1s and feedback work for mixed employee and contractor benches.',
    'Model seat cost at peak bench size, not last month’s average roster.',
  ],
  enterprise: [
    'Require SAML 2.0 SSO and compensation calibration that survives legal review.',
    'Ask for engagement-science or works-council evidence, not a self-serve SMB PDF.',
    'Run a talent-calibration tabletop with HRBPs before you rip out the incumbent.',
    'Get a named implementation SLA into the MSA before kickoff.',
  ],
};

function comparisonFamily(toolAId: string, toolBId: string): 'payroll' | 'ats' | 'pm' | null {
  if (globalPayrollPersonaByToolId[toolAId] && globalPayrollPersonaByToolId[toolBId]) return 'payroll';
  if (atsPersonaByToolId[toolAId] && atsPersonaByToolId[toolBId]) return 'ats';
  if (performancePersonaByToolId[toolAId] && performancePersonaByToolId[toolBId]) return 'pm';
  return null;
}

function buyerItemsFor(comparison: Comparison): string[] {
  const family = comparisonFamily(comparison.tool_a_id, comparison.tool_b_id);
  const table =
    family === 'ats' ? ATS_BUYER_ITEMS : family === 'pm' ? PM_BUYER_ITEMS : BUYER_WORKFLOW_ITEMS;
  return (table[comparison.niche_id] ?? table.scaleups ?? BUYER_WORKFLOW_ITEMS.scaleups ?? []).slice(0, 4);
}

export interface WorkflowBottleneck {
  title: string;
  body: string;
}

const PAYROLL_BOTTLENECKS: Record<string, WorkflowBottleneck[]> = {
  startups: [
    { title: 'No specialist admin', body: '{PERSONA} cannot hire a payroll lead in month one. If {A} or {B} needs a dedicated operator to stand up the first contractor or EOR hire, the stack fails before headcount exists.' },
    { title: 'Year-one add-on math', body: 'Headline seats hide EOR, contractor, and device modules. {PERSONA} should quote the first 12 months on {A} and {B} at planned headcount, not the published starter rate.' },
    { title: 'IP on the first offer', body: 'The first international contract is where invention assignment gets skipped. {PERSONA} needs local-entity IP language from {A} or {B} before day-one onboarding, not as a cleanup project.' },
  ],
  'tech-startups': [
    { title: 'Speed vs entity ownership', body: '{PERSONA} will trade a 24-hour EOR go-live against owned-entity purity. Confirm whether {A} or {B} actually employs in-country or routes through a partner before the first engineer is hired.' },
    { title: 'Coverage-map fiction', body: 'Homepage country lists are not SLAs. {PERSONA} should check onboarding time in the two countries they will hire next on {A} and {B}.' },
    { title: 'Equity and contractor mix', body: 'Early teams mix 1099, EOR, and option grants. If {A} or {B} cannot keep those worker types on one record, finance will reconcile them in a spreadsheet.' },
  ],
  scaleups: [
    { title: 'Multi-entity month-end', body: '{PERSONA} breaks when People and Finance close books from two vendors. {A} vs {B} is an operating-system choice: one system of record, or another quarter of spreadsheet merges.' },
    { title: 'Worker-type sprawl', body: 'List every W-2, EOR, and contractor country for the next 18 months. If {A} or {B} cannot hold that mix, the implementation will stall in legal.' },
    { title: 'Package vs à la carte', body: 'SSO, reporting, and workflow automation quoted after kickoff destroy the business case. {PERSONA} should force {A} and {B} to package those line items now.' },
  ],
  agencies: [
    { title: 'Seat minimums on one company', body: '{PERSONA} does not have a single in-house headcount plan. If {A} or {B} prices seats as one employer, peak bench cost (campaign spikes) will not match the contract.' },
    { title: 'Client-level payout audit', body: 'Batch contractor payouts must stay auditable per client for invoice reconciliation. {A} and {B} fail this workflow if submissions and payouts cannot be tagged to an account.' },
    { title: 'Device and payroll on one record', body: 'Agencies provision client laptops and app access beside payroll. {PERSONA} should confirm {A} or {B} can sit IT identity on the same worker record as the payout.' },
  ],
  'us-latam': [
    { title: 'Brazil/Mexico employment vehicle', body: '{PERSONA} must lock owned-entity vs partner EOR in Brazil and Mexico before offers go out. {A} and {B} are not interchangeable once 13th-month and FGTS/social charges hit the fully loaded number.' },
    { title: 'Contractor tax withholding', body: 'US companies paying LATAM contractors skip withholding until an audit. Confirm how {A} vs {B} handles 1099/W-8BEN, local invoices, and misclassification cover for this corridor.' },
    { title: 'FX on take-home pay', body: 'BRL and MXN payroll that does not match the signed offer is a resignation event. Model FX on {A} and {B} before {PERSONA} sends the contract.' },
  ],
  'web3-crypto': [
    { title: 'USDC is not a fiat HRIS feature', body: '{PERSONA} should confirm native USDC or crypto payouts on {A} and {B}. A fiat wallet with an off-platform treasury rail is not payroll.' },
    { title: 'Token comp off the payroll file', body: 'Keep token grants off {A} or {B} unless the vendor actually supports them. Mixing tokens into 1099/W-8BEN without a rail creates a tax file {PERSONA} cannot defend.' },
    { title: 'Fiat FX on the rest of the bench', body: 'Not every contributor is paid in USDC. Model fiat corridors on {A} vs {B} for locally employed staff beside the crypto bench.' },
  ],
  enterprise: [
    { title: 'SSO before the demo', body: '{PERSONA} should require SAML 2.0 and SCIM in the security questionnaire for {A} and {B} before procurement books time.' },
    { title: 'Works-council evidence', body: 'Self-serve SMB PDFs fail legal review. Ask {A} and {B} for audit-ready EEO or works-council evidence, not a marketing one-pager.' },
    { title: 'Named implementation SLA', body: 'Enterprise EOR fails in the MSA gap. Get a named implementation owner and DPA into the {A} vs {B} contract before kickoff.' },
  ],
};

function fillPersonaCopy(template: string, comparison: Comparison, modifierLabel: string): string {
  return template
    .replaceAll('{A}', comparison.tool_a_name)
    .replaceAll('{B}', comparison.tool_b_name)
    .replaceAll('{FOR}', `for ${modifierLabel}`)
    .replaceAll('{PERSONA}', modifierLabel);
}

export function buildWorkflowBottlenecks(comparison: Comparison): WorkflowBottleneck[] {
  const family = comparisonFamily(comparison.tool_a_id, comparison.tool_b_id);
  const table =
    family === 'ats' ? ATS_BOTTLENECKS : family === 'pm' ? PM_BOTTLENECKS : PAYROLL_BOTTLENECKS;
  const modifierLabel = modifierTitleSuffix(comparison.niche_id, comparison.niche_name);
  const rows = table[comparison.niche_id] ?? table.scaleups ?? PAYROLL_BOTTLENECKS.scaleups ?? [];
  return rows.slice(0, 3).map((item) => ({
    title: fillPersonaCopy(item.title, comparison, modifierLabel),
    body: fillPersonaCopy(item.body, comparison, modifierLabel),
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

const BUYER_WORKFLOW_ITEMS: Record<string, string[]> = {
  'tech-startups': [
    'Confirm you can run first international hires without hiring a specialist payroll or HR admin.',
    'Price the first 12 months including EOR, contractor seats, and any IT or device modules—not just the headline rate.',
    'Check the real onboarding SLA in the countries you will hire, not the homepage coverage map.',
    'Decide now whether you need owned-entity employment for IP and contracts, or whether a partner-network EOR is acceptable.',
  ],
  startups: [
    'Confirm you can stand up payroll or hiring without a dedicated People Ops hire in the first 90 days.',
    'Model year-one cost at your planned headcount, including add-on modules you will actually turn on.',
    'Verify onboarding time in your first two countries before you sign a multi-year term.',
    'Write IP assignment and contractor-vs-employee classification into the offer process, not as a cleanup project later.',
  ],
  scaleups: [
    'List every country and worker type (W-2, EOR, contractor) you will run over the next 18 months.',
    'Require one system of record for People and Finance so month-end is not a spreadsheet merge.',
    'Quote payroll, SSO, reporting, and workflow automation as a package—not à la carte surprises after kickoff.',
    'Pilot onboarding and approvals with one team before you rip out the incumbent stack.',
  ],
  agencies: [
    'Confirm the vendor can batch contractors and employees across client accounts, not a single in-house headcount plan.',
    'Keep payouts, submissions, and billable time auditable per client for invoice reconciliation.',
    'Check whether client-device and app access can sit on the same worker record as payroll.',
    'Model cost at peak bench size (holiday and campaign spikes), not last month’s average roster.',
  ],
  'us-latam': [
    'Lock Brazil and Mexico as owned-entity versus partner EOR before you issue offers.',
    'Accrue 13th-month pay, social charges, and statutory vacation into the fully loaded offer.',
    'Confirm FX treatment on BRL/MXN payroll so take-home matches the number in the signed contract.',
    'Put local IP assignment in the employment agreement before day-one onboarding starts.',
  ],
  'web3-crypto': [
    'Confirm native USDC or crypto payouts—do not assume a fiat HRIS can run treasury rails.',
    'Keep token compensation off the payroll file unless the vendor actually supports it.',
    'Model fiat FX on the rest of the bench (USD/USDC contractors versus locally employed staff).',
    'Check contractor misclassification cover if you mix token grants with 1099 or W-8BEN workers.',
  ],
  enterprise: [
    'Require SAML 2.0 SSO and SCIM in the security questionnaire before procurement starts.',
    'Ask for audit-ready EEO or works-council evidence, not a self-serve SMB PDF.',
    'Run compensation or structured-hiring calibration with legal in the room, not only HR.',
    'Get a named implementation SLA and data-processing addendum into the MSA before kickoff.',
  ],
  'remote-teams': [
    'Require async scheduling or Slack/Teams check-ins that work across time zones without hallway context.',
    'Reject tools that assume one office language, one calendar, or one shared working day.',
    'Confirm contractor and employee workflows for distributed contributors in the same system.',
    'Test a full hiring or review cycle with no overlapping working hours before you buy.',
  ],
  'people-ops': [
    'Score whether engagement, talent calibration, and people analytics live in one HRBP console.',
    'Refuse a stack that forces a CSV export into a second dashboard every review cycle.',
    'Confirm manager 1:1s and reviews can be templated without buying extra admin seats.',
    'Check SSO and HRIS sync so People Ops is not maintaining a shadow org chart.',
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

function pipeList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value.split('|').map((item) => item.trim()).filter(Boolean);
}

function winnerNameOf(comparison: Comparison): string {
  if (comparison.winner_id === comparison.tool_a_id) return comparison.tool_a_name;
  if (comparison.winner_id === comparison.tool_b_id) return comparison.tool_b_name;
  return comparison.winner_id;
}

function isOwnedEntityPositive(clause: string): boolean {
  return /\bnot a (partner|third-party)\b/i.test(clause);
}

function isCaveatClause(clause: string): boolean {
  if (isOwnedEntityPositive(clause)) return false;
  const text = clause.toLowerCase();
  return (
    /\b(is not|are not|was not|were not|does not|do not|cannot|unfit|out of scope|out of band|there is no|no published)\b/.test(
      text
    ) ||
    /\b(separately priced|not bundled|paid module|paid add-on|headline seat|modules you actually buy|country-dependent|high minimums|later add-on|billed separately|extra seat)\b/.test(
      text
    ) ||
    /\b(trails?|secondary to|depend(?:s)? on the|follow the eor|not the \$|not the core|not comparable|not owned-entity)\b/.test(
      text
    ) ||
    /\bless (?:than|“|")/.test(text)
  );
}

/** Keep only affirmative clauses so fee disclosures and gaps never land in a Wins card. */
function positiveSpecText(spec: string): string | null {
  const withoutFeeParens = spec.replace(/\([^)]*(?:cost|fee|priced|add-on|seat)[^)]*\)/gi, '');
  const clauses = withoutFeeParens
    .split(/[;.]/)
    .map((clause) => clause.trim())
    .filter(Boolean);
  const kept = clauses.filter((clause) => !isCaveatClause(clause));
  if (kept.length === 0) return null;
  const joined = kept
    .map((clause, index) =>
      index === 0 ? clause : `${clause.charAt(0).toUpperCase()}${clause.slice(1)}`
    )
    .join('. ');
  return clipSpec(joined, 22);
}

function alreadyCovered(points: PersonaWinPoint[], candidate: string): boolean {
  const haystack = points.map((point) => `${point.label} ${point.spec}`.toLowerCase()).join(' ');
  const tokens = candidate
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 4);
  if (tokens.length === 0) return haystack.includes(candidate.toLowerCase());
  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return hits >= Math.min(3, tokens.length);
}

function matrixWinsForSide(rows: PersonaMatrixRow[], side: 'a' | 'b'): {
  exclusive: PersonaWinPoint[];
  shared: PersonaWinPoint[];
} {
  const exclusive: PersonaWinPoint[] = [];
  const shared: PersonaWinPoint[] = [];
  const otherSide = side === 'a' ? 'b' : 'a';

  for (const row of rows) {
    if (!row[side].supported) continue;
    const spec = positiveSpecText(row[side].spec);
    if (!spec) continue;
    const point = { label: row.label, spec };
    if (row[otherSide].supported) shared.push(point);
    else exclusive.push(point);
  }

  return { exclusive, shared };
}

function supplementWins(
  points: PersonaWinPoint[],
  pros: string[],
  shared: PersonaWinPoint[],
  max = 4
): PersonaWinPoint[] {
  const next = [...points];

  for (const pro of pros) {
    if (next.length >= max) break;
    if (isCaveatClause(pro)) continue;
    if (alreadyCovered(next, pro)) continue;
    next.push({ label: pro.replace(/[.,;:]+$/, ''), spec: '' });
  }

  for (const point of shared) {
    if (next.length >= max) break;
    if (alreadyCovered(next, `${point.label} ${point.spec}`)) continue;
    next.push(point);
  }

  return next.slice(0, max);
}

function whereTheyWin(
  comparison: Comparison,
  rows: PersonaMatrixRow[]
): { a: PersonaWinPoint[]; b: PersonaWinPoint[] } {
  const aMatrix = matrixWinsForSide(rows, 'a');
  const bMatrix = matrixWinsForSide(rows, 'b');

  return {
    a: supplementWins(aMatrix.exclusive, pipeList(comparison.tool_a_pros), aMatrix.shared),
    b: supplementWins(bMatrix.exclusive, pipeList(comparison.tool_b_pros), bMatrix.shared),
  };
}

function asSupportSentence(fragment: string): string {
  const trimmed = fragment.replace(/[.,;:]+$/, '').trim();
  if (!trimmed) return '';
  if (/^(it|its|this)\b/i.test(trimmed)) return clipSpec(trimmed, 26);
  if (/^\d/.test(trimmed)) return clipSpec(`It wins with a ${trimmed}`, 26);
  return clipSpec(`It wins with ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`, 26);
}

function punchySupport(comparison: Comparison): string {
  const bullets = pipeList(comparison.winner_bullets);
  if (bullets[0]) return asSupportSentence(bullets[0]);

  const afterColon = comparison.winner_reason.split(/:\s+/).slice(1).join(': ');
  if (afterColon && !/\bsuperior score\b/i.test(afterColon)) {
    return asSupportSentence(afterColon.split(';')[0]);
  }

  if (comparison.winner_category && comparison.winner_category.toLowerCase() !== 'overall fit') {
    return `It leads on ${comparison.winner_category}.`;
  }
  return 'It is the stronger overall fit for this workflow.';
}

function contrastNeed(comparison: Comparison): { name: string; need: string } | null {
  const winnerIsA = comparison.winner_id === comparison.tool_a_id;
  const name = winnerIsA ? comparison.tool_b_name : comparison.tool_a_name;
  const badge = winnerIsA ? comparison.tool_b_badge : comparison.tool_a_badge;
  const pro = pipeList(winnerIsA ? comparison.tool_b_pros : comparison.tool_a_pros)[0];
  const need = (badge.replace(/^Best for\s+/i, '').trim() || pro || '').replace(/\s*\([^)]*\)\s*$/, '');
  if (!need) return null;
  return { name, need };
}

function needPhrase(need: string): string {
  if (/^(US|UK|EU|EEO|IP|IT|HR|SSO|HRIS|ATS|EOR)\b/.test(need)) return need;
  return need.toLowerCase();
}

function buildBottomLine(comparison: Comparison, modifierLabel: string): string {
  const winner = winnerNameOf(comparison);
  const lead = `${winner} is the top-recommended platform for ${modifierLabel}.`;
  const support = punchySupport(comparison);
  const other = contrastNeed(comparison);
  const contrast = other
    ? `${other.name} is the stronger alternative when you need ${needPhrase(other.need)}.`
    : '';

  return [lead, support, contrast]
    .map((part) => part.replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
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
  const wins = whereTheyWin(comparison, rows);
  const workflowItems = buyerItemsFor(comparison);

  return {
    modifierLabel,
    toolAName: comparison.tool_a_name,
    toolBName: comparison.tool_b_name,
    bottomLine: buildBottomLine(comparison, modifierLabel),
    whereAWins: wins.a,
    whereBWins: wins.b,
    buyerConsiderations: workflowItems.slice(0, 4),
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
  _pricingAnswer: string
): FaqItem[] {
  const family = comparisonFamily(comparison.tool_a_id, comparison.tool_b_id);
  const verticalFaqs = family === 'ats' ? ATS_FAQS : family === 'pm' ? PM_FAQS : null;

  if (verticalFaqs) {
    const templates = verticalFaqs[comparison.niche_id] ?? verticalFaqs.scaleups ?? [];
    return templates.slice(0, 3).map((item) => ({
      question: fillPersonaCopy(item.question, comparison, modifierLabel),
      answer: fillPersonaCopy(item.answer, comparison, modifierLabel),
    }));
  }

  const a = comparison.tool_a_name;
  const b = comparison.tool_b_name;
  const winner = winnerNameOf(comparison);
  const buyers = buyerItemsFor(comparison);
  const bottlenecks = buildWorkflowBottlenecks(comparison);
  const distinct =
    rows.find((row) => row.a.supported !== row.b.supported || row.a.spec !== row.b.spec) ?? rows[0];
  const other = contrastNeed(comparison);
  const firstBuyer = buyers[0] ?? `Score ${a} and ${b} against this ${modifierLabel} workflow before you sign.`;
  const firstBottleneck = bottlenecks[0];

  const capabilityQuestion = distinct
    ? `How do ${a} and ${b} handle ${distinct.label.toLowerCase()} for ${modifierLabel}?`
    : `Which capability should ${modifierLabel} compare first in ${a} vs ${b}?`;
  const capabilityAnswer = distinct
    ? `For ${modifierLabel}, ${a} ${distinct.a.supported ? 'covers' : 'does not cover'} ${distinct.label.toLowerCase()}: ${distinct.a.spec} ${b} ${distinct.b.supported ? 'covers' : 'does not cover'} it: ${distinct.b.spec}`
    : firstBuyer;

  return [
    {
      question: `Is ${a} or ${b} better for ${modifierLabel}?`,
      answer: `${winner} is the top-recommended platform for ${modifierLabel}. ${firstBuyer}${
        other ? ` ${other.name} is the stronger alternative when you need ${needPhrase(other.need)}.` : ''
      }`.replace(/\s{2,}/g, ' '),
    },
    {
      question: capabilityQuestion,
      answer: capabilityAnswer.replace(/\s{2,}/g, ' '),
    },
    {
      question: `What operational bottleneck should ${modifierLabel} resolve first when choosing ${a} or ${b}?`,
      answer: firstBottleneck
        ? `${firstBottleneck.title}: ${firstBottleneck.body}`
        : firstBuyer,
    },
  ];
}
