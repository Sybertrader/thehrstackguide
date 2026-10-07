/**
 * HTTP 410 Gone targets: deleted pages, retired categories, and legacy
 * routes that must be purged from search indexes instead of 404ing.
 *
 * Exact paths are stored without a trailing slash. Prefixes include one.
 * Any pathname containing `reflektive` (case-insensitive) is also gone.
 * These checks take precedence over 308 comparison aliases so Googlebot
 * can drop the URL instead of following a hub redirect.
 */
export const DELETED_PATHS = [
  '/culture-amp-vs-reflektive-for-remote-teams',
  '/performyard-vs-reflektive-for-enterprise',
  '/leapsome-vs-reflektive-for-scaleups',
];

export const DELETED_PREFIXES = [
  '/old-category/',
];

export const GONE_STATUS = 410;
export const GONE_STATUS_TEXT = 'Gone';

export const GONE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'public, max-age=31536000, immutable',
};

export const GONE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>410 Gone - Page Permanently Removed</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 4rem 1rem; color: #111; background: #fff; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #666; max-width: 480px; margin: 0 auto 1.5rem; line-height: 1.5; }
    a { color: #0066cc; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>410 - Resource Permanently Removed</h1>
  <p>This page has been permanently deleted and is no longer available.</p>
  <a href="/">&larr; Return to The HR Stack Guide</a>
</body>
</html>`;

export function normalizeGonePath(pathname) {
  const pathOnly = (pathname || '/').split('?')[0].split('#')[0] || '/';
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) return pathOnly.slice(0, -1);
  return pathOnly;
}

export function isGonePath(pathname) {
  const normalized = normalizeGonePath(pathname);
  if (normalized.toLowerCase().includes('reflektive')) return true;
  if (DELETED_PATHS.includes(normalized)) return true;
  return DELETED_PREFIXES.some((prefix) => {
    const prefixRoot = normalizeGonePath(prefix);
    return normalized === prefixRoot || normalized.startsWith(`${prefixRoot}/`);
  });
}

export function goneHtmlResponse() {
  return new Response(GONE_HTML, {
    status: GONE_STATUS,
    statusText: GONE_STATUS_TEXT,
    headers: GONE_HEADERS,
  });
}

/** Vercel rewrite sources that map deleted URLs onto `/api/gone`. */
export function goneVercelRewrites() {
  const destination = '/api/gone';
  const rules = [
    { source: '/api/gone/', destination },
    { source: '/:path(.*reflektive.*)', destination },
    { source: '/:path(.*reflektive.*)/', destination },
  ];

  for (const path of DELETED_PATHS) {
    rules.push({ source: path, destination });
    rules.push({ source: `${path}/`, destination });
  }

  for (const prefix of DELETED_PREFIXES) {
    const root = normalizeGonePath(prefix);
    rules.push({ source: root, destination });
    rules.push({ source: `${root}/`, destination });
    rules.push({ source: `${root}/:path*`, destination });
  }

  return rules;
}
