/**
 * Single source of truth for the `rel` attribute on vendor CTAs.
 *
 * `/go/{id}/` affiliate redirects: `noopener sponsored`.
 * Off-site vendor destinations: `noopener sponsored nofollow`.
 * Other same-host hrefs omit `rel`.
 */

/** Namespace for our own affiliate redirect routes. Always trailing-slash. */
const AFFILIATE_REDIRECT_PREFIX = '/go/';

const SITE_HOST_PATTERN = /^https?:\/\/(www\.)?thehrstackguide\.com(\/|$|\?|#)/i;
const GO_VENDOR_PATH = /^\/go\/[A-Za-z0-9-]+\/?$/;

/**
 * Canonical cloaked affiliate path. Always `/go/{id}/` so it matches
 * `trailingSlash: 'always'` and Vercel `trailingSlash: true`.
 */
export function affiliateGoHref(toolId: string): string {
  const slug = toolId
    .trim()
    .toLowerCase()
    .replace(/^\/go\//, '')
    .replace(/^\/+|\/+$/g, '');
  return `${AFFILIATE_REDIRECT_PREFIX}${slug}/`;
}

/**
 * Force a trailing slash on `/go/[vendor]` hrefs (relative or same-host
 * absolute). Every other URL is returned unchanged.
 */
export function ensureAffiliateGoTrailingSlash(href: string): string {
  const value = href.trim();
  if (!value) return href;

  const relative = value.match(/^(\/go\/[A-Za-z0-9-]+)\/?(\?[^#]*)?(#.*)?$/i);
  if (relative) {
    return `${relative[1].toLowerCase()}/${relative[2] ?? ''}${relative[3] ?? ''}`;
  }

  try {
    const url = new URL(value);
    if (!GO_VENDOR_PATH.test(url.pathname)) return value;
    if (!url.pathname.endsWith('/')) url.pathname = `${url.pathname}/`;
    return url.toString();
  } catch {
    return value;
  }
}

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
 * Returns the `rel` for a vendor CTA, or `undefined` when the href is
 * same-host and not an affiliate redirect.
 *
 * `/go/{id}/` → `noopener sponsored`. Off-site http(s) URLs get
 * `noopener sponsored nofollow`.
 */
export const VENDOR_OUTBOUND_REL = 'noopener sponsored nofollow';
export const AFFILIATE_GO_REL = 'noopener sponsored';

export function outboundRel(href: string): string | undefined {
  if (!href.trim()) return undefined;
  if (isAffiliateRedirect(href)) return AFFILIATE_GO_REL;
  if (isInternalHref(href)) return undefined;
  return VENDOR_OUTBOUND_REL;
}
