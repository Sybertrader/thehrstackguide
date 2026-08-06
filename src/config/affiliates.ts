/**
 * Centralized affiliate link registry. Every outbound "Try [Vendor]" link on
 * the site should route through `/go/{slug}` rather than linking straight to
 * a vendor's affiliate URL, so tracking links can be swapped, audited, or
 * rotated here in one place without touching comparison content.
 */
export const affiliateLinks: Record<string, string> = {
  remote: 'https://remote.sjv.io/zzBbrG',
  'bamboohr-ats': 'https://www.bamboohr.com/?eid=fopydE',
  multiplier: 'https://multipliertechnologiespteltd.pxf.io/B51kg9',
  recruitee: 'https://join.tellent.com/t5yy8cn4dn30',
  // Placeholder structure for future approved partners:
  // deel: 'https://...',
  // rippling: 'https://...',
  // ashby: 'https://...',
};
