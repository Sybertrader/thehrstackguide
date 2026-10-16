export interface VendorContrast {
  bestFor: string;
  strengths: string[];
  tradeoffs: string[];
}

const ADDON_ALIASES: Record<string, string> = {
  texting: 'SMS candidate texting',
  'candidate texting': 'SMS candidate texting',
  'sms': 'SMS candidate texting',
  'video interviewing': 'Video interviewing',
  'video interviews': 'Video interviewing',
  'video screening': 'Video interviewing',
  assessments: 'Assessments',
  'candidate assessments': 'Assessments',
};

function tidy(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[.;]+$/, '');
}

function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function finish(text: string): string {
  const value = tidy(text);
  if (!value) return '';
  return `${capitalize(value)}.`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function formatAddonFees(rest: string): string {
  const parts = rest
    .split(/\s*,\s*|\s+and\s+/i)
    .map((part) => tidy(part))
    .filter(Boolean);
  const named = parts.map((part) => ADDON_ALIASES[part.toLowerCase()] ?? capitalize(part));
  const verb = named.length === 1 ? 'requires' : 'require';
  return `${joinList(named)} ${verb} paid add-on packages.`;
}

function readsAsClause(text: string): boolean {
  return /[.!?;]/.test(text) || /\b(is|are|was|were|can|cannot|can't|takes|take|lacks|lack|trails|trail|requires|require|sits|sit|does|do|don't|equals|equal|fit|fits|push|pushes|advertise|advertises|confirm|complements|complement|replaces|replace|sold|focused|focuses|relies|rely|geared|holds|hold|includes|include|needs|need|costs|cost|owns|own)\b/i.test(text);
}

/** Turn a CSV con fragment into one procurement sentence. */
export function formatWatchout(raw: string): string {
  const text = tidy(raw);
  if (!text) return '';

  const addon = text.match(/^add-on fees for (.+)$/i);
  if (addon?.[1]) return formatAddonFees(addon[1]);

  if (/^no self-serve free trial;\s*requires a sales demo$/i.test(text)) {
    return 'There is no self-serve free trial. Pricing requires a sales demo.';
  }
  if (/^only sold\b/i.test(text)) return finish(`It is ${text.charAt(0).toLowerCase()}${text.slice(1)}`);
  if (/^primarily focused\b/i.test(text)) return finish(`It is ${text.charAt(0).toLowerCase()}${text.slice(1)}`);
  if (/^relies on\b/i.test(text)) return finish(`It ${text.charAt(0).toLowerCase()}${text.slice(1)}`);

  const geared = text.match(/^(.+?) geared to (.+)$/i);
  if (geared?.[1] && geared[2]) return `${capitalize(geared[1])} is geared to ${geared[2]}.`;

  if (readsAsClause(text)) return finish(text);

  const less = text.match(/^less depth for (.+)$/i);
  if (less?.[1]) return `It has less depth for ${less[1]}.`;

  const limited = text.match(/^limited (.+)$/i);
  if (limited?.[1]) return `${capitalize(limited[1])} is limited.`;

  const slower = text.match(/^slower (.+?) than (.+)$/i);
  if (slower?.[1] && slower[2]) return `${capitalize(slower[1])} is slower than ${slower[2]}.`;

  const fewerThan = text.match(/^fewer (.+?) than (.+)$/i);
  if (fewerThan?.[1] && fewerThan[2]) return `It offers fewer ${fewerThan[1]} than ${fewerThan[2]}.`;

  const fewer = text.match(/^fewer (.+)$/i);
  if (fewer?.[1]) return `It offers fewer ${fewer[1]}.`;

  const steeper = text.match(/^steeper (.+?) for (.+)$/i);
  if (steeper?.[1] && steeper[2]) return `The ${steeper[1]} for ${steeper[2]} is steeper.`;

  const smaller = text.match(/^smaller (.+)$/i);
  if (smaller?.[1]) return `It has a smaller ${smaller[1]}.`;

  const higher = text.match(/^higher (.+?) than (.+)$/i);
  if (higher?.[1] && higher[2]) return `The ${higher[1]} is higher than ${higher[2]}.`;

  const narrower = text.match(/^narrower (.+?) versus (.+)$/i);
  if (narrower?.[1] && narrower[2]) return `${capitalize(narrower[1])} is narrower than ${narrower[2]}.`;

  if (/^enterprise sales cycle\b/i.test(text)) {
    return 'Full platform access requires an enterprise sales cycle.';
  }

  if (/^domestic-first /i.test(text)) {
    return 'Benefits administration is domestic-first, with limited non-US statutory coverage.';
  }

  if (/^no published /i.test(text)) return finish(text.replace(/^no published /i, 'There is no published '));

  const missing = text.match(/^no (.+)$/i);
  if (missing?.[1]) return `There is no ${missing[1]}.`;

  return finish(text);
}

function formatStrength(raw: string): string {
  const text = tidy(raw);
  if (!text) return '';
  const readsAsClause = /\b(is|are|can|cannot|takes|lacks|requires|require|sits|does)\b/i.test(text);
  if (text.length > 90 || readsAsClause) return finish(text);
  return capitalize(text);
}

function bestForLabel(badge: string): string {
  const stripped = tidy(badge).replace(/^best for\s+/i, '');
  return stripped ? capitalize(stripped) : '';
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function takeUnique(items: string[], limit: number, seen: Set<string>): string[] {
  const picked: string[] = [];
  for (const item of items) {
    const key = normalizeKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    picked.push(item);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function buildVendorContrast(args: {
  badge?: string;
  features?: string[];
  pros?: string[];
  cons?: string[];
}): VendorContrast {
  const seen = new Set<string>();
  const strengthSource = [...(args.pros ?? []), ...(args.features ?? [])].map(formatStrength);
  const strengths = takeUnique(strengthSource, 3, seen);
  const tradeoffs = takeUnique((args.cons ?? []).map(formatWatchout), 2, seen);
  return {
    bestFor: bestForLabel(args.badge ?? ''),
    strengths,
    tradeoffs,
  };
}
