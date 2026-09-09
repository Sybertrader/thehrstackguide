/**
 * Outbound vendor destinations and GA4 click payloads.
 *
 * Priority:
 *  1. Active affiliate URL (cloaked through `/go/{id}/` when registered in
 *     src/config/affiliates.ts, otherwise the profile `affiliate_url`).
 *  2. `https://{domain}/?utm_source=hrstackguide.com&utm_medium=referral`
 *     when no active affiliate URL exists.
 */
import { affiliateLinks } from '../config/affiliates';
import { getToolProfile, isLiveVendorId, type ToolProfile } from './tools';
import { affiliateGoHref, isAffiliateRedirect } from './links';

export { VENDOR_OUTBOUND_REL, outboundRel, affiliateGoHref, ensureAffiliateGoTrailingSlash, isAffiliateRedirect } from './links';
export const UTM_SOURCE = 'hrstackguide.com';
export const UTM_MEDIUM = 'referral';

/** Non-affiliate vendors whose CTAs open the lead modal (not an outbound URL). */
export const NON_AFFILIATE_LEAD_BRANDS = [
  'plane',
  'rippling',
  'greenhouse',
  'workable',
  '15five',
  'leapsome',
  'peoplefluent',
  'clearcompany',
  'oyster-hr',
] as const;

/** Brands that open the lead-capture modal instead of an outbound URL. */
export const MANUAL_LEAD_BRANDS = [
  'lever',
  'jazzhr',
  'culture-amp',
  'performyard',
  ...NON_AFFILIATE_LEAD_BRANDS,
] as const;

export const LEAD_MODAL_CTA_LABEL = 'Request Demo & Pricing';

export function isNonAffiliateLeadBrand(toolId: string): boolean {
  const id = toolId.toLowerCase().trim();
  return (NON_AFFILIATE_LEAD_BRANDS as readonly string[]).includes(id);
}

/** Button copy: request-demo for the 9 non-affiliate vendors, otherwise “Try {name}”. */
export function vendorCtaLabel(toolId: string, vendorName: string): string {
  if (isManualLeadBrand(toolId) && isNonAffiliateLeadBrand(toolId)) {
    return LEAD_MODAL_CTA_LABEL;
  }
  return `Try ${vendorName}`;
}

export function vendorLeadModalHeading(vendorName: string): string {
  return `Request ${vendorName} Pricing & Demo`;
}

/**
 * First-party marketing domains used to build the UTM fallback. Affiliate
 * network hosts (Impact, partnerlinks, etc.) are never used as the fallback.
 * Keys must match live `src/data/tools.json` vendor ids.
 */
export const VENDOR_DOMAINS: Record<string, string> = {
  '15five': '15five.com',
  ashby: 'ashbyhq.com',
  'bamboohr-ats': 'bamboohr.com',
  'breezy-hr': 'breezyhr.com',
  clearcompany: 'clearcompany.com',
  'culture-amp': 'cultureamp.com',
  deel: 'deel.com',
  greenhouse: 'greenhouse.io',
  gusto: 'gusto.com',
  jazzhr: 'jazzhr.com',
  lattice: 'lattice.com',
  leapsome: 'leapsome.com',
  lever: 'lever.co',
  multiplier: 'usemultiplier.com',
  'oyster-hr': 'oysterhr.com',
  'papaya-global': 'papayaglobal.com',
  'payoneer-workforce-management': 'payoneer.com',
  performyard: 'performyard.com',
  plane: 'plane.com',
  recruitee: 'recruitee.com',
  peoplefluent: 'peoplefluent.com',
  remote: 'remote.com',
  rippling: 'rippling.com',
  workable: 'workable.com',
};

const AFFILIATE_HOST_MARKERS = [
  'partnerlinks.io',
  'pxf.io',
  'sjv.io',
  'impact.com',
  'get.deel.com',
  'get.gusto.com',
  'get.papayaglobal.com',
  'join.tellent.com',
  'sales.ashbyhq.com',
];

