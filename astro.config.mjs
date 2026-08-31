import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.thehrstackguide.com',
  vite: {
    plugins: [tailwindcss()],
  },

  // `/go/*` routes are thin meta-refresh redirectors to affiliate partners,
  // so they are kept out of the sitemap alongside the noindex tag in
  // src/pages/go/[slug].astro and the Disallow rule in public/robots.txt.
  integrations: [sitemap({ filter: (page) => !/\/go\/[^/]+\/?$/.test(page) })],
});