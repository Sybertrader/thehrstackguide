/**
 * Deterministic annual EOR / contractor platform-fee formulas for the
 * public calculator API. Caps match the on-page CostCalculator.
 * Rates come from published list prices. Unpublished EOR modules are not estimated.
 */
import {
  EOR_PLATFORM_RATES,
  monthlyFixedPlatformFees,
  securityDeposit,
  fxLiability,
  type EorPlatformRates,
} from '../data/vendors/eor-platform-rates.js';

export const MAX_EOR_HEADCOUNT = 250;
export const MAX_CONTRACTOR_HEADCOUNT = 500;
export const CALCULATE_EOR_PATH = '/api/calculate-eor';
export const CALCULATE_EOR_JSON_PATH = '/api/calculate-eor.json';
export const OPENAPI_PATH = '/openapi.json';
export const EOR_CALCULATOR_PATH = '/tools/eor-cost-calculator/';
export const METHODOLOGY_PATH = '/methodology/';

const SITE_ORIGIN = 'https://www.thehrstackguide.com';

export interface EorCostBreakdown {
  multiplier_annual_usd: number;
  rippling_annual_usd: number;
  remote_annual_usd: number;
  deel_annual_usd: number;
  gusto_annual_usd: number;
  payoneer_annual_usd: number;
}

export interface EorVendorFeeDetail {
  name: string;
  slug: string;
  annual_platform_usd: number;
  monthly_platform_usd: number;
  eor_seat_monthly_usd: number;
  contractor_monthly_usd: number;
  fixed_monthly_usd: number;
  fx_markup_percent: number;
  fx_liability_usd: number;
  deposit_months: number;
  security_deposit_usd: number;
}

export interface EorVendorCost {
  name: string;
  annual_cost_usd: number;
}

export interface EorCostEstimateResponse {
  status: 'success';
  input: {
    eor_employees: number;
    global_contractors: number;
  };
  estimates: {
    cheapest_option: string;
    estimated_annual_savings_vs_highest: number;
    breakdown: EorCostBreakdown;
    vendors: EorVendorFeeDetail[];
    selected_vendor: EorVendorFeeDetail | null;
  };
  meta: {
    data_source: string;
    last_audited: string;
    documentation: string;
    pricing_notes: string;
  };
}

export function parseHeadcount(raw: string | null, max: number, fallback = 0): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(0, parsed));
}

