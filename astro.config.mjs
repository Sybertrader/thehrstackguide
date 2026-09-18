import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import { includeInSitemap, withTrailingSlash } from './src/lib/master-redirects';

export default defineConfig({
  site: 'https://www.thehrstackguide.com',
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
    partytown({
      config: {
        forward: ["dataLayer.push", "gtag"],
      },
    }),
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
