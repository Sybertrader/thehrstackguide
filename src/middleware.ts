/**
 * Edge/dev 308s for the master 1-1 architecture.
 *
 * Production traffic on Vercel static hosting is handled by vercel.json
 * (same destinations, HTTP 308). This middleware covers `astro dev` so
 * segment URLs never render as 200s locally.
 */
import type { MiddlewareHandler } from 'astro';
import { REDIRECT_STATUS, SITE_ORIGIN, resolveMasterRedirect } from './lib/master-redirects';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const destination = resolveMasterRedirect(context.url.pathname);
  if (!destination) return next();

  const location = new URL(destination, SITE_ORIGIN);
  location.search = context.url.search;
  return new Response(null, {
    status: REDIRECT_STATUS,
    headers: {
      Location: location.href,
    },
  });
};
