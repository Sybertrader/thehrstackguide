/**
 * Google Rich Results require Offer.price to be a bare number ("299"), not
 * "$299/mo", "Custom quote", or other display copy.
 */

export type SchemaOffer = {
  '@type': 'Offer';
  price: string;
  priceCurrency: 'USD';
};

/** First numeric token after stripping thousands separators, or null. */
export function schemaOfferPrice(price: string | null | undefined): string | null {
  if (price == null) return null;
  const trimmed = String(price).trim();
  if (!trimmed) return null;
  const match = trimmed.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = match[1];
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  return value;
}

export function schemaOffer(price: string | null | undefined): SchemaOffer | undefined {
  const numeric = schemaOfferPrice(price);
  if (numeric == null) return undefined;
  return {
    '@type': 'Offer',
    price: numeric,
    priceCurrency: 'USD',
  };
}
