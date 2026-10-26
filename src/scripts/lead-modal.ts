/**
 * One lead-capture dialog per page. Buttons identify the vendor with
 * data-vendor-id / data-vendor-name / data-vendor-url; this module copies
 * those onto the singleton modal when it opens.
 */

const LEAD_MODAL_ID = 'lead-modal';

const BLOCKED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];

const PERFORMYARD_ZAPIER_WEBHOOK = 'https://hooks.zapier.com/hooks/catch/17923801/46vtmid/';
const PERFORMYARD_REDIRECT_URL = 'https://www.performyard.com/';

// Client-side Web3Forms (same payload as Lever / JazzHR / Culture Amp).
// PerformYard is also listed so it can send the email after Zapier.
// Remaining non-affiliate vendors use this path too, then POST /api/leads
// and redirect. Zapier stays gated on vendorId === 'performyard'.
const EMAIL_SEND_VENDORS = ['lever', 'jazzhr', 'culture-amp', 'performyard', 'workable'];
const REQUEST_DEMO_VENDORS = ['workable'];
const NON_AFFILIATE_HOME_URLS: Record<string, string> = {
  workable: 'https://www.workable.com',
};
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

declare global {
  interface Window {
    __leadModalScriptInitialized?: boolean;
  }
}

function trackGenerateLead(vendorId: string) {
  if (typeof window.gtag === 'function' && vendorId) {
    window.gtag('event', 'generate_lead', {
      vendor_id: vendorId,
      page_location: window.location.pathname,
    });
  }
}

/**
 * Web3Forms supports browser-side posting, so this is a normal CORS fetch
 * the caller can await. Pass keepalive when a redirect follows immediately,
 * otherwise the navigation cancels the request.
 */
function sendWeb3FormsEmail(payload: Record<string, string>, keepalive: boolean) {
  return fetch(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    keepalive,
  });
}

/** Plain object of every named field on the submitted modal form. */
function payloadFromForm(formElement: HTMLFormElement): Record<string, string> {
  const formData = new FormData(formElement);
  const entries = Object.fromEntries(formData.entries());
  const payload: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    payload[key] = typeof value === 'string' ? value : '';
  }
  return payload;
}

function splitFullName(value: string) {
  const parts = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function partnerUrlFor(modal: HTMLElement, vendorId: string, fromButton: string): string {
  if (fromButton) return fromButton;
  if (!vendorId) return '';
  const raw = modal.getAttribute('data-partner-urls');
  if (!raw) return '';
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[vendorId] || '';
  } catch {
    return '';
  }
}

function clearFieldErrors(form: HTMLFormElement) {
  form.querySelectorAll('.fullname-error, .email-error, .timeline-error').forEach((el) => {
    el.classList.add('hidden');
  });
  form.querySelectorAll('.border-red-500').forEach((el) => {
    el.classList.remove('border-red-500');
  });
  const submitBtn = form.querySelector<HTMLButtonElement>('.submit-btn');
  const btnText = form.querySelector('.btn-text');
  const spinner = form.querySelector('.spinner');
  if (submitBtn) submitBtn.disabled = false;
  btnText?.classList.remove('hidden');
  spinner?.classList.add('hidden');
}

