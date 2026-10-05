import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { includeInSitemap, sitemapPolicy, withTrailingSlash } from './src/lib/master-redirects';

export default defineConfig({
  site: 'https://www.thehrstackguide.com',
  // Static HTML for pages; routes with `export const prerender = false`
  // (e.g. /api/calculate-eor.json) still deploy as Vercel serverless functions.
  output: 'static',
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'tap',
  },
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'unavatar.io' }],
  },
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    react(),
    partytown({
      config: {
        forward: ["dataLayer.push", "gtag"],
      },
    }),
    // Must precede sitemap(): it hands includeInSitemap the build output dir
    // it needs to read each page's rendered robots meta.
    sitemapPolicy(),
    sitemap({
      filter: (page) => includeInSitemap(page),
      serialize(item) {
        item.url = withTrailingSlash(item.url);
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
});
