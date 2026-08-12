/**
 * Lead intake API (Vercel Serverless).
 * - Always forwards to Web3Forms so we retain an email record of every lead.
 * - For PerformYard, also POSTs a clean JSON payload to Zapier → Salesforce
 *   when PERFORMYARD_ZAPIER_WEBHOOK_URL is configured.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const vendorId = String(body.vendorId || '').toLowerCase().trim();
    const brandName = String(body.brandName || body.target_software || vendorId || 'Unknown Vendor').trim();
    const firstName = String(body.firstName || body.first_name || '').trim();
    const lastName = String(body.lastName || body.last_name || '').trim();
    const fullName =
      String(body.fullName || '').trim() || [firstName, lastName].filter(Boolean).join(' ').trim();
    const workEmail = String(body.workEmail || body.work_email || '').trim();
    const companyName = String(body.companyName || body.company_name || '').trim();
    const headcount = String(body.headcount || body.company_size || '').trim();
    const region = String(body.region || '').trim() || 'Not provided';
    const needs = String(body.needs || body.notes || '').trim();
    const jobTitle = String(body.jobTitle || body.job_title || '').trim();
    const phone = String(body.phone || '').trim();

    if (!workEmail || !companyName || !fullName) {
      return res.status(400).json({ error: 'Missing required lead fields' });
    }

    const web3formsKey =
      process.env.WEB3FORMS_ACCESS_KEY || '9e3cce58-b062-4436-9834-24ba34373412';

    // Standard email fallback / internal record (Web3Forms).
    const emailPayload = {
      access_key: web3formsKey,
      subject: `New Referral Inquiry: ${brandName} via The HR Stack Guide`,
      target_software: brandName,
      vendor_id: vendorId,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      work_email: workEmail,
      company_name: companyName,
      job_title: jobTitle,
      company_size: headcount,
      phone,
      region,
      notes: needs,
      source: 'The HR Stack Guide',
    };

    const emailRes = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(emailPayload),
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text().catch(() => '');
      console.error('Web3Forms error', emailRes.status, detail);
      return res.status(502).json({ error: 'Failed to record lead email notification' });
    }

    // PerformYard → Zapier → Salesforce (optional env-configured webhook).
    if (vendorId === 'performyard') {
      const zapierUrl = process.env.PERFORMYARD_ZAPIER_WEBHOOK_URL;
      if (zapierUrl) {
        const zapierPayload = {
          fullName,
          workEmail,
          companyName,
          headcount,
          region,
          needs,
          source: 'The HR Stack Guide',
        };
        const zapRes = await fetch(zapierUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zapierPayload),
        });
        if (!zapRes.ok) {
          const detail = await zapRes.text().catch(() => '');
          console.error('PerformYard Zapier webhook error', zapRes.status, detail);
          // Email already recorded — do not fail the user-facing submission.
        }
      }
    }

    const redirectUrl =
      vendorId === 'performyard'
        ? process.env.PERFORMYARD_PARTNER_LANDING_URL ||
          body.partnerLandingUrl ||
          'https://www.performyard.com'
        : body.partnerLandingUrl || null;

    return res.status(200).json({
      ok: true,
      redirectUrl: redirectUrl || null,
    });
  } catch (err) {
    console.error('Lead API error', err);
    return res.status(500).json({ error: 'Unexpected lead submission error' });
  }
}
