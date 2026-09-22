/**
 * Buyer-group subtitle dictionary for comparison pages.
 *
 * Maps every scenario route onto one of five inclusive, high-intent
 * descriptions so hero subtitles never disqualify a reader with stage,
 * headcount, or role-specific language (e.g. "Seed to Series B",
 * "remote engineers").
 */

export const BUYER_GROUP_SUBTITLES = {
  'tech-startups':
    'Startups hiring globally who need payroll, compliance, and contractor payouts without a specialist in month one.',
  enterprise:
    'Companies that need multi-entity payroll, SSO, and contracts legal will actually sign.',
  scaleups:
    'Teams adding headcount across countries and trying to stop month-end from living in a spreadsheet.',
  smb: 'US-first companies that need payroll, benefits, and tax filings without an HR department.',
  'global-remote':
    'Distributed companies paying contractors or EOR employees across borders, including local currency and crypto rails.',
} as const;

export type BuyerGroupId = keyof typeof BUYER_GROUP_SUBTITLES;

const NICHE_NAME_TO_GROUP: Record<string, BuyerGroupId> = {
  'Tech Startups': 'tech-startups',
  Startups: 'tech-startups',
  Enterprise: 'enterprise',
  'Mid-Market Scaleups': 'scaleups',
  Scaleups: 'scaleups',
  'People Ops Teams': 'scaleups',
  'Design & Marketing Agencies': 'smb',
  'Staffing & Recruiting Agencies': 'smb',
  'Web3 & Crypto Teams': 'global-remote',
  'US Companies Hiring in LATAM': 'global-remote',
  'Remote-First Teams': 'global-remote',
};

const NICHE_ID_TO_GROUP: Record<string, BuyerGroupId> = {
  'tech-startups': 'tech-startups',
  startups: 'tech-startups',
  enterprise: 'enterprise',
  scaleups: 'scaleups',
  'people-ops': 'scaleups',
  agencies: 'smb',
  'web3-crypto': 'global-remote',
  'us-latam': 'global-remote',
  'remote-teams': 'global-remote',
};

function inferBuyerGroup(nicheId: string, nicheName: string): BuyerGroupId | undefined {
  if (NICHE_NAME_TO_GROUP[nicheName]) return NICHE_NAME_TO_GROUP[nicheName];
  if (NICHE_ID_TO_GROUP[nicheId]) return NICHE_ID_TO_GROUP[nicheId];

  const haystack = `${nicheId} ${nicheName}`.toLowerCase();
  if (haystack.includes('enterprise')) return 'enterprise';
  if (haystack.includes('scaleup') || haystack.includes('mid-market') || haystack.includes('mid market')) {
    return 'scaleups';
  }
  if (/\bsmb\b/.test(haystack) || haystack.includes('small business') || haystack.includes('agenc')) {
    return 'smb';
  }
  if (haystack.includes('startup')) return 'tech-startups';
  if (
    haystack.includes('remote') ||
    haystack.includes('global') ||
    haystack.includes('web3') ||
    haystack.includes('crypto') ||
    haystack.includes('latam') ||
    haystack.includes('distributed')
  ) {
    return 'global-remote';
  }
  return undefined;
}

/**
 * Inclusive hero subtitle for a comparison route. Falls back to the CSV
 * `target_audience` only if the niche cannot be classified, so unpublished
 * or newly added segments still render rather than going blank.
 */
export function resolveScenarioSubtitle(
  nicheId: string,
  nicheName: string,
  fallback?: string
): string {
  const group = inferBuyerGroup(nicheId, nicheName);
  if (group) return BUYER_GROUP_SUBTITLES[group];
  return fallback?.trim() || BUYER_GROUP_SUBTITLES.scaleups;
}

type HeroVertical = 'ats' | 'payroll' | 'pm';

export function resolveHubHeroSubtitle(
  _family: HeroVertical | null | undefined,
  toolAName: string,
  toolBName: string
): string {
  return `An independent side-by-side comparison of pricing, core features, hidden contract terms, and best use cases for ${toolAName} and ${toolBName}.`;
}

/** Child-page hero subheads: one description per vertical × persona. */
export const CHILD_HERO_SUBTITLES: Record<HeroVertical, Record<string, string>> = {
  ats: {
    startups:
      'Founders running the first hiring pipeline without a recruiting-ops hire.',
    scaleups:
      'Teams that need interview kits and conversion reporting as hiring volume doubles.',
    enterprise:
      'TA teams that need OFCCP files, offer chains, and SSO in the contract, not the deck.',
    agencies:
      'Agencies that need client portals and per-account pipelines, not one shared req list.',
    'remote-teams':
      'Interviewers who never share a working day and still have to leave a score.',
  },
  payroll: {
    startups:
      'First overseas contractors or employees, without a payroll specialist in month one.',
    scaleups:
      'Finance wants one invoice. People wants one system of record. Spreadsheets are the failure mode.',
    agencies:
      'Client-billable freelancer payouts that have to reconcile per account.',
    'us-latam':
      'US companies hiring full-time in Mexico, Brazil, or Argentina, including 13th-month pay.',
    'web3-crypto':
      'Contributor payouts in USDC or USDT on the same file as bank transfers.',
  },
  pm: {
    startups:
      'Weekly 1:1s and a first review cycle without a six-month implementation.',
    scaleups:
      'OKRs and reviews in one system before a third survey tool shows up.',
    enterprise:
      'Compensation calibration that has to survive legal, not a sandbox demo.',
    'people-ops':
      'Engagement, calibration, and reviews in one console. No CSV export to start the cycle.',
    'remote-teams':
      'Reviews across time zones with no hallway context and no shared working day.',
  },
};

function publicPersonaId(nicheId: string): string {
  return nicheId === 'tech-startups' ? 'startups' : nicheId;
}

/**
 * Child-route hero subheading from the active vertical and persona.
 * Falls back to the inclusive buyer-group subtitle if a pair is unmapped.
 */
export function resolveChildHeroSubtitle(
  family: HeroVertical | null | undefined,
  nicheId: string,
  nicheName: string,
  fallback?: string
): string {
  const personaId = publicPersonaId(nicheId);
  const mapped = family ? CHILD_HERO_SUBTITLES[family][personaId] : undefined;
  if (mapped) return mapped;
  return resolveScenarioSubtitle(nicheId, nicheName, fallback);
}
