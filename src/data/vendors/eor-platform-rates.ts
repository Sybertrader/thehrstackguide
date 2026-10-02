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
  rippling: {
    eorMonthlyRate: 599,
    eorAnnualRate: 599,
    contractorMonthlyRate: 0,
    contractorAnnualRate: 0,
  },
  gusto: {
    eorMonthlyRate: 599,
    eorAnnualRate: 599,
    contractorMonthlyRate: 35,
    contractorAnnualRate: 35,
  },
  payoneer: {
    eorMonthlyRate: 199,
    eorAnnualRate: 199,
    contractorMonthlyRate: 19,
    contractorAnnualRate: 19,
  },
  'payoneer-workforce-management': {
    eorMonthlyRate: 199,
    eorAnnualRate: 199,
    contractorMonthlyRate: 19,
    contractorAnnualRate: 19,
  },
};

/** Typical annual-commitment cut vs month-to-month rack (~15%). */
export const ANNUAL_BILLING_DISCOUNT = 0.15;

/**
 * Monthly = published rack. Annual = a lower published annual sticker when
 * the vendor actually discounts, otherwise ~15% off rack.
 */
export function effectiveCycleRate(
  monthlyRate: number,
  annualRate: number,
  cycle: 'annual' | 'monthly',
): number {
  if (cycle === 'monthly') return monthlyRate;
  if (monthlyRate <= 0 && annualRate <= 0) return 0;
  if (annualRate > 0 && monthlyRate > 0 && annualRate < monthlyRate) return annualRate;
  const rack = monthlyRate > 0 ? monthlyRate : annualRate;
  return Math.round(rack * (1 - ANNUAL_BILLING_DISCOUNT));
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
