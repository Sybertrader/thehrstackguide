import { track } from '@vercel/analytics';

/** Send comparison-page affiliate clicks to Vercel Analytics. */
export function initOutboundAnalytics(): void {
  document.querySelectorAll('.js-affiliate-cta[data-track-vendor], .js-affiliate-cta[data-vendor-name]').forEach((link) => {
    link.addEventListener('click', () => {
      const vendor = link.getAttribute('data-vendor-name') || link.getAttribute('data-track-vendor');
      const location = link.getAttribute('data-cta-location') || link.getAttribute('data-track-location') || 'unknown';
      const url = link.getAttribute('href');
      if (!vendor || !url) return;
      track('Outbound Click', { vendor, location, url });
    });
  });
}
