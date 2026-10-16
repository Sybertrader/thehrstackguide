import { EOR_PLATFORM_RATES, vendorPublishesEorRate } from '../data/vendors/eor-platform-rates';

export const CUSTOM_QUOTE_LABEL = 'Custom Quote Required';
export const CUSTOM_QUOTE_SUBTEXT =
  'Vendor operates on custom annual contracts based on headcount, selected modules, and implementation scope. Contact vendor sales for enterprise pricing.';

export interface TcoCurve {
  year1: number;
  year2: number;
  year3: number;
}

/**
 * Published monthly platform fee, or null when the vendor does not list one.
 * Per-user stickers are not multiplied by an assumed headcount.
 */
export function monthlyPlatformFee(vendorId: string, startingPrice: string): number | null {
  if (vendorPublishesEorRate(vendorId)) {
    const rate = EOR_PLATFORM_RATES[vendorId]?.eorMonthlyRate;
    if (typeof rate === 'number' && rate > 0) return rate;
  }

  const source = String(startingPrice).trim();
  if (!source || /custom|quote|contact|\+|free tier/i.test(source)) return null;
  if (/user|seat/i.test(source)) return null;

  const match = source.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/g);
  if (!match || match.length !== 1) return null;
  const raw = Number.parseFloat(match[0]);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return raw;
}

/** Annualizes a published monthly fee. Does not apply modeled inflation. */
export function projectTco(monthly: number | null): TcoCurve | null {
  if (monthly == null || !Number.isFinite(monthly) || monthly <= 0) return null;
  const year1 = monthly * 12;
  return { year1, year2: year1, year3: year1 };
}
