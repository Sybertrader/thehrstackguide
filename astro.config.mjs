import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { includeInSitemap, sitemapPolicy, withTrailingSlash } from './src/lib/master-redirects';

/**
 * Astro `trailingSlash: 'always'` returns 404 for `/about` and `/methodology`
 * in `astro dev` / `astro preview` (see vite-plugin-astro-server/trailing-slash.js).
 * Vercel `trailingSlash: true` already 308s these in production. This plugin
 * unshifts after Astro's own trailing-slash middleware so local matches prod.
 */
function trailingSlashPageRedirects() {
  const pages = new Set(['/about', '/methodology']);
  function handler(req, res, next) {
    const [pathname, search] = (req.url ?? '').split('?');
    if (!pages.has(pathname)) {
      next();
      return;
    }
    const query = search ? `?${search}` : '';
    res.statusCode = 308;
    res.setHeader('Location', `${pathname}/${query}`);
    res.end();
  }
  function install(server) {
    return () => {
      setTimeout(() => {
        server.middlewares.stack.unshift({ route: '', handle: handler });
      }, 0);
    };
  }
  return {
    name: 'trailing-slash-page-redirects',
    configureServer: install,
    configurePreviewServer: install,
  };
}

export default defineConfig({
  site: 'https://www.thehrstackguide.com',
  // Static HTML for pages. Native Vercel functions live in /api (see api/calculate-eor.ts).
  // Astro routes with `export const prerender = false` (e.g. /api/jev-search) also deploy as serverless.
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
    plugins: [trailingSlashPageRedirects(), tailwindcss()],
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