export function isManualLeadBrand(toolId: string): boolean {
  const id = toolId.toLowerCase().trim();
  return (MANUAL_LEAD_BRANDS as readonly string[]).includes(id) && isLiveVendorId(id);
}

/** Must match ManualLeadModal default `modalId` (spaces become hyphens). */
export function manualLeadModalId(brandName: string): string {
  return `lead-modal-${brandName.toLowerCase().replace(/\s+/g, '-')}`;
}

export function normalizeVendorDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]
    .toLowerCase();
}

function hostFromUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (!host) return null;
    if (AFFILIATE_HOST_MARKERS.some((marker) => host === marker || host.endsWith(`.${marker}`) || host.includes(marker))) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

export function referralFallbackUrl(domain: string): string {
  const host = normalizeVendorDomain(domain);
  return `https://${host}/?utm_source=${UTM_SOURCE}&utm_medium=${UTM_MEDIUM}`;
}

function registeredAffiliateUrl(toolId: string): string | undefined {
  const id = toolId.trim().toLowerCase();
  if (!isLiveVendorId(id)) return undefined;
  return affiliateLinks[id]?.trim();
}

function isActiveAffiliateUrl(profile: ToolProfile | null, toolId: string): string | null {
  const registered = registeredAffiliateUrl(toolId);
  if (registered) return registered;

  if (!profile?.affiliate_url?.trim()) return null;
  if (profile.has_active_affiliate === false) return null;
  if (profile.has_active_affiliate === true) return profile.affiliate_url.trim();
  return null;
}

export function resolveVendorDomain(toolId: string, csvFallbackUrl = ''): string {
  const profile = getToolProfile(toolId);
  if (profile?.domain?.trim()) return normalizeVendorDomain(profile.domain);
  if (isLiveVendorId(toolId) && VENDOR_DOMAINS[toolId]) return VENDOR_DOMAINS[toolId];
  return hostFromUrl(profile?.website) ?? hostFromUrl(csvFallbackUrl) ?? normalizeVendorDomain(toolId);
}

/**
 * Public href for a vendor CTA. Registered affiliates stay on `/go/{id}/`
 * so destination URLs can be rotated in one place. Everyone else gets the
 * first-party domain with default referral UTMs.
 */
export function resolveVendorOutboundHref(toolId: string, csvFallbackUrl = ''): string {
  if (registeredAffiliateUrl(toolId)) return affiliateGoHref(toolId);

  const profile = getToolProfile(toolId);
  const active = isActiveAffiliateUrl(profile, toolId);
  if (active) return active;

  return referralFallbackUrl(resolveVendorDomain(toolId, csvFallbackUrl));
}

export type VendorCtaDestination = 'lead_modal' | 'go_redirect' | 'direct_outbound';

export function vendorCtaDestinationType(href: string, opensModal = false): VendorCtaDestination {
  if (opensModal) return 'lead_modal';
  if (isAffiliateRedirect(href)) return 'go_redirect';
  return 'direct_outbound';
}

/** Inline `onclick` body for the unified GA4 `vendor_cta_click` event. */
export function vendorCtaOnclick(vendorId: string, destinationType: VendorCtaDestination): string {
  return `if(typeof window.gtag==='function'){window.gtag('event','vendor_cta_click',{'vendor_id':${JSON.stringify(vendorId)},'destination_type':${JSON.stringify(destinationType)},'page_location':window.location.pathname});}`;
}

/** Inline `onclick` for outbound affiliate / UTM CTAs. */
export function vendorOutboundOnclick(vendorId: string, destinationType: VendorCtaDestination = 'direct_outbound'): string {
  return vendorCtaOnclick(vendorId, destinationType);
}

/** Inline `onclick` for lead-capture CTAs that open the intro modal. */
export function vendorLeadModalOnclick(vendorId: string): string {
  return vendorCtaOnclick(vendorId, 'lead_modal');
}
