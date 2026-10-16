import { EOR_PLATFORM_RATES, publishedEorStatement, vendorPublishesEorRate } from '../data/vendors/eor-platform-rates';

/**
 * Google Rich Results require Offer.price to be a bare number ("299"), not
 * "$299/mo", "Custom quote", or other display copy.
 * Compound stickers ("$49/mo + $6/user") and custom quotes are omitted.
 */

export type SchemaOffer = {
  '@type': 'Offer';
  price: string;
  priceCurrency: 'USD';
  description: string;
};

export type AggregateRatingNode = {
  '@type': 'AggregateRating';
  ratingValue: string;
  reviewCount: string;
  bestRating: '5';
  worstRating: '1';
};

/** A single numeric token, or null when the string is missing, compound, or non-numeric. */
export function schemaOfferPrice(price: string | null | undefined): string | null {
  if (price == null) return null;
  const trimmed = String(price).trim();
  if (!trimmed || /custom|quote|contact|\+|free tier/i.test(trimmed)) return null;
  const matches = trimmed.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length !== 1) return null;
  const value = matches[0];
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  return value;
}

export function schemaOffer(price: string | null | undefined): SchemaOffer | undefined {
  const numeric = schemaOfferPrice(price);
  if (numeric == null || price == null) return undefined;
  return {
    '@type': 'Offer',
    price: numeric,
    priceCurrency: 'USD',
    description: String(price).trim(),
  };
}

/**
 * Offer for a comparison vendor. EOR products use the published employee rate
 * (Remote: $699/mo billed monthly). Other products use a single visible starting price.
 */
export function verifiedSoftwareOffer(vendorId: string, startingPrice: string | null | undefined): SchemaOffer | undefined {
  if (vendorPublishesEorRate(vendorId)) {
    const rates = EOR_PLATFORM_RATES[vendorId];
    const statement = publishedEorStatement(vendorId);
    if (!rates || !statement || !(rates.eorMonthlyRate > 0)) return undefined;
    return {
      '@type': 'Offer',
      price: String(rates.eorMonthlyRate),
      priceCurrency: 'USD',
      description: statement,
    };
  }
  return schemaOffer(startingPrice);
}

/** AggregateRating only when both the score and the count are present. No placeholder values. */
export function visibleAggregateRating(
  rating: string | number | null | undefined,
  reviewCount: string | number | null | undefined,
): AggregateRatingNode | undefined {
  const ratingValue = rating == null ? '' : String(rating).trim();
  if (!ratingValue) return undefined;
  const numeric =
    typeof reviewCount === 'number'
      ? reviewCount
      : Number.parseInt(String(reviewCount ?? '').replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue,
    reviewCount: String(numeric),
    bestRating: '5',
    worstRating: '1',
  };
}
