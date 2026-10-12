import { EOR_PLATFORM_RATES } from '../data/vendors/eor-platform-rates';
import { getSlugHash } from '../utils/layoutHasher';

export interface TcoCurve {
  year1: number;
  year2: number;
  year3: number;
}

/** Monthly platform fee used for the 3-year TCO curve. */
export function monthlyPlatformFee(
  vendorId: string,
  startingPrice: string,
  slug: string,
  side: 'a' | 'b',
): number {
  const rates = EOR_PLATFORM_RATES[vendorId];
  if (rates?.eorMonthlyRate) return rates.eorMonthlyRate;

  const match = String(startingPrice)
    .replace(/,/g, '')
    .match(/(\d+(?:\.\d+)?)/);
  const raw = match ? Number.parseFloat(match[1]) : NaN;
  if (Number.isFinite(raw) && raw > 0) {
    if (/user/i.test(startingPrice) && raw < 200) return raw * 40;
    if (raw < 15) return raw * 40;
    return raw;
  }

  return 320 + (getSlugHash(`${slug}:${side}`) % 680);
}

export function projectTco(monthly: number, inflationY2: number, inflationY3: number): TcoCurve {
  const year1 = monthly * 12;
  const year2 = year1 * inflationY2;
  const year3 = year2 * inflationY3;
  return { year1, year2, year3 };
}
