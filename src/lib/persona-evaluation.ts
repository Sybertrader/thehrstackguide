import type { Comparison, FeatureSpec } from '../types/comparison';
import { atsPersonaByToolId } from '../data/personaData.ats';
import { performancePersonaByToolId } from '../data/personaData.pm';
import { globalPayrollPersonaByToolId } from '../data/personaData.payroll';
import { comparisonHubSlug } from './comparison-routes';
import { ATS_BOTTLENECKS, ATS_FAQS, PAYROLL_FAQS, PM_BOTTLENECKS, PM_FAQS } from './persona-vertical-copy';

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

/** Public persona display title after "for" in child H1s, breadcrumbs, and banners. */
export const MODIFIER_TITLE_SUFFIX: Record<string, string> = {
  'tech-startups': 'Startups',
  startups: 'Startups',
  scaleups: 'Scaleups',
  agencies: 'Agencies',
  'us-latam': 'US & LATAM',
  'web3-crypto': 'Web3 & Crypto',
  enterprise: 'Enterprise',
  'remote-teams': 'Remote Teams',
  'people-ops': 'People Ops',
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
    const titleSuffix = modifierTitleSuffix(row.niche_id, row.niche_id === 'startups' ? 'Startups' : row.niche_name);
    const hubSlug = comparisonHubSlug(row.tool_a_id, row.tool_b_id);
    links.push({
      slug: hubSlug,
      nicheId: row.niche_id,
      nicheName: titleSuffix,
      href: `/${hubSlug}/`,
      titleSuffix,
    });
  }

  if (techStartups && !hasStartupsNiche) {
    const hubSlug = comparisonHubSlug(techStartups.tool_a_id, techStartups.tool_b_id);
    links.unshift({
      slug: hubSlug,
      nicheId: 'startups',
      nicheName: 'Startups',
      href: `/${hubSlug}/`,
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

export type ComparisonFamily = 'payroll' | 'ats' | 'pm';

export function comparisonFamily(toolAId: string, toolBId: string): ComparisonFamily | null {
  if (globalPayrollPersonaByToolId[toolAId] && globalPayrollPersonaByToolId[toolBId]) return 'payroll';
  if (atsPersonaByToolId[toolAId] && atsPersonaByToolId[toolBId]) return 'ats';
  if (performancePersonaByToolId[toolAId] && performancePersonaByToolId[toolBId]) return 'pm';
  return null;
}

/** Factors are this row's CSV `verdict_summary`. Category-wide lists are not substituted. */
function buyerItemsFor(comparison: Comparison): string[] {
  return pipeList(comparison.verdict_summary);
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
    {
      title: 'RFC tax ID validation & MXN/COP/BRL local payout rails for {PERSONA}',
      body: 'For {PERSONA}, payroll is not a USD wire with a country flag. {A} vs {B} must run RFC tax ID validation before MXN/COP/BRL local payout rails post, or SAT rejects the deposit and {PERSONA} still owes the contractor. A corridor that cannot land CLABE/PIX-equivalent rails in Mexico, Colombia, and Brazil is a resignation event, not an FX footnote.',
    },
    {
      title: 'Monotributista invoice auditing & cross-border contractor withholding for {PERSONA}',
      body: 'For {PERSONA}, Argentina and remote-contractor files fail on paperwork, not FX. {A} or {B} needs monotributista invoice auditing plus cross-border contractor withholding on the US→LATAM 1099/W-8BEN path {PERSONA} actually pays. Skipping factura/CFDI evidence until Q4 is how {PERSONA} buys a misclassification audit.',
    },
    {
      title: '13th-month aguinaldo rules on Brazil/Mexico EOR for {PERSONA}',
      body: 'For {PERSONA}, owned-entity vs partner EOR in Brazil and Mexico is decided by 13th-month aguinaldo rules, FGTS, and social charges on the fully loaded number. If {A} or {B} cannot accrue aguinaldo before the offer goes out, {PERSONA} will underquote the hire and relitigate compensation at month twelve.',
    },
  ],
  'web3-crypto': [
    {
      title: 'USDC/USDT stablecoin settlement & non-custodial wallet payouts for {PERSONA}',
      body: 'For {PERSONA}, a fiat HRIS with an off-platform treasury tab is not payroll. {A} vs {B} must prove native USDC/USDT stablecoin settlement and non-custodial wallet payouts, or {PERSONA} will reconcile contributors in a spreadsheet the DAO cannot defend. Custodial-only wallets that freeze tokens during a network incident are a walk-away.',
    },
    {
      title: 'DAO contributor agreements & token grant vesting schedules for {PERSONA}',
      body: 'For {PERSONA}, the worker file has to hold DAO contributor agreements next to token grant vesting schedules, not a USD 1099 with a Side Letter in Notion. If {A} or {B} cannot attach cliff, unlock, and revocation terms to the same record {PERSONA} uses for the fiat remainder, legal will split the bench and the cap table will drift.',
    },
    {
      title: 'Gas fee reconciliation on the crypto bench for {PERSONA}',
      body: 'For {PERSONA}, token and stablecoin payouts are incomplete without gas fee reconciliation. {A} vs {B} should itemize network fees per wallet so finance can close the month. A lump USDC send with no gas line leaves {PERSONA} guessing whether the treasury or the contributor ate the fee.',
    },
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

function contrastNeed(comparison: Comparison): { id: string; name: string; need: string } | null {
  const winnerIsA = comparison.winner_id === comparison.tool_a_id;
  const id = winnerIsA ? comparison.tool_b_id : comparison.tool_a_id;
  const name = winnerIsA ? comparison.tool_b_name : comparison.tool_a_name;
  const badge = winnerIsA ? comparison.tool_b_badge : comparison.tool_a_badge;
  const pro = pipeList(winnerIsA ? comparison.tool_b_pros : comparison.tool_a_pros)[0];
  const need = (badge.replace(/^Best for\s+/i, '').trim() || pro || '').replace(/\s*\([^)]*\)\s*$/, '');
  if (!need && !name) return null;
  return { id, name, need };
}

function needPhrase(need: string): string {
  if (/^(US|UK|EU|EEO|IP|IT|HR|SSO|HRIS|ATS|EOR)\b/.test(need)) return need;
  return need.toLowerCase();
}

function payrollCorridorTest(comparison: Comparison, modifierLabel: string): string {
  if (comparison.niche_id === 'us-latam') {
    return `For ${modifierLabel}, the corridor test is RFC tax ID validation, monotributista invoice auditing, MXN/COP/BRL local payout rails, cross-border contractor withholding, and 13th-month aguinaldo rules.`;
  }
  if (comparison.niche_id === 'web3-crypto') {
    return `For ${modifierLabel}, the corridor test is USDC/USDT stablecoin settlement, DAO contributor agreements, token grant vesting schedules, non-custodial wallet payouts, and gas fee reconciliation, not a fiat-only HRIS.`;
  }
  return '';
}

function payrollEvaluationOverlays(
  comparison: Comparison,
  modifierLabel: string
): { a: PersonaWinPoint[]; b: PersonaWinPoint[] } {
  const a = comparison.tool_a_name;
  const b = comparison.tool_b_name;
  if (comparison.niche_id === 'us-latam') {
    return {
      a: [
        {
          label: 'RFC tax ID validation',
          spec: `Score ${a} on RFC tax ID validation before MXN/COP/BRL local payout rails post for ${modifierLabel}.`,
        },
        {
          label: '13th-month aguinaldo rules',
          spec: `Confirm ${a} accrues 13th-month aguinaldo rules into the Brazil/Mexico fully loaded number ${modifierLabel} signs.`,
        },
      ],
      b: [
        {
          label: 'Monotributista invoice auditing',
          spec: `Score ${b} on monotributista invoice auditing so ${modifierLabel} can defend Argentina contractor files.`,
        },
        {
          label: 'Cross-border contractor withholding',
          spec: `Confirm ${b} handles cross-border contractor withholding on the US→LATAM corridor ${modifierLabel} pays.`,
        },
      ],
    };
  }
  if (comparison.niche_id === 'web3-crypto') {
    return {
      a: [
        {
          label: 'USDC/USDT stablecoin settlement',
          spec: `Score ${a} on native USDC/USDT stablecoin settlement, not an off-platform treasury tab ${modifierLabel} cannot audit.`,
        },
        {
          label: 'DAO contributor agreements',
          spec: `Confirm ${a} can attach DAO contributor agreements to the worker record ${modifierLabel} uses for grants.`,
        },
      ],
      b: [
        {
          label: 'Token grant vesting schedules',
          spec: `Score ${b} on token grant vesting schedules (cliff, unlock, revocation) staying on the same file ${modifierLabel} uses for fiat remainder.`,
        },
        {
          label: 'Non-custodial wallet payouts',
          spec: `Confirm ${b} supports non-custodial wallet payouts and gas fee reconciliation for the crypto bench ${modifierLabel} pays.`,
        },
      ],
    };
  }
  return { a: [], b: [] };
}

/** Pair-specific tab verdicts live in CSV `winner_reason` (not the generated "Based on…" template). */
function editorialBottomLine(comparison: Comparison, modifierLabel: string): string {
  const reason = comparison.winner_reason?.trim() ?? '';
  if (reason && !/^Based on The HR Stack Guide/i.test(reason)) return reason;
  return buildBottomLine(comparison, modifierLabel);
}

function buildBottomLine(comparison: Comparison, modifierLabel: string): string {
  const winner = winnerNameOf(comparison);
  const lead = `${winner} is the top-recommended platform for ${modifierLabel}.`;
  const support = punchySupport(comparison);
  const corridor = payrollCorridorTest(comparison, modifierLabel);
  const other = contrastNeed(comparison);
  const contrast = other
    ? `${other.name} is the stronger alternative when you need ${needPhrase(other.need)}.`
    : '';

  return [lead, support, corridor, contrast]
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
  const modifierLabel = modifierTitleSuffix(comparison.niche_id, comparison.niche_name);
  const workflowItems = buyerItemsFor(comparison);
  const buyerConsiderations = workflowItems
    .slice(0, 4)
    .map((item) => fillPersonaCopy(item, comparison, modifierLabel));

  if (rows.length === 0 && buyerConsiderations.length === 0) return null;

  const wins = rows.length > 0 ? whereTheyWin(comparison, rows) : { a: [], b: [] };
  const overlays = payrollEvaluationOverlays(comparison, modifierLabel);

  return {
    modifierLabel,
    toolAName: comparison.tool_a_name,
    toolBName: comparison.tool_b_name,
    bottomLine: editorialBottomLine(comparison, modifierLabel),
    whereAWins: [...overlays.a, ...wins.a].slice(0, 4),
    whereBWins: [...overlays.b, ...wins.b].slice(0, 4),
    buyerConsiderations,
  };
}

export interface MasterSegmentPanel {
  id: string;
  label: string;
  verdict: string;
  key_factors: string[];
}

/** Five on-page segment tabs for each vertical. Payroll uses the public buyer labels. */
export const MASTER_SEGMENT_ORDER: Record<ComparisonFamily, string[]> = {
  payroll: ['startups', 'scaleups', 'agencies', 'us-latam', 'web3-crypto'],
  ats: ['startups', 'scaleups', 'agencies', 'enterprise', 'remote-teams'],
  pm: ['startups', 'scaleups', 'enterprise', 'people-ops', 'remote-teams'],
};

function fillVendorNames(template: string, comparison: Comparison): string {
  return template.replaceAll('{A}', comparison.tool_a_name).replaceAll('{B}', comparison.tool_b_name);
}

/** Tab verdict is this row's CSV `winner_reason`, including generated "Based on…" copy. */
function segmentTabVerdict(comparison: Comparison): string {
  return comparison.winner_reason?.trim() ?? '';
}

function segmentKeyFactors(comparison: Comparison): string[] {
  return buyerItemsFor(comparison)
    .map((item) => fillVendorNames(item, comparison))
    .filter(Boolean);
}

export function buildMasterSegmentPanels(rows: Comparison[] = []): MasterSegmentPanel[] {
  const first = rows[0];
  if (!first) return [];
  const family = comparisonFamily(first.tool_a_id, first.tool_b_id);
  if (!family) return [];

  const byNiche = new Map<string, Comparison>();
  for (const row of rows) {
    const nicheId = row.niche_id === 'tech-startups' ? 'startups' : row.niche_id;
    if (byNiche.has(nicheId)) continue;
    byNiche.set(nicheId, {
      ...row,
      niche_id: nicheId,
      niche_name: MODIFIER_TITLE_SUFFIX[nicheId] ?? row.niche_name,
    });
  }

  return MASTER_SEGMENT_ORDER[family].flatMap((nicheId) => {
    const row = byNiche.get(nicheId);
    if (!row) return [];
    const label = modifierTitleSuffix(nicheId, row.niche_name);
    const verdict = segmentTabVerdict(row);
    const key_factors = segmentKeyFactors(row);
    if (!verdict && key_factors.length === 0) return [];
    return [{ id: nicheId, label, verdict, key_factors }];
  });
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
  const verticalFaqs =
    family === 'ats' ? ATS_FAQS : family === 'pm' ? PM_FAQS : family === 'payroll' ? PAYROLL_FAQS : null;

  if (verticalFaqs) {
    const templates =
      verticalFaqs[comparison.niche_id] ?? (family === 'payroll' ? undefined : verticalFaqs.scaleups);
    if (templates && templates.length > 0) {
      return templates.slice(0, 3).map((item) => ({
        question: fillPersonaCopy(item.question, comparison, modifierLabel),
        answer: fillPersonaCopy(item.answer, comparison, modifierLabel),
      }));
    }
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
