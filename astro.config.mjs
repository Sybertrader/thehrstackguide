import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.thehrstackguide.com',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },

  // `/go/*` affiliate redirects and `/thank-you/` confirmation pages are kept
  // out of the sitemap (both are noindex). `/recommendation/` stays in the
  // sitemap, self-canonicalizes via Layout, and remains indexable.
  integrations: [
    sitemap({
      filter: (page) => !/\/go\/[^/]+\/?$/.test(page) && !/\/thank-you\/?$/.test(page),
      serialize(item) {
        item.lastmod = new Date().toISOString();
        if (item.url && !item.url.endsWith('/') && !/\.[a-z0-9]+$/i.test(item.url)) {
          item.url = `${item.url}/`;
        }
        return item;
      },
    }),
  ],
});