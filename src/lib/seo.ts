/**
 * Programmatic `<title>` and `<h1>` strings for comparison and category routes.
 * Comparison titles use intent-driven segment/category closers (soft max 72
 * characters). Category hub titles still target the 50–60 SERP band.
 */

export const SEO_TITLE_YEAR = 2026;
export const SEO_TITLE_MIN = 50;
export const SEO_TITLE_MAX = 60;

export type SeoFamily = 'payroll' | 'ats' | 'pm' | null;

/** Shorter names used in `<title>` and H1 when the full brand would overflow. */
const TITLE_NAME_BY_ID: Record<string, string> = {
  'payoneer-workforce-management': 'Payoneer',
  'breezy-hr': 'Breezy',
  'bamboohr-ats': 'BambooHR',
};

export function titleVendorName(toolId: string, displayName: string): string {
  return TITLE_NAME_BY_ID[toolId] ?? displayName;
}

/** Short category noun interpolated into comparison titles and persona H1s. */
const CATEGORY_NOUN: Record<Exclude<SeoFamily, null>, string> = {
  payroll: 'Payroll',
  ats: 'ATS',
  pm: 'Performance',
};

/** Master 1-1 H1 category labels: `{A} vs {B}: {label} Comparison (2026)`. */
export const HUB_HEADING_CATEGORY: Record<Exclude<SeoFamily, null>, string> = {
  payroll: 'Global Payroll & EOR Software',
  ats: 'ATS & Recruiting Software',
  pm: 'Performance Management Software',
};

/**
 * Intent-driven `<title>` closers for persona child routes. Keys match
 * `niche_id` (and `tech-startups` aliases to `startups`).
 */
export const SEGMENT_TITLE_MODIFIERS: Record<string, string> = {
  enterprise: 'Security, Scale & Pricing',
  startups: 'Pricing, Features & Onboarding',
  'tech-startups': 'Pricing, Features & Onboarding',
  'remote-teams': 'Async Workflows & Compliance',
  'people-ops': 'HRIS Integration & UX',
  scaleups: 'Growth Plans & Feature Set',
  agencies: 'Client Management & Billing',
  'us-latam': 'Coverage, FX & Local Payroll',
  'web3-crypto': 'Contractor Payouts & Compliance',
};

/** Hub `<title>` closers so payroll / ATS / PM pairs do not share one formula. */
const HUB_TITLE_CLOSERS: Record<Exclude<SeoFamily, null>, string> = {
  payroll: 'Features, Pricing & Review',
  ats: 'Hiring Features & Pricing',
  pm: 'Reviews, OKRs & Pricing',
};

const TITLE_SOFT_MAX = 72;

function categoryNoun(family: SeoFamily): string {
  return family ? CATEGORY_NOUN[family] : 'HR';
}

function segmentTitleModifier(nicheId: string | null | undefined, family: SeoFamily): string {
  const key = nicheId === 'tech-startups' ? 'startups' : nicheId || '';
  if (key && SEGMENT_TITLE_MODIFIERS[key]) return SEGMENT_TITLE_MODIFIERS[key];
  return `${categoryNoun(family)} Features & ${SEO_TITLE_YEAR} Pricing`;
}

function firstInRange(candidates: string[]): string {
  const inRange = candidates.filter((title) => title.length >= SEO_TITLE_MIN && title.length <= SEO_TITLE_MAX);
  if (inRange.length > 0) return inRange[0];
  return candidates.reduce((best, title) =>
    Math.abs(title.length - 55) < Math.abs(best.length - 55) ? title : best
  );
}

/** Prefer the intent-led candidate; only shorten when the string is too long for SERPs. */
function preferIntentTitle(candidates: string[]): string {
  const unique = [...new Set(candidates.filter(Boolean))];
  const fit = unique.find((title) => title.length <= TITLE_SOFT_MAX);
  return fit ?? unique.reduce((shortest, title) => (title.length < shortest.length ? title : shortest));
}

/**
 * Persona child: `[A] vs [B] for [Segment] (2026): [Intent closer]`
 * Hub: `[A] vs [B] ([Category] 2026): [Family closer]`
 */
