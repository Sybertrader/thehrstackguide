// Throwaway check: extracts the routing logic from the component source and
// exercises every dropdown combination against the built site.
import { readFileSync, existsSync } from 'node:fs';

const src = readFileSync('src/components/RecommendationEngine.astro', 'utf8');
const start = src.indexOf('  const ROUTES = {');
const end = src.indexOf('return ROUTES.fallback;', start);
const block = src.slice(start, src.indexOf('}', end) + 1).replace(/: string/g, '');

const run = new Function(`${block} return { ROUTES, resolveTargetUrl };`)();
const { ROUTES, resolveTargetUrl } = run;

const categories = ['payroll', 'ats', 'performance'];
const headcounts = ['startup', 'scaleup', 'enterprise'];
const budgets = ['lean', 'mid', 'flexible'];
const locations = ['us_only', 'global_remote', 'hybrid'];
const priorities = ['performance', 'global_eor', 'payroll', 'onboarding'];

const hits = new Map();
let combos = 0;
let fallbacks = 0;

for (const category of categories)
  for (const teamSize of headcounts)
    for (const budget of budgets)
      for (const location of locations)
        for (const priority of priorities) {
          combos += 1;
          const url = resolveTargetUrl(teamSize, location, priority);
          hits.set(url, (hits.get(url) || 0) + 1);
          if (url === ROUTES.fallback && !(location !== 'us_only' || priority === 'global_eor')) {
            fallbacks += 1;
          }
        }

console.log(`combinations tested: ${combos}`);
for (const [url, count] of [...hits].sort((a, b) => b[1] - a[1])) {
  const path = `dist${url}index.html`;
  console.log(`${existsSync(path) ? 'LIVE   ' : '404    '} ${url}  (${count} combos)`);
}
console.log(`unintended us_only fallthroughs: ${fallbacks}`);

const spot = [
  ['startup', 'us_only', 'payroll', ROUTES.usSmbPayroll, 'rule 3: US small team'],
  ['scaleup', 'us_only', 'onboarding', ROUTES.enterpriseHris, 'rule 4: US scaleup (was falling through)'],
  ['enterprise', 'us_only', 'payroll', ROUTES.enterpriseHris, 'rule 4: US enterprise'],
  ['startup', 'us_only', 'performance', ROUTES.performance, 'rule 1 beats rule 3'],
  ['startup', 'hybrid', 'payroll', ROUTES.global, 'rule 2 beats rule 3'],
  ['enterprise', 'global_remote', 'onboarding', ROUTES.global, 'rule 2 beats rule 4'],
  ['scaleup', 'us_only', 'global_eor', ROUTES.global, 'rule 2 via priority'],
];

let failed = 0;
for (const [teamSize, location, priority, expected, label] of spot) {
  const actual = resolveTargetUrl(teamSize, location, priority);
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} -> ${actual}`);
}
console.log(failed === 0 ? 'all spot checks passed' : `${failed} spot check(s) failed`);
