import { getToolProfile } from '../../lib/tools';
import { KEEP_VENDORS } from '../../lib/vendor-catalog';
import { resolveVendorOutboundHref } from '../../lib/outbound';

/**
 * Published EOR / contractor *platform* fees (USD per worker per month).
 * `*AnnualRate` is the monthly sticker on an annual commitment, not a yearly total.
 */
export interface EorPlatformRates {
  eorMonthlyRate: number;
  eorAnnualRate: number;
  contractorMonthlyRate: number;
  contractorAnnualRate: number;
}

/** Central defaults keyed by live `tools.json` vendor ids. */
export const EOR_PLATFORM_RATES: Record<string, EorPlatformRates> = {
  deel: {
    eorMonthlyRate: 599,
    eorAnnualRate: 599,
    contractorMonthlyRate: 49,
    contractorAnnualRate: 49,
  },
  remote: {
    eorMonthlyRate: 699,
    eorAnnualRate: 599,
    contractorMonthlyRate: 29,
    contractorAnnualRate: 29,
  },
  'oyster-hr': {
    eorMonthlyRate: 699,
    eorAnnualRate: 699,
    contractorMonthlyRate: 29,
    contractorAnnualRate: 29,
  },
  multiplier: {
    eorMonthlyRate: 400,
    eorAnnualRate: 400,
    contractorMonthlyRate: 40,
    contractorAnnualRate: 40,
  },
  'papaya-global': {
    eorMonthlyRate: 650,
    eorAnnualRate: 650,
    contractorMonthlyRate: 25,
    contractorAnnualRate: 25,
  },
  'remote-people': {
    eorMonthlyRate: 199,
    eorAnnualRate: 199,
    contractorMonthlyRate: 29,
    contractorAnnualRate: 29,
  },
  /**
   * Payoneer Workforce Management publishes a $0 contractor platform fee.
   * It is not an Employer of Record, so EOR rates stay at 0 and are not treated as published.
   */
  'payoneer-workforce-management': {
    eorMonthlyRate: 0,
    eorAnnualRate: 0,
    contractorMonthlyRate: 0,
    contractorAnnualRate: 0,
  },
};

/** Vendors with a published EOR list price. Rippling and Gusto are excluded: EOR is unlisted or not a product. */
const PUBLISHED_EOR_IDS = new Set([
  'deel',
  'remote',
  'oyster-hr',
  'multiplier',
  'papaya-global',
  'remote-people',
]);

const PUBLISHED_CONTRACTOR_IDS = new Set([
  ...PUBLISHED_EOR_IDS,
  'payoneer-workforce-management',
]);

export function vendorPublishesEorRate(vendorId: string): boolean {
  const rate = EOR_PLATFORM_RATES[vendorId]?.eorMonthlyRate;
  return PUBLISHED_EOR_IDS.has(vendorId) && typeof rate === 'number' && rate > 0;
}

export function vendorPublishesContractorRate(vendorId: string): boolean {
  return PUBLISHED_CONTRACTOR_IDS.has(vendorId) && EOR_PLATFORM_RATES[vendorId] != null;
}

/** Buyer-facing sticker. Remote states both the month-to-month and annual-commitment rates. */
export function publishedEorStatement(vendorId: string): string | null {
  if (!vendorPublishesEorRate(vendorId)) return null;
  const rates = EOR_PLATFORM_RATES[vendorId];
  if (!rates) return null;
  const eor =
    rates.eorAnnualRate > 0 && rates.eorAnnualRate !== rates.eorMonthlyRate
      ? `EOR at $${rates.eorMonthlyRate}/mo billed monthly, or $${rates.eorAnnualRate}/mo on an annual commitment`
      : `EOR at $${rates.eorMonthlyRate}/mo`;
  const contractor =
    rates.contractorMonthlyRate > 0 ? `, and contractors at $${rates.contractorMonthlyRate}/mo` : '';
  return `${eor}${contractor}`;
}

/**
 * Monthly billing uses the published month-to-month rate.
 * Annual billing uses the published annual-commitment rate when the vendor lists one.
 * No discount is applied when the two published rates are the same.
 */
export function effectiveCycleRate(
  monthlyRate: number,
  annualRate: number,
  cycle: 'annual' | 'monthly',
): number {
  if (cycle === 'monthly') return monthlyRate;
  if (annualRate > 0) return annualRate;
  return monthlyRate;
}

export function resolveEorPlatformRates(
  vendorId: string,
  overrides: Partial<EorPlatformRates> = {},
): EorPlatformRates {
  const catalog = EOR_PLATFORM_RATES[vendorId];
  const profile = getToolProfile(vendorId);
  const pick = (override: number | undefined, catalogValue: number | undefined, fromTools?: number) =>
    override ?? catalogValue ?? fromTools ?? 0;

  const eorMonthlyRate = pick(overrides.eorMonthlyRate, catalog?.eorMonthlyRate, profile?.eor_price);
  const eorAnnualPublished = pick(overrides.eorAnnualRate, catalog?.eorAnnualRate, profile?.eor_price);
  const contractorMonthlyRate = pick(
    overrides.contractorMonthlyRate,
    catalog?.contractorMonthlyRate,
    profile?.contractor_price,
  );
  const contractorAnnualPublished = pick(
    overrides.contractorAnnualRate,
    catalog?.contractorAnnualRate,
    profile?.contractor_price,
  );

  return {
    eorMonthlyRate,
    eorAnnualRate: effectiveCycleRate(eorMonthlyRate, eorAnnualPublished, 'annual'),
    contractorMonthlyRate,
    contractorAnnualRate: effectiveCycleRate(contractorMonthlyRate, contractorAnnualPublished, 'annual'),
  };
}

export function annualPlatformCost(
  eorCount: number,
  contractorCount: number,
  eorRate: number,
  contractorRate: number,
): number {
  return (eorCount * eorRate + contractorCount * contractorRate) * 12;
}

export interface EorCalculatorVendor extends EorPlatformRates {
  id: string;
  name: string;
  affiliateUrl: string;
}

export function listEorCalculatorVendors(): EorCalculatorVendor[] {
  return KEEP_VENDORS.filter((vendor) => vendor.category === 'payroll-eor')
    .map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      affiliateUrl: resolveVendorOutboundHref(vendor.id),
      ...resolveEorPlatformRates(vendor.id),
    }))
    .filter((vendor) => vendor.eorMonthlyRate > 0 || vendor.eorAnnualRate > 0);
}
