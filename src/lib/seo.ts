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

/** Longer-first closers so short pairs still land in the 50–60 character title band. */
const PERSONA_GUIDE_LABELS: Record<Exclude<SeoFamily, null>, string[]> = {
  payroll: ['Payroll & EOR Guide', 'Global Payroll Guide', 'Payroll Guide', 'EOR Guide', 'Guide'],
  ats: ['ATS Hiring Guide', 'Recruiting Guide', 'ATS Guide', 'Hiring Guide', 'Guide'],
  pm: ['Performance Guide', 'Perf Mgmt Guide', 'PM Guide', 'HR Guide', 'Guide'],
};

function firstInRange(candidates: string[]): string {
  const inRange = candidates.filter((title) => title.length >= SEO_TITLE_MIN && title.length <= SEO_TITLE_MAX);
  if (inRange.length > 0) return inRange[0];
  return candidates.reduce((best, title) =>
    Math.abs(title.length - 55) < Math.abs(best.length - 55) ? title : best
  );
}

/**
 * 1-vs-1 hub: `[Vendor A] vs [Vendor B] (2026): [Category] Comparison`
 * Persona child: `[Vendor A] vs [Vendor B] for [Segment] (2026): [Category] Guide`
 */
export function comparisonPageTitle(
  vendorA: string,
  vendorB: string,
  family: SeoFamily,
  personaLabel?: string | null
): string {
  const pair = `${vendorA} vs ${vendorB}`;
  const year = `(${SEO_TITLE_YEAR})`;

  if (personaLabel) {
    const segment = `for ${personaLabel}`;
    const labels = family ? PERSONA_GUIDE_LABELS[family] : ['Guide'];
    const candidates = [
      ...labels.map((label) => `${pair} ${segment} ${year}: ${label}`),
      `${pair} ${segment} ${year} Guide`,
      `${pair} ${segment} ${year}`,
    ];
    return firstInRange(candidates);
  }

  const labels = family ? COMPARISON_CATEGORY_LABELS[family] : ['HR', 'Software'];
  const candidates = [
    ...labels.map((label) => `${pair} ${year}: ${label} Comparison`),
    `${pair} ${year} Comparison`,
  ];
  return firstInRange(candidates);
}

/**
 * Hub H1: `[A] vs [B] Comparison & Analysis`
 * Persona H1: `[A] vs [B] for [Segment]: Comparison & Analysis`
 * Uses the same vendor names (and persona phrase) as `<title>`.
 */
export function comparisonPageHeading(
  vendorA: string,
  vendorB: string,
  personaLabel?: string | null
): string {
  const pair = `${vendorA} vs ${vendorB}`;
  if (personaLabel) return `${pair} for ${personaLabel}: Comparison & Analysis`;
  return `${pair} Comparison & Analysis`;
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
  family: SeoFamily,
  personaLabel?: string | null
): { title: string; heading: string } {
  const nameA = titleVendorName(toolA.id, toolA.name);
  const nameB = titleVendorName(toolB.id, toolB.name);
  return {
    title: comparisonPageTitle(nameA, nameB, family, personaLabel),
    heading: comparisonPageHeading(nameA, nameB, personaLabel),
  };
}
