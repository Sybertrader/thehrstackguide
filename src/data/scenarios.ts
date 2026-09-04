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
    'High-growth technology startups and distributed teams scaling global payroll, compliance, and remote operations.',
  enterprise:
    'Global enterprise organizations requiring multi-entity payroll, custom HRIS integrations, and strict compliance security.',
  scaleups:
    'Fast-scaling companies expanding headcount across multiple regions while streamlining core HR workflows.',
  smb: 'Lean businesses and growing teams looking for automated domestic payroll, benefits administration, and simple HR operations.',
  'global-remote':
    'Distributed companies managing cross-border contractors, international EOR employees, and foreign currency payouts.',
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

type ChildHeroVertical = 'ats' | 'payroll' | 'pm';

/** Child-page hero subheads: one description per vertical × persona. */
export const CHILD_HERO_SUBTITLES: Record<ChildHeroVertical, Record<string, string>> = {
  ats: {
    startups:
      'Early-stage startups building structured candidate pipelines and scaling headcount without complex HR overhead.',
    scaleups:
      'Fast-scaling companies expanding hiring teams, automating candidate scheduling, and optimizing funnel analytics.',
    enterprise:
      'Enterprise talent acquisition teams managing multi-department requisitions, offer approvals, and talent CRMs.',
    agencies:
      'Staffing and recruitment agencies managing multi-client candidate pipelines, requisitions, and placement tracking.',
    'remote-teams':
      'Distributed teams sourcing international candidates and coordinating multi-time-zone interview loops.',
  },
  payroll: {
    startups:
      'Early-stage startups and distributed teams hiring global contractors and employees compliant across borders.',
    scaleups:
      'High-growth scaleups consolidating international entities, multi-currency payroll, and local tax filings.',
    agencies:
      'Design, dev, and marketing agencies managing client-billable contractor payouts and international worker records.',
    'us-latam':
      'US technology companies expanding nearshore engineering and operations teams across Latin America.',
    'web3-crypto':
      'Web3 protocols and DAOs managing global contributor payouts, stablecoin settlements, and token grant vesting.',
  },
  pm: {
    startups:
      'Startups implementing lightweight 1:1 check-in habits, goal alignment, and continuous manager feedback.',
    scaleups:
      'Growing companies formalizing 360-degree review cycles, OKRs, and performance calibration sessions.',
    enterprise:
      'Enterprise People Ops teams running structured talent reviews, 9-box matrices, and compensation alignment.',
    'people-ops':
      'People Operations leads automating review cycle logistics, engagement surveys, and manager enablement.',
    'remote-teams':
      'Remote-first companies building asynchronous feedback habits, virtual check-ins, and distributed engagement tracking.',
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
  family: ChildHeroVertical | null | undefined,
  nicheId: string,
  nicheName: string,
  fallback?: string
): string {
  const personaId = publicPersonaId(nicheId);
  const mapped = family ? CHILD_HERO_SUBTITLES[family][personaId] : undefined;
  if (mapped) return mapped;
  return resolveScenarioSubtitle(nicheId, nicheName, fallback);
}
