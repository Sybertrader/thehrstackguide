/**
 * Centralized affiliate link registry. Every outbound "Try [Vendor]" link on
 * the site should route through `/go/{slug}` rather than linking straight to
 * a vendor's affiliate URL, so tracking links can be swapped, audited, or
 * rotated here in one place without touching comparison content.
 */
export const affiliateLinks: Record<string, string> = {
  remote: 'https://remote.sjv.io/zzBbrG',
  // Placeholder structure for future approved partners:
  // deel: 'https://...',
  // rippling: 'https://...',
  // ashby: 'https://...',
};
