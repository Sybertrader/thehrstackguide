/**
 * Programmatic `<title>` and `<h1>` strings for comparison and category routes.
 * Titles are clamped to 50–60 characters to avoid SERP truncation.
 */

export const SEO_TITLE_YEAR = 2026;
export const SEO_TITLE_MIN = 50;
export const SEO_TITLE_MAX = 60;

export type SeoFamily = 'payroll' | 'ats' | 'pm' | null;

/** Shorter names used in `<title>` and H1 when the full brand would overflow. */
const TITLE_NAME_BY_ID: Record<string, string> = {
  'payoneer-workforce-management': 'Payoneer',
  papaya: 'Papaya',
  oyster: 'Oyster',
  'breezy-hr': 'Breezy',
  'bamboohr-ats': 'BambooHR',
};

export function titleVendorName(toolId: string, displayName: string): string {
  return TITLE_NAME_BY_ID[toolId] ?? displayName;
}

const COMPARISON_CATEGORY_LABELS: Record<Exclude<SeoFamily, null>, string[]> = {
  payroll: ['HRIS & Payroll', 'Payroll & EOR', 'Global EOR & Payroll', 'Global Payroll', 'EOR', 'Payroll'],
  ats: ['ATS Hiring Software', 'Recruiting Software', 'ATS & Hiring', 'ATS', 'Hiring', 'Recruiting'],
  pm: ['Performance Mgmt', 'Performance', 'HR', 'PM'],
};

function firstInRange(candidates: string[]): string {
  const inRange = candidates.filter((title) => title.length >= SEO_TITLE_MIN && title.length <= SEO_TITLE_MAX);
  if (inRange.length > 0) return inRange[0];
  return candidates.reduce((best, title) =>
    Math.abs(title.length - 55) < Math.abs(best.length - 55) ? title : best
  );
}

/**
 * 1-vs-1 pattern: `[Vendor A] vs [Vendor B] (2026): [Category] Comparison`
 */
export function comparisonPageTitle(vendorA: string, vendorB: string, family: SeoFamily): string {
  const labels = family ? COMPARISON_CATEGORY_LABELS[family] : ['HR', 'Software'];
  const candidates = [
    ...labels.map((label) => `${vendorA} vs ${vendorB} (${SEO_TITLE_YEAR}): ${label} Comparison`),
    `${vendorA} vs ${vendorB} (${SEO_TITLE_YEAR}) Comparison`,
  ];
  return firstInRange(candidates);
}

/** Exact-match H1 for 1-vs-1 pages. Uses the same vendor names as `<title>`. */
export function comparisonPageHeading(vendorA: string, vendorB: string): string {
  return `${vendorA} vs ${vendorB} Comparison & Analysis`;
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

/** H1 keeps the title keyword phrase without the year suffix. */
export function categoryHubHeading(title: string): string {
  return title.replace(new RegExp(`\\s*\\(${SEO_TITLE_YEAR}\\)\\s*$`), '').trim();
}

export function comparisonSeo(
  toolA: { id: string; name: string },
  toolB: { id: string; name: string },
  family: SeoFamily
): { title: string; heading: string } {
  const nameA = titleVendorName(toolA.id, toolA.name);
  const nameB = titleVendorName(toolB.id, toolB.name);
  return {
    title: comparisonPageTitle(nameA, nameB, family),
    heading: comparisonPageHeading(nameA, nameB),
  };
}
