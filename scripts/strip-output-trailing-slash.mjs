#!/usr/bin/env node
/**
 * Astro's Vercel adapter writes a trailing-slash 308 at the front of
 * .vercel/output/config.json. That route matches before vercel.json redirects,
 * so /legacy-slug becomes /legacy-slug/ and then the real destination.
 * Drop those routes. Legacy URLs stay one hop via vercel.json, and the last
 * redirect there 308s slashless canonical pages. Directory indexes still
 * serve the slashed HTML.
 */
import fs from 'node:fs';

const configPath = '.vercel/output/config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const before = config.routes?.length ?? 0;
config.routes = (config.routes ?? []).filter((route) => {
  const location = route.headers?.Location;
  if (location === '/$1/' || location === '/$1') return false;
  if (route.src === '^/\\.well-known(?:/.*)?$') return false;
  return true;
});
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(
  `Removed ${before - config.routes.length} trailing-slash routes from ${configPath}`,
);
