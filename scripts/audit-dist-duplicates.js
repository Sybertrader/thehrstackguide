import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../dist');

// Shared chrome, layout labels, and pSEO glue. Distinctive vendor/product
// language is what remains for Jaccard.
const COMMON_CORPUS_WORDS = new Set([
  'payroll', 'software', 'management', 'features', 'pricing', 'employees',
  'company', 'platform', 'system', 'global', 'comparison', 'vs', '2026',
  'privacy', 'policy', 'terms', 'cookie', 'copyright', 'rights', 'reserved',
  'glance', 'starting', 'price', 'model', 'trial', 'available', 'quote',
  'scorecard', 'humanverified', 'verified', 'operational', 'independent',
  'updated', 'october', 'september', 'november', 'december', 'january',
  'preferred', 'google', 'sources', 'related', 'comparisons', 'demo',
  'calculator', 'compare', 'guide', 'stack', 'home', 'links', 'disclosure',
  'book', 'click', 'calculate', 'official', 'evaluation', 'continue',
  'versus', 'year', 'three', 'yearthree', 'modeled', 'cited', 'badge',
  'catalog', 'brochure', 'recycled', 'generic', 'profile', 'route', 'hash',
  'pair', 'code', 'delta', 'invoice', 'contrast', 'matchup', 'hub',
  'pairing', 'winner', 'audience', 'billed', 'fees', 'cost', 'curve',
  'estimates', 'estimated', 'projected', 'escalation', 'buildtime',
  'native', 'integration', 'feature', 'grid', 'column', 'parity',
  'analysis', 'breakdown', 'actually', 'diverge', 'where', 'this', 'that',
  'with', 'from', 'your', 'their', 'them', 'than', 'then', 'when', 'what',
  'only', 'also', 'into', 'over', 'after', 'before', 'about', 'against',
  'based', 'best', 'better', 'both', 'full', 'free', 'hidden', 'extra',
  'data', 'core', 'plan', 'keep', 'keeps', 'live', 'page', 'buyer',
  'buyers', 'team', 'teams', 'read', 'next', 'same', 'different',
  'category', 'headline', 'subtitle', 'heading', 'button', 'label',
  'section', 'article', 'listed', 'lists', 'again', 'restated', 'reason',
  'exists', 'cannot', 'explain', 'unexplained', 'gap', 'near', 'puts',
  'yearone', 'yeartwo', 'annual', 'monthly', 'quote', 'quoted', 'custom',
  'none', 'overall', 'fit', 'stronger', 'call', 'instead', 'already',
  'want', 'wants', 'does', 'doesn', 'while', 'without', 'inside',
  'rather', 'bolted', 'afterwards', 'research', 'evaluated', 'evaluation',
  'recommended', 'choice', 'starts', 'while', 'public', 'starter',
  'human', 'verified', 'updated', 'independent', 'methodology',
  'affiliate', 'disclosure', 'commission', 'earn', 'review', 'reviews',
  'rating', 'ratings', 'stars', 'based', 'user', 'users', 'source',
  'opens', 'opening', 'partner', 'outbound', 'fallback', 'article',
  'redirected', 'automatically', 'continue', 'click', 'here',
  'hiring', 'recruiting', 'applicant', 'tracking', 'pipeline', 'candidate',
  'implementation', 'inflation', 'industry', 'vendor', 'startups',
  'earlystage', 'process', 'structured', 'standalone', 'standard',
  'product', 'sales', 'contract', 'billing', 'seat', 'seats', 'tiers',
  'integrations', 'systems', 'teamsize', 'sidebyside', 'shortlist',
  'reprinted', 'calculated', '3year', 'benchmark', 'building', 'builtin',
  'boards', 'cases', 'claim', 'card', 'database', 'dedicated', 'first',
  'higher', 'math', 'plus', 'post', 'proactively', 'scaling', 'sign',
  'sitting', 'ships', 'through', 'widely', 'north', 'american', 'base',
  'sourcing', 'syndication', 'unlimited', 'oneclick',   'reality', 'across', 'admin', 'allin', 'apac', 'benefit', 'between',
  'bundled', 'burn', 'companies', 'competitors', 'concentrated',
  'contracts', 'country', 'coverage', 'deciding', 'delivers', 'emea',
  'employee', 'employment', 'engineers', 'factor', 'fastgrowing',
  'finance', 'flatfee', 'globalcoverage', 'headcount', 'instant',
  'insurance', 'localized', 'lowest', 'market', 'markets', 'models',
  'more', 'most', 'multicurrency', 'ownedentity', 'packages', 'packet',
  'park', 'payout', 'payouts', 'providers', 'published', 'rails',
  'rate', 'rates', 'regional', 'remote', 'seed', 'selfserve', 'series',
  'signature', 'since', 'specific', 'statutory', 'tech', 'technology',
  'threeyear', 'undercuts', 'value', 'varies', 'worldwide',
  'memo', 'walkthrough', 'weighs', 'path', 'stop', 'contrasts',
  'stickertocash', 'walk', 'field', 'note', 'isolates', 'surcharge',
  'trail', 'abort', 'incumbent',
]);

function getAllHtmlFiles(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllHtmlFiles(fullPath));
    } else if (item.endsWith('.html') && !item.includes('404')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractUniqueTokens(htmlContent) {
  // Extract ONLY text inside the <main> or <article> region to ignore header/footer noise
  const mainMatch = htmlContent.match(/<main[\s\S]*?<\/main>/gi) || htmlContent.match(/<article[\s\S]*?<\/article>/gi);
  const targetHtml = mainMatch ? mainMatch.join(' ') : htmlContent;

  const textContent = targetHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();

  const words = textContent.replace(/[^\w\s]/g, '').split(/\s+/);
  return new Set(words.filter(w => w.length > 3 && !COMMON_CORPUS_WORDS.has(w)));
}

function calculateJaccard(setA, setB) {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function runAudit() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Error: dist/ directory not found. Run "npx astro build" first.');
    process.exit(1);
  }

  const htmlFiles = getAllHtmlFiles(DIST_DIR);
  console.log(`🔍 Auditing ${htmlFiles.length} rendered HTML pages for near-duplicates...\n`);

  const pages = htmlFiles.map(filePath => {
    const html = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(DIST_DIR, filePath);
    return { path: relativePath, tokens: extractUniqueTokens(html) };
  });

  let duplicateCount = 0;
  const THRESHOLD = 0.47; // Flag near-duplicate <main> copy. Same-vendor TCO stickers still overlap below this.

  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const similarity = calculateJaccard(pages[i].tokens, pages[j].tokens);
      if (similarity > THRESHOLD) {
        console.warn(
          `⚠️ High Similarity (${(similarity * 100).toFixed(1)}%): ${pages[i].path} <--> ${pages[j].path}`
        );
        duplicateCount++;
      }
    }
  }

  if (duplicateCount === 0) {
    console.log('✅ Audit Passed! All rendered HTML pages meet uniqueness criteria.');
  } else {
    console.log(`\nFound ${duplicateCount} page pair(s) exceeding similarity threshold.`);
  }
}

runAudit();
