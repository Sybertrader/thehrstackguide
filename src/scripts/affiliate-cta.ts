type Gtag = (...args: unknown[]) => void;

/** Track vendor CTA clicks and download the scorecard on lead-magnet buttons. */
export function initAffiliateCta(): void {
  document.body.addEventListener('click', (event) => {
    const raw = event.target;
    const target = raw instanceof Element ? raw : raw instanceof Node ? raw.parentElement : null;
    if (!target) return;
    const cta = target.closest('.js-affiliate-cta');
    if (!(cta instanceof HTMLElement)) return;

    const gtag = (window as Window & { gtag?: Gtag }).gtag;
    if (typeof gtag === 'function') {
      const vendorId = cta.getAttribute('data-vendor-id') || '';
      const vendorName = cta.getAttribute('data-vendor-name') || cta.getAttribute('data-track-vendor') || '';
      const ctaLocation = cta.getAttribute('data-cta-location') || cta.getAttribute('data-track-location') || '';
      if (vendorName && ctaLocation) {
        gtag('event', 'vendor_cta_click', {
          vendor_id: vendorId,
          vendor_name: vendorName,
          cta_location: ctaLocation,
          destination_type: cta.getAttribute('data-destination-type') || '',
          link_url: cta.getAttribute('href') || '',
          page_location: window.location.pathname,
        });
      }
    }

    if (cta.getAttribute('data-lead-magnet') !== 'true') return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof event.button === 'number' && event.button !== 0) return;

    const source = document.getElementById('js-scorecard-download');
    const link = document.createElement('a');
    link.href = source?.getAttribute('href') || '/assets/hr-software-vendor-scorecard.docx';
    link.download = source?.getAttribute('download') || 'hr-software-vendor-scorecard.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (cta.hasAttribute('data-modal-target')) return;

    const affiliateUrl = cta.getAttribute('href');
    if (!affiliateUrl) return;
    event.preventDefault();
    window.open(affiliateUrl, '_blank', 'noopener');
  });
}
