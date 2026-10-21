/**
 * Edge/dev interceptors for deleted URLs (HTTP 410) and the master 1-1
 * architecture (HTTP 308).
 *
 * Production 308s for comparison aliases are also in vercel.json. Production
 * 410s are vercel.json rewrites to /api/gone (a `routes` array would ignore
 * those existing redirects). This middleware covers `astro dev` and SSR.
 */
import { defineMiddleware } from 'astro:middleware';
import { goneHtmlResponse, isGonePath } from './lib/gone';
import {
  REDIRECT_STATUS,
  SITE_ORIGIN,
  resolveMasterRedirect,
  trailingSlashRedirectPath,
} from './lib/master-redirects';

function redirectTo(url: URL) {
  return new Response(null, {
    status: REDIRECT_STATUS,
    headers: {
      Location: url.href,
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  if (isGonePath(pathname)) {
    return goneHtmlResponse();
  }

  const destination = resolveMasterRedirect(pathname);
  if (destination) {
    const location = new URL(destination, SITE_ORIGIN);
    location.search = context.url.search;
    return redirectTo(location);
  }

  const slashed = trailingSlashRedirectPath(pathname);
  if (slashed) {
    const location = new URL(context.url.href);
    location.pathname = slashed;
    return redirectTo(location);
  }

  return next();
});
