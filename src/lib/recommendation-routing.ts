/**
 * Recommendation wizard destination matrix.
 *
 * Pair slugs are the live comparison hubs (Papaya is `deel-vs-papaya`, Breezy
 * is `workable-vs-breezy-hr`, ClearCompany is `leapsome-vs-clearcompany`).
 * Persona tokens match Question 2 values and the public `-for-{persona}`
 * child URLs, including payroll startups at `-for-startups` (never the
 * legacy `-for-tech-startups` redirect).
 */

export const LEGACY_CATEGORY_VALUES: Record<string, string> = { payroll: 'global_eor' };

export const CATEGORY_HUBS: Record<string, string> = {
  performance: '/performance-management/',
  ats: '/applicant-tracking-systems/',
  global_eor: '/global-payroll-eor/',
};

export const PERSONAS_BY_CATEGORY: Record<string, string[]> = {
  ats: ['startups', 'scaleups', 'enterprise', 'agencies', 'remote-teams'],
  global_eor: ['startups', 'scaleups', 'agencies', 'us-latam', 'web3-crypto'],
  performance: ['startups', 'scaleups', 'enterprise', 'people-ops', 'remote-teams'],
};

const BUDGET_LOW = 'lean';
const BUDGET_MID = 'mid';
const BUDGET_HIGH = 'flexible';

export function normalizeCategory(category: string): string {
  return LEGACY_CATEGORY_VALUES[category] ?? category;
}

function comparisonHref(pair: string, persona: string): string {
  return `/${pair}-for-${persona}/`;
}

function isHighBudget(budget: string): boolean {
  return budget === BUDGET_HIGH;
}

function isLowBudget(budget: string): boolean {
  return budget === BUDGET_LOW;
}

function isMidBudget(budget: string): boolean {
  return budget === BUDGET_MID;
}

function isUsOnly(location: string): boolean {
  return location === 'us_only';
}

/**
 * ATS: more specific persona+budget rules after the enterprise / high-budget
 * upgrade path, then agencies, then scaleup / mid-market, then the generic
 * Ashby vs Lever hub.
 */
function resolveAtsPair(persona: string, budget: string, location: string): string {
  if (persona === 'enterprise' || isHighBudget(budget)) {
    return 'greenhouse-vs-lever';
  }
  if (persona === 'startups' && isLowBudget(budget)) {
    return isUsOnly(location) ? 'workable-vs-jazzhr' : 'workable-vs-breezy-hr';
  }
  if (persona === 'agencies') {
    return 'ashby-vs-lever';
  }
  if (persona === 'scaleups' || isMidBudget(budget)) {
    return persona === 'scaleups' ? 'ashby-vs-greenhouse' : 'ashby-vs-lever';
  }
  return 'ashby-vs-lever';
}

/**
 * Payroll / EOR: vertical personas (Web3, LATAM) win first, then
 * scaleup / high-budget Deel vs Rippling, then lean startups, then the
 * generic Deel vs Remote hub.
 */
function resolvePayrollPair(persona: string, budget: string, location: string): string {
  if (persona === 'web3-crypto' || persona === 'us-latam') {
    return 'deel-vs-papaya';
  }
  if (persona === 'scaleups' || isHighBudget(budget)) {
    return 'deel-vs-rippling';
  }
  if (persona === 'startups' && isLowBudget(budget)) {
    // Lean US-only teams get Remote vs Papaya; global / hybrid hiring lands
    // on Deel vs Remote at the public `-for-startups` child.
    return isUsOnly(location) ? 'remote-vs-papaya' : 'deel-vs-remote';
  }
  return 'deel-vs-remote';
}

/**
 * Performance: enterprise / high-budget Lattice vs Culture Amp, then
 * People Ops Leapsome pairs, then lean startups, then scaleups, then the
 * generic 15Five vs PerformYard hub.
 */
function resolvePmPair(persona: string, budget: string, location: string): string {
  if (persona === 'enterprise' || isHighBudget(budget)) {
    return 'lattice-vs-culture-amp';
  }
  if (persona === 'people-ops') {
    return isUsOnly(location) ? 'leapsome-vs-clearcompany' : 'leapsome-vs-culture-amp';
  }
  if (persona === 'startups' && isLowBudget(budget)) {
    return '15five-vs-performyard';
  }
  if (persona === 'scaleups') {
    return isUsOnly(location) ? '15five-vs-lattice' : 'leapsome-vs-lattice';
  }
  return '15five-vs-performyard';
}

export function resolveRecommendationUrl(
  category: string,
  persona: string,
  budget: string,
  location: string,
): string {
  const family = normalizeCategory(category);
  const allowed = PERSONAS_BY_CATEGORY[family];
  if (!allowed?.includes(persona)) {
    return CATEGORY_HUBS[family] ?? CATEGORY_HUBS.global_eor;
  }

  const pair =
    family === 'ats'
      ? resolveAtsPair(persona, budget, location)
      : family === 'performance'
        ? resolvePmPair(persona, budget, location)
        : resolvePayrollPair(persona, budget, location);

  return comparisonHref(pair, persona);
}