function applyClickedVendorToModal(
  modal: HTMLElement,
  vendorId: string,
  vendorName: string,
  vendorUrl: string,
  partnerLandingUrl: string,
) {
  const previousVendor = (modal.getAttribute('data-vendor-id') || '').toLowerCase();
  const nextVendor = vendorId.toLowerCase();
  const form = modal.querySelector('form');
  const successMessage = modal.querySelector('.success-message');

  if (form instanceof HTMLFormElement && nextVendor && previousVendor && nextVendor !== previousVendor) {
    form.reset();
    clearFieldErrors(form);
  }

  if (vendorId) {
    modal.setAttribute('data-vendor-id', vendorId);
    const vendorInput = modal.querySelector('input[name="vendorId"]');
    if (vendorInput instanceof HTMLInputElement) vendorInput.value = vendorId;
  }
  if (vendorName) {
    modal.setAttribute('data-brand-name', vendorName);
    const brandInput = modal.querySelector('input[name="brandName"]');
    const targetInput = modal.querySelector('input[name="target_software"]');
    if (brandInput instanceof HTMLInputElement) brandInput.value = vendorName;
    if (targetInput instanceof HTMLInputElement) targetInput.value = vendorName;
    modal.querySelectorAll('.lead-modal-brand').forEach((el) => {
      el.textContent = vendorName;
    });
    const heading = modal.querySelector('.lead-modal-heading');
    if (heading) heading.textContent = `Get Custom ${vendorName} Pricing`;
  }

  const resolvedUrl = vendorUrl || NON_AFFILIATE_HOME_URLS[nextVendor] || '';
  if (resolvedUrl) modal.setAttribute('data-vendor-url', resolvedUrl);
  else modal.removeAttribute('data-vendor-url');

  modal.setAttribute('data-partner-landing-url', partnerLandingUrl);
  const partnerInput = modal.querySelector('input[name="partnerLandingUrl"]');
  if (partnerInput instanceof HTMLInputElement) partnerInput.value = partnerLandingUrl;

  if (form) form.classList.remove('hidden');
  if (successMessage) successMessage.classList.add('hidden');
}

function resolveModal(openBtn: Element, clickedVendorName: string): HTMLElement | null {
  let modalId = openBtn.getAttribute('data-modal-target');
  if (!modalId && clickedVendorName) {
    modalId = `lead-modal-${clickedVendorName.toLowerCase().replace(/\s+/g, '-')}`;
  }
  if (!modalId) {
    const label = (openBtn.getAttribute('aria-label') || openBtn.textContent || '').toLowerCase();
    if (label.includes('lever')) modalId = 'lead-modal-lever';
    else if (label.includes('jazzhr')) modalId = 'lead-modal-jazzhr';
    else if (label.includes('culture amp')) modalId = 'lead-modal-culture-amp';
    else if (label.includes('performyard')) modalId = 'lead-modal-performyard';
  }

  const explicit = modalId ? document.getElementById(modalId) : null;
  const modal = explicit ?? document.getElementById(LEAD_MODAL_ID);
  return modal instanceof HTMLElement ? modal : null;
}

