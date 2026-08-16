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
  lattice:
    'https://lattice.com/demo?utm_source=The-HR-Stack-Guide&utm_medium=partner&utm_campaign=referral',
  'breezy-hr': 'https://breezyhr.partnerlinks.io/ahid34bxoa2w',
  // Placeholder structure for future approved partners:
  // deel: 'https://...',
  // rippling: 'https://...',
  ashby: 'https://sales.ashbyhq.com/e3t/Ctc/ZS+23284/cBJBm04/JkM2-6qcW6N1vHY6lZ3mkW283TQP4fr7wyW6M3Npt32m2fCW5HY42F91hdSKW5t0fHG2XX5S7W4gJwNw67R7sPW3kvMT-8GspMgW7RW_g99b9mgSW2jPPkR2x_DsCW47RXnR2Qhl9vW8gwvkK3gmcb6N4LMlMCzNtcBW4GM8F-5pTrnVW7yr-bK1fNmC_W6JQbzv4jP30lW7dL6Ss7zBrFfW2nYrwS3y06xKVFgGhB3Ww2jMW1QVyyh28-rRcVH2fYl3CF-NrW8Np9nf1dQk1JW5Sdw8f3M2SbbW6ZPHxr7LhjWKf9cgtZv04',
  
};
