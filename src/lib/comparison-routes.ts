/**
 * Isolates B2B HR comparison URLs from operational pages.
 *
 * Astro already prefers static files (`about.astro`, `recommendation.astro`,
 * `go/[slug].astro`, category hubs) over a rest-parameter catch-all. This
 * module is the second lock: `getStaticPaths` must never emit a path that
 * collides with those routes or with Vercel `/api/*` lead-capture endpoints.
 */

/**
 * First path segments owned by static pages, nested hubs, affiliate
 * redirects, or serverless APIs. A comparison slug whose first segment
 * matches any of these is rejected even if it otherwise looks like `a-vs-b`.
 */
export const RESERVED_ROUTE_SEGMENTS = [
  'about',
  'affiliate-disclosure',
  'api',
  'applicant-tracking-systems',
  'contact',
  'global-payroll-eor',
  'go',
  'how-to-build-an-hr-tech-stack',
  'methodology',
  'performance-management',
  'privacy-policy',
  'recommendation',
  'terms',
  'thank-you',
] as const;

export type ReservedRouteSegment = (typeof RESERVED_ROUTE_SEGMENTS)[number];

/**
 * `brand-a-vs-brand-b` or `brand-a-vs-brand-b-for-modifier`.
 * Brand tokens may themselves contain hyphens (`breezy-hr`, `culture-amp`).
 */
export const COMPARISON_SLUG_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*(?:-for-[a-z0-9]+(?:-[a-z0-9]+)*)?$/;

const RESERVED_SEGMENT_SET = new Set<string>(RESERVED_ROUTE_SEGMENTS);

/**
 * Normalize a catch-all param (`string` or `string[]` depending on Astro
 * version / rest-parameter shape) into a single-segment slug, or null if the
 * path is nested / empty and therefore not a comparison route.
 */
export function normalizeCatchAllSlug(slug: string | string[] | undefined): string | null {
  if (slug == null) return null;
  const joined = Array.isArray(slug) ? slug.filter(Boolean).join('/') : slug.trim();
  if (!joined || joined.includes('/')) return null;
  return joined;
}

export function isReservedRouteSegment(segment: string): boolean {
  return RESERVED_SEGMENT_SET.has(segment);
}

/**
 * True only for 1-on-1 comparison slugs that will not steal operational
 * routes (recommendation, contact, about, thank-you, /go/*, /api/*).
 */
export function isComparisonRouteSlug(slug: string): boolean {
  if (!COMPARISON_SLUG_PATTERN.test(slug)) return false;
  const firstSegment = slug.split('/')[0] ?? '';
  return !isReservedRouteSegment(firstSegment);
}

/**
 * Split `brand-a-vs-brand-b` from an optional `-for-{modifier}` suffix.
 * Tool ids never contain `-for-`, so the first `-for-` after `-vs-` is the
 * modifier boundary (`deel-vs-remote-for-us-latam` → hub `deel-vs-remote`).
 */
export function parseComparisonSlug(slug: string): { hubSlug: string; modifier: string | null } {
  const vsIndex = slug.indexOf('-vs-');
  if (vsIndex === -1) return { hubSlug: slug, modifier: null };

  const afterVs = slug.slice(vsIndex + 4);
  const forIndex = afterVs.indexOf('-for-');
  if (forIndex === -1) return { hubSlug: slug, modifier: null };

  const toolA = slug.slice(0, vsIndex);
  const toolB = afterVs.slice(0, forIndex);
  const modifier = afterVs.slice(forIndex + 5);
  return { hubSlug: `${toolA}-vs-${toolB}`, modifier: modifier || null };
}

export function comparisonHubSlug(toolAId: string, toolBId: string): string {
  return `${toolAId}-vs-${toolBId}`;
}

/** True for pruned payroll slugs that 301 to the pair's master hub. */
export function isLegacyTechStartupsSlug(slug: string): boolean {
  return slug.endsWith('-for-tech-startups');
}