function onDocumentClick(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const openBtn = target.closest('[data-modal-target], .open-modal-btn, .open-lead-modal');
  const closeBtn = target.closest('.close-modal-btn');

  if (openBtn) {
    const clickedVendorId = (openBtn.getAttribute('data-vendor-id') || '').toLowerCase().trim();
    const clickedVendorName = (openBtn.getAttribute('data-vendor-name') || '').trim();
    const clickedVendorUrl = (openBtn.getAttribute('data-vendor-url') || '').trim();
    const clickedPartnerUrl = (openBtn.getAttribute('data-partner-landing-url') || '').trim();
    const modal = resolveModal(openBtn, clickedVendorName);

    if (modal) {
      event.preventDefault();
      // Teleport to body so fixed positioning is never trapped by
      // ancestor overflow/transform stacking contexts.
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
      applyClickedVendorToModal(
        modal,
        clickedVendorId,
        clickedVendorName,
        clickedVendorUrl,
        partnerUrlFor(modal, clickedVendorId, clickedPartnerUrl),
      );
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    return;
  }

  if (closeBtn) {
    const activeModal = closeBtn.closest('.modal-backdrop');
    if (activeModal) {
      activeModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
    return;
  }

  if (target.classList.contains('modal-backdrop')) {
    target.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

async function onDocumentSubmit(event: Event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-lead-form')) return;

  event.preventDefault();

  const emailInput = form.querySelector('.work-email-input');
  const emailError = form.querySelector('.email-error');
  const fullNameInput = form.querySelector('.full-name-input');
  const fullNameError = form.querySelector('.fullname-error');
  const timelineSelect = form.querySelector('.timeline-select');
  const timelineError = form.querySelector('.timeline-error');
  const submitBtn = form.querySelector<HTMLButtonElement>('.submit-btn');
  const btnText = form.querySelector('.btn-text');
  const spinner = form.querySelector('.spinner');
  const successMessage = form.closest('.p-6')?.querySelector('.success-message') ?? null;
  const backdrop = form.closest('.modal-backdrop');

  const fullName =
    fullNameInput instanceof HTMLInputElement
      ? String(fullNameInput.value || '')
          .replace(/\s+/g, ' ')
          .trim()
      : '';
  if (fullNameInput instanceof HTMLInputElement) fullNameInput.value = fullName;
  if (!fullName || fullName.length < 2) {
    fullNameError?.classList.remove('hidden');
    if (fullNameInput instanceof HTMLInputElement) {
      fullNameInput.classList.add('border-red-500');
      fullNameInput.focus();
    }
    return;
  }
  fullNameError?.classList.add('hidden');
  if (fullNameInput instanceof HTMLInputElement) fullNameInput.classList.remove('border-red-500');

  const timeline = timelineSelect instanceof HTMLSelectElement ? String(timelineSelect.value || '').trim() : '';
  if (!timeline) {
    timelineError?.classList.remove('hidden');
    if (timelineSelect instanceof HTMLSelectElement) {
      timelineSelect.classList.add('border-red-500');
      timelineSelect.focus();
    }
    return;
  }
  timelineError?.classList.add('hidden');
  if (timelineSelect instanceof HTMLSelectElement) timelineSelect.classList.remove('border-red-500');

  if (emailInput instanceof HTMLInputElement) {
    const emailValue = emailInput.value.toLowerCase().trim();
    const domain = emailValue.split('@')[1];

    if (domain && BLOCKED_DOMAINS.includes(domain)) {
      emailError?.classList.remove('hidden');
      emailInput.classList.add('border-red-500');
      return;
    }
    emailError?.classList.add('hidden');
    emailInput.classList.remove('border-red-500');
  }

  if (submitBtn) submitBtn.disabled = true;
  btnText?.classList.add('hidden');
  spinner?.classList.remove('hidden');

  const fields = payloadFromForm(form);
  const fullNameValue = String(fields.fullName || fullName || '')
    .replace(/\s+/g, ' ')
    .trim();
  const nameParts = splitFullName(fullNameValue);
  const firstName = nameParts.firstName;
  const lastName = nameParts.lastName;
  const vendorId = String(fields.vendorId || backdrop?.getAttribute('data-vendor-id') || '').trim();
  const vendor = vendorId.toLowerCase();

  if (EMAIL_SEND_VENDORS.includes(vendor)) {
    const accessKey = form.dataset.accessKey || '';
    if (!accessKey) {
      console.error('Web3Forms access key missing - set PUBLIC_WEB3FORMS_KEY. Lead will not be emailed.');
    }

    const company = String(fields.company || '').trim();
    const emailPayload: Record<string, string> = {
      access_key: accessKey,
      subject: `New Lead: ${vendor.toUpperCase()} - ${company}`,
      from_name: 'The HR Stack Guide',
      firstName,
      lastName,
      fullName: fullNameValue,
      email: String(fields.email || '').trim(),
      company,
      jobTitle: String(fields.jobTitle || '').trim(),
      employeeCount: String(fields.employeeCount || '').trim(),
      region: String(fields.region || '').trim(),
      phone: String(fields.phone || '').trim(),
      requirements: String(fields.requirements || '').trim(),
      vendor,
    };

    // PerformYard only: Zapier Catch Hook. Other modal vendors never enter.
    if (vendor === 'performyard') {
      const rawData = payloadFromForm(form);
      const {
        vendorId: _vendorId,
        target_software: _targetSoftware,
        partnerLandingUrl: _partnerLandingUrl,
        brandName: _brandName,
        ...cleanPayload
      } = rawData;
      console.log('PerformYard Zapier payload', cleanPayload);

      try {
        await fetch(PERFORMYARD_ZAPIER_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            ...cleanPayload,
            firstName,
            lastName,
            fullName: fullNameValue,
          }),
        });

        sendWeb3FormsEmail(emailPayload, true).catch((err) => {
          console.error('Web3Forms notification failed', err);
        });
        trackGenerateLead(vendor);
      } catch (zapErr) {
        console.error('PerformYard Zapier webhook failed', zapErr);
      } finally {
        if (backdrop) {
          backdrop.classList.add('hidden');
          document.body.style.overflow = '';
        }
        window.location.href = PERFORMYARD_REDIRECT_URL;
      }
      return;
    }

    const isNonAffiliateLead = REQUEST_DEMO_VENDORS.includes(vendor);
    const targetVendorUrl = backdrop?.getAttribute('data-vendor-url') || NON_AFFILIATE_HOME_URLS[vendor] || '';

    // Lever / JazzHR / Culture Amp / the nine non-affiliate vendors:
    // identical Web3Forms payload. Non-affiliate leads then log to
    // /api/leads and redirect; the original three stay on the success UI.
    try {
      const emailResponse = await sendWeb3FormsEmail(emailPayload, isNonAffiliateLead);
      if (!emailResponse.ok) {
        console.error('Web3Forms notification rejected', emailResponse.status);
      }
    } catch (err) {
      // Deliberately swallowed: a delivery problem must not block the
      // visitor. Failures surface in the console and in Web3Forms.
      console.error('Web3Forms notification failed', err);
    }

    if (isNonAffiliateLead) {
      try {
        await fetch(form.action || '/api/leads', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId,
            brandName: String(fields.brandName || backdrop?.getAttribute('data-brand-name') || '').trim(),
            firstName,
            lastName,
            fullName: fullNameValue,
            workEmail: String(fields.email || '').trim(),
            companyName: company,
            jobTitle: String(fields.jobTitle || '').trim(),
            headcount: String(fields.employeeCount || '').trim(),
            region: String(fields.region || '').trim(),
            phone: String(fields.phone || '').trim(),
            needs: String(fields.requirements || '').trim(),
            partnerLandingUrl: targetVendorUrl || null,
            clientNotified: true,
            source: 'The HR Stack Guide',
          }),
          keepalive: true,
        });
      } catch (logErr) {
        console.error('Lead API log failed', logErr);
      }

      trackGenerateLead(vendor);
      if (targetVendorUrl) {
        window.location.href = targetVendorUrl;
        return;
      }
    } else {
      trackGenerateLead(vendor);
    }

    form.classList.add('hidden');
    successMessage?.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = false;
    btnText?.classList.remove('hidden');
    spinner?.classList.add('hidden');
    return;
  }

  try {
    const payload = {
      vendorId,
      brandName: String(fields.brandName || backdrop?.getAttribute('data-brand-name') || '').trim(),
      firstName,
      lastName,
      fullName: fullNameValue,
      workEmail: String(fields.email || '').trim(),
      companyName: String(fields.company || '').trim(),
      jobTitle: String(fields.jobTitle || '').trim(),
      headcount: String(fields.employeeCount || '').trim(),
      region: String(fields.region || '').trim(),
      phone: String(fields.phone || '').trim(),
      needs: String(fields.requirements || '').trim(),
      partnerLandingUrl:
        String(fields.partnerLandingUrl || backdrop?.getAttribute('data-partner-landing-url') || '').trim() || null,
      source: 'The HR Stack Guide',
    };

    const response = await fetch(form.action || '/api/leads', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let result: { redirectUrl?: string } | null = null;
    try {
      result = (await response.json()) as { redirectUrl?: string };
    } catch {
      result = null;
    }

    if (response.ok) {
      trackGenerateLead(vendorId);
      const redirectUrl = result?.redirectUrl ? String(result.redirectUrl) : '';
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      form.classList.add('hidden');
      successMessage?.classList.remove('hidden');
    } else {
      console.error('Lead submission rejected', response.status);
    }
  } catch (err) {
    console.error('Lead submission failed', err);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    btnText?.classList.remove('hidden');
    spinner?.classList.add('hidden');
  }
}

export function initLeadModal() {
  if (window.__leadModalScriptInitialized) return;
  window.__leadModalScriptInitialized = true;

  document.addEventListener('click', onDocumentClick, { passive: false });
  document.addEventListener('submit', (event) => {
    void onDocumentSubmit(event);
  });
}