export function comparisonPageTitle(
  vendorA: string,
  vendorB: string,
  family: SeoFamily,
  personaLabel?: string | null,
  nicheId?: string | null
): string {
  const pair = `${vendorA} vs ${vendorB}`;
  const year = SEO_TITLE_YEAR;
  const category = categoryNoun(family);

  if (personaLabel) {
    const modifier = segmentTitleModifier(nicheId, family);
    return preferIntentTitle([
      `${pair} for ${personaLabel} (${year}): ${modifier}`,
      `${pair} for ${personaLabel}: ${modifier}`,
      `${pair} (${personaLabel} ${year}): ${modifier}`,
      `${pair} for ${personaLabel} (${year})`,
    ]);
  }

  const closer = family ? HUB_TITLE_CLOSERS[family] : `Features, Pricing & Review`;
  return preferIntentTitle([
    `${pair} (${category} ${year}): ${closer}`,
    `${pair} ${year}: ${closer}`,
    `${pair} (${category} ${year})`,
  ]);
}

/**
 * Hub H1: `[A] vs [B]: [Category] Comparison (2026)`
 * Persona H1: `[A] vs [B]: Which [Category] Tool Wins for [Segment]?`
 * Never appends “Comparison & Analysis”. Never copies `<title>` verbatim.
 */
export function comparisonPageHeading(
  vendorA: string,
  vendorB: string,
  family: SeoFamily,
  personaLabel?: string | null
): string {
  const pair = `${vendorA} vs ${vendorB}`;
  if (personaLabel) return `${pair}: Which ${categoryNoun(family)} Tool Wins for ${personaLabel}?`;
  const category = family ? HUB_HEADING_CATEGORY[family] : 'HR Software';
  return `${pair}: ${category} Comparison (2026)`;
}

/**
 * Category hub pattern: `Best [Category Name] Software for [Target Audience] (2026)`
 */
export function categoryHubTitle(categoryName: string, audience: string): string {
  const yearSuffix = `(${SEO_TITLE_YEAR})`;
  const candidates = [
    `Best ${categoryName} Software for ${audience} ${yearSuffix}`,
    `Best ${categoryName} for ${audience} ${yearSuffix}`,
    `Best ${categoryName} Software ${yearSuffix}`,
    `Best ${categoryName} ${yearSuffix}`,
  ];
  return firstInRange(candidates);
}

/** Category hub `<title>` keeps the brand suffix; on-page `<h1>` is the action headline. */
export const ATS_HUB_TITLE = 'Applicant Tracking Systems (ATS) — The HR Stack Guide';
export const ATS_HUB_HEADING = 'Compare Applicant Tracking Systems (ATS)';

export const PAYROLL_HUB_TITLE = 'Global Payroll & EOR Platforms — The HR Stack Guide';
export const PAYROLL_HUB_HEADING = 'Compare Global Payroll & EOR Platforms';

export const PM_HUB_TITLE = 'Performance Management Software — The HR Stack Guide';
export const PM_HUB_HEADING = 'Compare Performance Management Software';

/** H1 keeps the title keyword phrase without the year suffix. */
export function categoryHubHeading(title: string): string {
  return title.replace(new RegExp(`\\s*\\(${SEO_TITLE_YEAR}\\)\\s*$`), '').trim();
}

export function comparisonSeo(
  toolA: { id: string; name: string },
  toolB: { id: string; name: string },
  family: SeoFamily,
  personaLabel?: string | null,
  nicheId?: string | null
): { title: string; heading: string } {
  const nameA = titleVendorName(toolA.id, toolA.name);
  const nameB = titleVendorName(toolB.id, toolB.name);
  const title = comparisonPageTitle(nameA, nameB, family, personaLabel, nicheId);
  let heading = comparisonPageHeading(nameA, nameB, family, personaLabel);
  if (heading === title) {
    heading = personaLabel
      ? `${nameA} vs ${nameB}: Best ${categoryNoun(family)} Fit for ${personaLabel}`
      : `${nameA} vs ${nameB}: ${family ? HUB_HEADING_CATEGORY[family] : 'HR Software'} Side-by-Side`;
  }
  return { title, heading };
}
