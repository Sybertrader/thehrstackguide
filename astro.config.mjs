import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

/**
 * Keep noindex / operational URLs out of sitemap-index.xml.
 * Comparison hubs and child modifiers are emitted by getStaticPaths and
 * stay included. Legacy `-for-tech-startups` pages are no longer built;
 * the extra path check is a safety net.
 */
function includeInSitemap(page) {
  let pathname = page;
  try {
    pathname = new URL(page).pathname;
  } catch {
    /* page is already a path */
  }

  if (pathname.startsWith('/go/')) return false;
  if (pathname.startsWith('/api/')) return false;
  if (pathname === '/thank-you' || pathname === '/thank-you/') return false;
  if (pathname === '/contact' || pathname === '/contact/') return false;
  if (pathname.includes('-for-tech-startups')) return false;
  return true;
}

function withTrailingSlash(url) {
  if (!url || url.endsWith('/')) return url;
  if (/\.[a-z0-9]+$/i.test(url)) return url;
  return `${url}/`;
}

export default defineConfig({
  site: 'https://www.thehrstackguide.com',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      filter: includeInSitemap,
      serialize(item) {
        item.url = withTrailingSlash(item.url);
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
});
