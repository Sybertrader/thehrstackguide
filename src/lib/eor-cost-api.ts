/**
 * Deterministic annual EOR / contractor platform-fee formulas for the
 * public calculator API. Caps match the on-page CostCalculator.
 * Rates come from published list prices. Unpublished EOR modules are not estimated.
 */
import { EOR_PLATFORM_RATES } from '../data/vendors/eor-platform-rates.js';

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

export function calculateEorAnnualCosts(
  eorCount: number,
  contractorCount: number,
): { breakdown: EorCostBreakdown; vendorCosts: EorVendorCost[] } {
  const deel = EOR_PLATFORM_RATES.deel;
  const remote = EOR_PLATFORM_RATES.remote;
  const multiplier = EOR_PLATFORM_RATES.multiplier;
  const annual = (monthly: number, headcount: number) => monthly * headcount * 12;

  const deelAnnual = annual(deel.eorAnnualRate, eorCount) + annual(deel.contractorAnnualRate, contractorCount);
  const multiplierAnnual =
    annual(multiplier.eorAnnualRate, eorCount) + annual(multiplier.contractorAnnualRate, contractorCount);
  // Annual commitment rate. Month-to-month EOR is remote.eorMonthlyRate ($699).
  const remoteAnnual = annual(remote.eorAnnualRate, eorCount) + annual(remote.contractorAnnualRate, contractorCount);
  // Published core platform only. Rippling does not publish an EOR module price.
  const ripplingPlatformMonthly = 8;
  const ripplingAnnual = annual(ripplingPlatformMonthly, eorCount + contractorCount);

  const breakdown: EorCostBreakdown = {
    multiplier_annual_usd: multiplierAnnual,
    rippling_annual_usd: ripplingAnnual,
    remote_annual_usd: remoteAnnual,
    deel_annual_usd: deelAnnual,
  };

  const vendorCosts: EorVendorCost[] = [
    { name: 'Multiplier', annual_cost_usd: multiplierAnnual },
    { name: 'Remote', annual_cost_usd: remoteAnnual },
    { name: 'Deel', annual_cost_usd: deelAnnual },
  ].sort((a, b) => a.annual_cost_usd - b.annual_cost_usd);

  return { breakdown, vendorCosts };
}

export function buildEorCostEstimate(
  eorCount: number,
  contractorCount: number,
  now = new Date(),
): EorCostEstimateResponse {
  const { breakdown, vendorCosts } = calculateEorAnnualCosts(eorCount, contractorCount);
  const cheapest = vendorCosts[0];
  const highest = vendorCosts[vendorCosts.length - 1];

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
    },
    meta: {
      data_source: 'The HR Stack Guide Independent Data Engine',
      last_audited: lastAuditedLabel(now),
      documentation: `${SITE_ORIGIN}${METHODOLOGY_PATH}`,
      pricing_notes:
        'Remote annual commitment is $599 per employee per month. Month-to-month EOR is $699 per employee per month. Rippling EOR is not a published list price and is excluded from the cheapest-option ranking. The Rippling figure is the published $8 per user per month platform fee only.',
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
