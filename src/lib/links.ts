/**
 * Single source of truth for the `rel` attribute on outbound CTAs.
 *
 * The rule this encodes, and why it is not simply "external gets nofollow":
 *
 * Vendor CTAs point either straight at a partner's URL or at our own
 * `/go/{id}` redirect (see src/config/affiliates.ts and src/pages/go/[slug].astro).
 * Both are monetized links, so both keep `noopener sponsored nofollow` even
 * though one of them wears an internal path. Cloaking an affiliate link behind our own
 * domain does not change what it is, and `/go/` pages are thin meta-refresh
 * redirectors that would absorb link equity and dead-end it at a partner.
 *
 * Every other internal route — nav, breadcrumbs, related comparisons, legal
 * pages — must come back with no `rel` at all so internal PageRank flows
 * freely. Returning `undefined` makes Astro omit the attribute entirely.
 */

/** Namespace for our own affiliate redirect routes. */
const AFFILIATE_REDIRECT_PREFIX = '/go/';

const SITE_HOST_PATTERN = /^https?:\/\/(www\.)?thehrstackguide\.com(\/|$|\?|#)/i;

/** True for site-relative paths and absolute URLs on our own domain. */
export function isInternalHref(href: string): boolean {
  const value = href.trim();
  if (!value) return false;
  // Protocol-relative URLs (`//example.com`) are external despite the leading slash.
  if (value.startsWith('//')) return false;
  if (value.startsWith('/')) return true;
  return SITE_HOST_PATTERN.test(value);
}

/** True for our affiliate redirect routes (`/go/` and absolute /go/ URLs). */
export function isAffiliateRedirect(href: string): boolean {
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith(AFFILIATE_REDIRECT_PREFIX)) return true;
  try {
    const url = new URL(value, 'https://www.thehrstackguide.com');
    return url.pathname === '/go' || url.pathname.startsWith('/go/');
  } catch {
    return false;
  }
}

/**
 * Returns the `rel` for a vendor CTA, or `undefined` when the link is an
 * ordinary internal route that should pass link equity.
 *
 * `/go/` and off-site http(s) URLs get `noopener sponsored nofollow`.
 * Same-host paths (nav, comparisons, hubs) omit `rel` entirely.
 */
export const VENDOR_OUTBOUND_REL = 'noopener sponsored nofollow';

export function outboundRel(href: string): string | undefined {
  if (isAffiliateRedirect(href) || !isInternalHref(href)) {
    return VENDOR_OUTBOUND_REL;
  }
  return undefined;
}
