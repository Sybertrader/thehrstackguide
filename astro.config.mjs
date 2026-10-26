import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { GONE_HEADERS, GONE_HTML, GONE_STATUS, isGonePath } from './src/lib/gone';
import {
  includeInSitemap,
  REDIRECT_STATUS,
  resolveMasterRedirect,
  sitemapPolicy,
  trailingSlashRedirectPath,
  withTrailingSlash,
} from './src/lib/master-redirects';

/**
 * Astro `trailingSlash: 'always'` 404s slashless pages in `astro dev` and
 * `astro preview`. Production does not use `vercel.json` `trailingSlash`
 * (that hop runs before redirects). This plugin 308s slashless HTML paths
 * after legacy aliases, matching the last vercel.json redirect.
 */
function trailingSlashPageRedirects() {
  function handler(req, res, next) {
    const [pathname, search] = (req.url ?? '').split('?');
    if (isGonePath(pathname)) {
      res.statusCode = GONE_STATUS;
      res.statusMessage = 'Gone';
      for (const [key, value] of Object.entries(GONE_HEADERS)) {
        res.setHeader(key, value);
      }
      res.end(GONE_HTML);
      return;
    }
    const destination = resolveMasterRedirect(pathname);
    const slashed = trailingSlashRedirectPath(pathname);
    const target = destination ?? slashed;
    if (!target) {
      next();
      return;
    }
    const query = search ? `?${search}` : '';
    res.statusCode = REDIRECT_STATUS;
    res.setHeader('Location', `${target}${query}`);
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
    build: {
      // Astro inlines script chunks under 4 kB into the HTML. That trips the
      // indexing audit. Keep page scripts as external files; other assets
      // stay on Vite's 4 kB default.
      assetsInlineLimit(filePath, content) {
        if (String(filePath).includes('astro_type_script')) return false;
        const size = content instanceof Uint8Array ? content.byteLength : Buffer.byteLength(content ?? '');
        return size < 4096;
      },
    },
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
