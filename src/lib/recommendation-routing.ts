/**
 * Recommendation decision matrix.
 *
 * Rules are evaluated in order per category and the first match wins, so the
 * ordering here is the spec: a broader rule placed later never shadows a more
 * specific one above it.
 *
 * Two hard constraints shape which pairs may appear:
 *  1. Every `pairSlug` must be a live master comparison hub. Greenhouse,
 *     15Five, Leapsome, ClearCompany, PeopleFluent and Plane are purged from
 *     the vendor catalog, so no rule may route to them.
 *  2. This module is imported by the browser bundle in RecommendationEngine.
 *     It must stay free of `node:` imports - vendor outbound hrefs are
 *     resolved at build time in the component, keyed by the ids exported here.
 */

/** Hub CTAs still link with ?category=payroll; that older value maps to global_eor. */
export const LEGACY_CATEGORY_VALUES: Record<string, string> = { payroll: 'global_eor' };

export interface SelectOption {
  value: string;
  label: string;
}

export const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'performance', label: 'Performance Management' },
  { value: 'global_eor', label: 'Global Payroll & EOR' },
  { value: 'ats', label: 'Applicant Tracking Systems (ATS)' },
];

/**
 * Universal business categories. Unlike the previous persona tokens these are
 * not gated per category, so Question 2 renders the same six options no matter
 * what the visitor picked in Question 1.
 */
export const COMPANY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'small_business', label: 'Small Business / Traditional SMB (1–50 employees)' },
  { value: 'tech_startup', label: 'Fast-Growth Tech Startup' },
  { value: 'scaleup', label: 'Scaleup / Mid-Market (50–250 employees)' },
  { value: 'agency', label: 'Agency / Professional Services' },
  { value: 'distributed_team', label: 'Global / Distributed Remote Team' },
  { value: 'enterprise', label: 'Corporate / Enterprise (250+ employees)' },
];

export const BUDGET_OPTIONS: SelectOption[] = [
  { value: 'lean', label: 'Under $500 / month' },
  { value: 'mid', label: '$500–$2,000 / month' },
  { value: 'flexible', label: '$2,000+ / month or flexible' },
];

export const LOCATION_OPTIONS: SelectOption[] = [
  { value: 'us_only', label: 'US Only' },
  { value: 'global_remote', label: 'Global / Remote' },
  { value: 'hybrid', label: 'Hybrid (US + International)' },
];

export interface RecommendationVendor {
  id: string;
  name: string;
}

export interface RecommendationResult {
  category: string;
  pairSlug: string;
  pairHref: string;
  pairLabel: string;
  vendorA: RecommendationVendor;
  vendorB: RecommendationVendor;
  rationale: string;
}

interface Inputs {
  category: string;
  companyType: string;
  budget: string;
  location: string;
}

/**
 * Sentence fragments composed into the rationale. Each is written to slot into
 * `For {company} {location} on {budget}, ...` without further glue.
 */
const COMPANY_PHRASE: Record<string, string> = {
  small_business: 'a 1–50 person small business',
  tech_startup: 'a fast-growth tech startup',
  scaleup: 'a 50–250 person scaleup',
  agency: 'an agency or professional-services firm',
  distributed_team: 'a globally distributed remote team',
  enterprise: 'a 250+ employee enterprise',
};

const BUDGET_PHRASE: Record<string, string> = {
  lean: 'a sub-$500/month budget',
  mid: 'a $500–$2,000/month budget',
  flexible: 'a $2,000+/month budget',
};

const LOCATION_PHRASE: Record<string, string> = {
  us_only: 'hiring only in the US',
  global_remote: 'hiring globally',
  hybrid: 'hiring across the US and internationally',
};

function company(i: Inputs): string {
  return COMPANY_PHRASE[i.companyType] ?? 'your team';
}

function budget(i: Inputs): string {
  return BUDGET_PHRASE[i.budget] ?? 'your budget';
}

function location(i: Inputs): string {
  return LOCATION_PHRASE[i.location] ?? 'hiring where you operate today';
}

interface PairDefinition {
  a: RecommendationVendor;
  b: RecommendationVendor;
  /** Exactly two sentences: why this pair fits, then how to split A vs B. */
  rationale: (i: Inputs) => string;
}

/**
 * Vendor order in every pair matches the live comparison hub's own ordering,
 * so "Read Deel vs Oyster HR" lands on a page with that same H1 rather than a
 * reversed title the visitor has to re-parse.
 */
