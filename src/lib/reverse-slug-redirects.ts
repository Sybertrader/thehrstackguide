import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import {
  comparisonHubSlug,
  invertComparisonSlug,
  isComparisonRouteSlug,
  isLegacyTechStartupsSlug,
  publicModifierSlug,
} from './comparison-routes';
import { comparisonVendorsAreLive } from './tools';

/**
 * Build-time 301 map from inverted vendor order (`remote-vs-deel`) to the
 * CSV canonical slug that `getStaticPaths` actually emits (`deel-vs-remote`).
 * Destinations follow live catalog order, not alphabetical re-sorting, so
 * existing comparison URLs stay put.
 */
export function reverseSlugRedirects(): Record<string, string> {
  const csvPath = path.join(process.cwd(), 'comparisons.csv');
  const rows = parse(fs.readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
  }) as { slug: string; tool_a_id: string; tool_b_id: string; niche_id: string }[];

  const canonical = new Set<string>();
  for (const row of rows) {
    if (!comparisonVendorsAreLive(row.tool_a_id, row.tool_b_id)) continue;

    const hubSlug = comparisonHubSlug(row.tool_a_id, row.tool_b_id);
    if (isComparisonRouteSlug(hubSlug)) canonical.add(hubSlug);

    const publicSlug = isLegacyTechStartupsSlug(row.slug)
      ? `${hubSlug}-for-${publicModifierSlug(row.niche_id)}`
      : row.slug;
    if (isComparisonRouteSlug(publicSlug) && !isLegacyTechStartupsSlug(publicSlug)) {
      canonical.add(publicSlug);
    }
  }

  const redirects: Record<string, string> = {};
  for (const slug of canonical) {
    const inverted = invertComparisonSlug(slug);
    if (!inverted || canonical.has(inverted)) continue;
    redirects[`/${inverted}/`] = `/${slug}/`;
  }

  return redirects;
}
