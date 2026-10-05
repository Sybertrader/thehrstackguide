/**
 * Edge/dev 308s for the master 1-1 architecture.
 *
 * Production traffic on Vercel static hosting is handled by vercel.json
 * (same destinations, HTTP 308). This middleware covers `astro dev` so
 * segment URLs never render as 200s locally, and so `trailingSlash: 'always'`
 * pages like `/about` and `/methodology` 308 to their slashed canonicals
 * instead of 404ing.
 */
import type { MiddlewareHandler } from 'astro';
import { REDIRECT_STATUS, SITE_ORIGIN, resolveMasterRedirect } from './lib/master-redirects';

/** Static HTML routes that 404 without a trailing slash under Astro `always`. */
const TRAILING_SLASH_PAGES = new Set(['/about', '/methodology']);

function redirectTo(url: URL) {
  return new Response(null, {
    status: REDIRECT_STATUS,
    headers: {
      Location: url.href,
    },
  });
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const pathname = context.url.pathname;
  const destination = resolveMasterRedirect(pathname);
  if (destination) {
    const location = new URL(destination, SITE_ORIGIN);
    location.search = context.url.search;
    return redirectTo(location);
  }

  if (TRAILING_SLASH_PAGES.has(pathname)) {
    const location = new URL(context.url.href);
    location.pathname = `${pathname}/`;
    return redirectTo(location);
  }

  return next();
};