const PAIRS: Record<string, PairDefinition> = {
  // --- Global Payroll & EOR ---
  'rippling-vs-gusto': {
    a: { id: 'rippling', name: 'Rippling' },
    b: { id: 'gusto', name: 'Gusto' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, Rippling vs Gusto keeps the decision on US payroll, tax filings, and benefits where both vendors publish rates you can model before a sales call. Gusto is the cheaper entry at $49/month plus $6/user when filings are the whole job, while Rippling only earns the premium if devices and app access should sit on the same employee record.`,
  },
  'deel-vs-oyster-hr': {
    a: { id: 'deel', name: 'Deel' },
    b: { id: 'oyster-hr', name: 'Oyster HR' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, Deel vs Oyster HR is the pair that still publishes contractor and EOR rates instead of hiding them behind a quote. Oyster HR is the value entry at $29/contractor after its trial, and Deel is the upgrade path on the same page once you need owned entities in more markets than Oyster covers directly.`,
  },
  'deel-vs-multiplier': {
    a: { id: 'deel', name: 'Deel' },
    b: { id: 'multiplier', name: 'Multiplier' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, Deel vs Multiplier is the APAC and EMEA coverage question without forcing a US-first HRIS into the stack. Multiplier is the cost-efficient side at roughly $400/month per EOR employee with instant localized contracts, while Deel is worth the premium when you need owned entities and bundled equipment across more countries.`,
  },
  'deel-vs-rippling': {
    a: { id: 'deel', name: 'Deel' },
    b: { id: 'rippling', name: 'Rippling' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} with ${budget(i)}, Deel vs Rippling is a system-of-record decision rather than a per-seat price comparison. Rippling is the stronger pick when payroll, devices, and app provisioning run off one employee record, while Deel stays on the page for the countries Rippling still treats as an EOR add-on.`,
  },
  'deel-vs-papaya-global': {
    a: { id: 'deel', name: 'Deel' },
    b: { id: 'papaya-global', name: 'Papaya Global' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} with ${budget(i)}, Deel vs Papaya Global is the multi-country consolidation comparison, where reporting across entities matters more than the headline seat rate. Papaya Global suits finance teams that need consolidated payroll intelligence across owned entities and EOR workers, while Deel wins when fast onboarding through owned entities is the priority.`,
  },
  'deel-vs-remote': {
    a: { id: 'deel', name: 'Deel' },
    b: { id: 'remote', name: 'Remote' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, Deel vs Remote is the default global EOR shortlist because both own their local entities rather than leasing partner coverage. Remote is the pick when IP protection and zero-markup FX decide it, and Deel is the pick when raw country coverage and onboarding speed matter more.`,
  },

  // --- Applicant Tracking Systems ---
  'breezy-hr-vs-jazzhr': {
    a: { id: 'breezy-hr', name: 'Breezy HR' },
    b: { id: 'jazzhr', name: 'JazzHR' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, Breezy HR vs JazzHR is the ATS pair where both vendors publish pricing outright instead of routing you to procurement. Breezy HR is the faster start thanks to a usable free tier and drag-and-drop pipelines, while JazzHR wins from $75/month if every interviewer needs a seat without per-user fees.`,
  },
  'ashby-vs-workable': {
    a: { id: 'ashby', name: 'Ashby' },
    b: { id: 'workable', name: 'Workable' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, Ashby vs Workable weighs recruiting analytics against sourcing reach, which is the real trade-off once hiring volume climbs. Ashby is the pick when scorecards and funnel reporting must scale on flat unlimited-seat tiers, while Workable is the pick when one-click posting to 200+ job boards and built-in AI sourcing matter more.`,
  },
  'workable-vs-breezy-hr': {
    a: { id: 'workable', name: 'Workable' },
    b: { id: 'breezy-hr', name: 'Breezy HR' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, Workable vs Breezy HR is the practical mid-budget ATS pair since both publish prices and neither needs a procurement cycle. Workable is stronger when you need wide job-board syndication and AI sourcing in the base product, while Breezy HR keeps spend tied to concurrent roles rather than team size.`,
  },
  'ashby-vs-lever': {
    a: { id: 'ashby', name: 'Ashby' },
    b: { id: 'lever', name: 'Lever' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} at ${budget(i)}, Ashby vs Lever is the high-volume recruiting comparison for teams that have outgrown published-price tools. Ashby is the stronger system when analytics and structured scorecards drive the decision, while Lever is the better fit when outbound sourcing and candidate nurture are the reason you are buying.`,
  },

  // --- Performance Management (PerformYard, Lattice, Culture Amp only) ---
  'performyard-vs-lattice': {
    a: { id: 'performyard', name: 'PerformYard' },
    b: { id: 'lattice', name: 'Lattice' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, PerformYard vs Lattice is the review-cycle comparison that does not drag you into an engagement-science rollout. PerformYard is the budget-predictable side at about $5/user with highly configurable review templates, while Lattice is worth the step up if goals, 1:1s, and pay bands should share one record.`,
  },
  'lattice-vs-culture-amp': {
    a: { id: 'lattice', name: 'Lattice' },
    b: { id: 'culture-amp', name: 'Culture Amp' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} on ${budget(i)}, Lattice vs Culture Amp is a structured-OKR versus engagement-survey decision rather than a feature-count exercise. Lattice is the pick when reviews, goals, and compensation need one shared performance record, while Culture Amp is the pick when survey science and benchmark data are the actual reason you are buying.`,
  },
  'performyard-vs-culture-amp': {
    a: { id: 'performyard', name: 'PerformYard' },
    b: { id: 'culture-amp', name: 'Culture Amp' },
    rationale: (i) =>
      `For ${company(i)} ${location(i)} at ${budget(i)}, PerformYard vs Culture Amp contrasts configurable review operations against people-science measurement at the top of your budget range. PerformYard fits when custom calibration cycles must run without an enterprise implementation, while Culture Amp earns the spend when engagement benchmarking drives the whole programme.`,
  },
};

/** Returns a pair slug when the scenario matches, otherwise null. */
type Rule = (i: Inputs) => string | null;

const INTERNATIONAL_LOCATIONS = new Set(['global_remote', 'hybrid']);

const RULES: Record<string, Rule[]> = {
  global_eor: [
    (i) => (i.budget === 'lean' && i.location === 'us_only' ? 'rippling-vs-gusto' : null),
    (i) => (i.budget === 'lean' && INTERNATIONAL_LOCATIONS.has(i.location) ? 'deel-vs-oyster-hr' : null),
    (i) =>
      i.budget === 'mid' && (i.companyType === 'distributed_team' || i.companyType === 'scaleup')
        ? 'deel-vs-multiplier'
        : null,
    // "$2,000+ or Enterprise" splits on footprint: Rippling is the US
    // system-of-record answer, Papaya Global the multi-country one.
    (i) =>
      i.budget === 'flexible' || i.companyType === 'enterprise'
        ? i.location === 'us_only'
          ? 'deel-vs-rippling'
          : 'deel-vs-papaya-global'
        : null,
  ],
  ats: [
    (i) =>
      i.budget === 'lean' && (i.companyType === 'small_business' || i.companyType === 'agency')
        ? 'breezy-hr-vs-jazzhr'
        : null,
    (i) =>
      i.budget === 'mid' && (i.companyType === 'tech_startup' || i.companyType === 'distributed_team')
        ? i.companyType === 'tech_startup'
          ? 'ashby-vs-workable'
          : 'workable-vs-breezy-hr'
        : null,
    (i) =>
      i.budget === 'flexible' || i.companyType === 'scaleup' || i.companyType === 'enterprise'
        ? 'ashby-vs-lever'
        : null,
  ],
  performance: [
    (i) =>
      i.budget === 'lean' || i.companyType === 'small_business' || i.companyType === 'agency'
        ? 'performyard-vs-lattice'
        : null,
    (i) =>
      i.budget === 'mid' || i.companyType === 'tech_startup' || i.companyType === 'distributed_team'
        ? 'lattice-vs-culture-amp'
        : null,
    (i) =>
      i.budget === 'flexible' || i.companyType === 'scaleup' || i.companyType === 'enterprise'
        ? 'performyard-vs-culture-amp'
        : null,
  ],
};

const FALLBACK_PAIR: Record<string, string> = {
  global_eor: 'deel-vs-remote',
  ats: 'ashby-vs-workable',
  performance: 'performyard-vs-lattice',
};

/** Every vendor id the matrix can surface, for build-time href resolution. */
export const RECOMMENDATION_VENDOR_IDS: string[] = Array.from(
  new Set(Object.values(PAIRS).flatMap((pair) => [pair.a.id, pair.b.id])),
).sort();

/** Every pair slug the matrix can surface, for route verification. */
export const RECOMMENDATION_PAIR_SLUGS: string[] = Object.keys(PAIRS);

export function normalizeCategory(category: string): string {
  return LEGACY_CATEGORY_VALUES[category] ?? category;
}

function buildResult(category: string, pairSlug: string, inputs: Inputs): RecommendationResult {
  const pair = PAIRS[pairSlug];
  return {
    category,
    pairSlug,
    pairHref: `/${pairSlug}/`,
    pairLabel: `${pair.a.name} vs ${pair.b.name}`,
    vendorA: pair.a,
    vendorB: pair.b,
    rationale: pair.rationale(inputs),
  };
}

export function resolveRecommendation(
  category: string,
  companyType: string,
  budget: string,
  location: string,
): RecommendationResult {
  const family = normalizeCategory(category);
  const resolvedFamily = family in RULES ? family : 'global_eor';
  const inputs: Inputs = { category: resolvedFamily, companyType, budget, location };

  for (const rule of RULES[resolvedFamily]) {
    const pairSlug = rule(inputs);
    if (pairSlug) return buildResult(resolvedFamily, pairSlug, inputs);
  }

  return buildResult(resolvedFamily, FALLBACK_PAIR[resolvedFamily], inputs);
}