export function lastAuditedLabel(now = new Date()): string {
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const RANKED_VENDORS: Array<{ slug: string; name: string; rates: EorPlatformRates }> = [
  { slug: 'multiplier', name: 'Multiplier', rates: EOR_PLATFORM_RATES.multiplier },
  { slug: 'remote', name: 'Remote', rates: EOR_PLATFORM_RATES.remote },
  { slug: 'deel', name: 'Deel', rates: EOR_PLATFORM_RATES.deel },
  { slug: 'gusto', name: 'Gusto', rates: EOR_PLATFORM_RATES.gusto },
  { slug: 'rippling', name: 'Rippling', rates: EOR_PLATFORM_RATES.rippling },
  { slug: 'payoneer', name: 'Payoneer', rates: EOR_PLATFORM_RATES['payoneer-workforce-management'] },
];

export function vendorPlatformAnnual(
  eorCount: number,
  contractorCount: number,
  rates: EorPlatformRates,
  cycle: 'annual' | 'monthly' = 'annual',
): number {
  const eorRate = cycle === 'monthly' ? rates.eorMonthlyRate : rates.eorAnnualRate;
  const contractorRate = cycle === 'monthly' ? rates.contractorMonthlyRate : rates.contractorAnnualRate;
  const seats = eorCount * eorRate + contractorCount * contractorRate;
  return (seats + monthlyFixedPlatformFees(eorCount, contractorCount, rates)) * 12;
}

export function describeVendorFees(
  slug: string,
  name: string,
  rates: EorPlatformRates,
  eorCount: number,
  contractorCount: number,
  averageMonthlySalary = 0,
  cycle: 'annual' | 'monthly' = 'annual',
): EorVendorFeeDetail {
  const eorRate = cycle === 'monthly' ? rates.eorMonthlyRate : rates.eorAnnualRate;
  const contractorRate = cycle === 'monthly' ? rates.contractorMonthlyRate : rates.contractorAnnualRate;
  const fixed = monthlyFixedPlatformFees(eorCount, contractorCount, rates);
  const monthly = eorCount * eorRate + contractorCount * contractorRate + fixed;
  const payroll = averageMonthlySalary * eorCount;
  return {
    name,
    slug,
    annual_platform_usd: monthly * 12,
    monthly_platform_usd: monthly,
    eor_seat_monthly_usd: eorCount * eorRate,
    contractor_monthly_usd: contractorCount * contractorRate + (contractorCount > 0 ? rates.contractorBaseFee ?? 0 : 0),
    fixed_monthly_usd: fixed,
    fx_markup_percent: rates.fxMarkupPercent ?? 0,
    fx_liability_usd: fxLiability(payroll, rates.fxMarkupPercent ?? 0),
    deposit_months: rates.depositMonths ?? 0,
    security_deposit_usd: securityDeposit(averageMonthlySalary, eorCount, rates.depositMonths ?? 0),
  };
}

export function calculateEorAnnualCosts(
  eorCount: number,
  contractorCount: number,
  averageMonthlySalary = 0,
): { breakdown: EorCostBreakdown; vendorCosts: EorVendorCost[]; vendors: EorVendorFeeDetail[] } {
  const vendors = RANKED_VENDORS.map((vendor) =>
    describeVendorFees(vendor.slug, vendor.name, vendor.rates, eorCount, contractorCount, averageMonthlySalary),
  );
  const annualOf = (slug: string) => vendors.find((vendor) => vendor.slug === slug)?.annual_platform_usd ?? 0;

  const breakdown: EorCostBreakdown = {
    multiplier_annual_usd: annualOf('multiplier'),
    rippling_annual_usd: annualOf('rippling'),
    remote_annual_usd: annualOf('remote'),
    deel_annual_usd: annualOf('deel'),
    gusto_annual_usd: annualOf('gusto'),
    payoneer_annual_usd: annualOf('payoneer'),
  };

  const vendorCosts: EorVendorCost[] = vendors
    .map((vendor) => ({ name: vendor.name, annual_cost_usd: vendor.annual_platform_usd }))
    .sort((a, b) => a.annual_cost_usd - b.annual_cost_usd);

  return { breakdown, vendorCosts, vendors };
}

export function buildEorCostEstimate(
  eorCount: number,
  contractorCount: number,
  now = new Date(),
  options: { vendor?: string | null; averageMonthlySalary?: number } = {},
): EorCostEstimateResponse {
  const salary = options.averageMonthlySalary ?? 0;
  const { breakdown, vendorCosts, vendors } = calculateEorAnnualCosts(eorCount, contractorCount, salary);
  const cheapest = vendorCosts[0];
  const highest = vendorCosts[vendorCosts.length - 1];
  const requested = (options.vendor ?? '').trim().toLowerCase();
  const selected =
    vendors.find((vendor) => vendor.slug === requested || (requested === 'payoneer-workforce' && vendor.slug === 'payoneer')) ??
    null;

  return {
    status: 'success',
    input: {
      eor_employees: eorCount,
      global_contractors: contractorCount,
    },
    estimates: {
      cheapest_option: cheapest.name,
      estimated_annual_savings_vs_highest: highest.annual_cost_usd - cheapest.annual_cost_usd,
      breakdown,
      vendors,
      selected_vendor: selected,
    },
    meta: {
      data_source: 'The HR Stack Guide Independent Data Engine',
      last_audited: lastAuditedLabel(now),
      documentation: `${SITE_ORIGIN}${METHODOLOGY_PATH}`,
      pricing_notes:
        'Annual totals use annual-commitment seat rates plus published base fees. Gusto and Rippling EOR are $599 per employee per month. Gusto contractors are $6 per contractor per month plus a $35 base on contractor-only plans. Rippling adds a $35 platform base and $8 per user, with contractors at $20 per month. Payoneer annual EOR is $199 per employee per month ($249 month-to-month) and contractors are $19 per month, with a refundable one-month gross salary deposit. Pass salary to include FX markup and that deposit. FX and the deposit are excluded from annual_platform_usd.',
    },
  };
}

/** JSON-LD WebApplication node for AI / search crawlers. */
export function eorCostCalculatorWebApplication(): Record<string, unknown> {
  return {
    '@type': 'WebApplication',
    name: 'The HR Stack Guide EOR Cost Calculator',
    url: `${SITE_ORIGIN}${EOR_CALCULATOR_PATH}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    description:
      'Interactive financial modeler for estimating annual software and platform fees across global EOR and contractor payroll vendors including Deel, Rippling, Multiplier, and Remote.',
    creator: {
      '@type': 'Organization',
      name: 'The HR Stack Guide',
      url: `${SITE_ORIGIN}/`,
    },
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    potentialAction: {
      '@type': 'SearchAction',
      name: 'Calculate global hiring and EOR annual software costs',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_ORIGIN}${CALCULATE_EOR_PATH}?eor={eor}&contractors={contractors}`,
        contentType: 'application/json',
        httpMethod: 'GET',
      },
    },
  };
}

export function eorCostCalculatorJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    ...eorCostCalculatorWebApplication(),
  };
}
