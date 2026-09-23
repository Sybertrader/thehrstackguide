import type { APIRoute } from 'astro';
import { experimental_evaluate as evaluate } from 'ai';
import { affiliateLinks } from '../../config/affiliates';
import { KEEP_VENDORS } from '../../lib/vendor-catalog';
import toolsJson from '../../data/tools.json';

export const prerender = false;

const MAX_QUERY_LENGTH = 400;
const TOP_MATCHES = 3;

const CATEGORY_LABEL: Record<string, string> = {
  'payroll-eor': 'Global Payroll & EOR',
  ats: 'ATS & Recruiting',
  'performance-management': 'Performance Management',
};

const CATEGORY_HUB: Record<string, string> = {
  'payroll-eor': '/global-payroll-eor/',
  ats: '/applicant-tracking-systems/',
  'performance-management': '/performance-management/',
};

interface ToolRecord {
  name?: string;
  displayName?: string;
  category?: string;
  logo?: string;
  starting_price?: string;
  positioning?: string;
  choose_if?: string[];
  integrations?: string[];
  countries?: string;
  eor_price?: number;
  contractor_price?: number;
}

interface SearchVendor {
  id: string;
  name: string;
  category: string;
  pricing: string;
  pricingSummary: string;
  logo: string;
  features: string[];
  href: string;
}

function gatewayErrorDetail(error: unknown): string {
  const seen = new Set<unknown>();
  const parts: string[] = [];

  function visit(value: unknown, depth: number) {
    if (!value || depth > 5 || seen.has(value) || parts.join('').length > 1200) return;
    if (typeof value !== 'object') return;
    seen.add(value);
    const record = value as Record<string, unknown>;
    if (typeof record.statusCode === 'number') parts.push(`status ${record.statusCode}`);
    if (record.response !== undefined) {
      const rendered = typeof record.response === 'string' ? record.response : JSON.stringify(record.response);
      parts.push(`response ${rendered.slice(0, 500)}`);
    }
    const validation = record.validationError as { message?: string } | undefined;
    if (validation?.message) parts.push(validation.message.slice(0, 300));
    for (const key of ['lastError', 'cause', 'errors']) {
      const next = record[key];
      if (Array.isArray(next)) next.forEach((item) => visit(item, depth + 1));
      else visit(next, depth + 1);
    }
  }

  if (error instanceof Error) parts.push(error.message.slice(0, 240));
  visit(error, 0);
  return parts.join(' | ').replace(/vck_[A-Za-z0-9]+/g, '[redacted]') || 'unknown';
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function pricingLine(tool: ToolRecord): string {
  const parts: string[] = [];
  if (tool.starting_price) parts.push(tool.starting_price);
  if (typeof tool.eor_price === 'number') parts.push(`EOR $${tool.eor_price}/employee/mo`);
  if (typeof tool.contractor_price === 'number') parts.push(`contractors $${tool.contractor_price}/mo`);
  return parts.join(' · ') || 'Quote';
}

function featuresFor(tool: ToolRecord): string[] {
  const features = [...(tool.choose_if ?? []).slice(0, 2)];
  if (tool.countries) features.push(`Coverage: ${tool.countries} countries`);
  for (const integration of (tool.integrations ?? []).slice(0, 4)) {
    features.push(integration);
  }
  return features;
}

function vendorsForSearch(): SearchVendor[] {
  const tools = toolsJson as Record<string, ToolRecord>;
  const vendors: SearchVendor[] = [];

  for (const entry of KEEP_VENDORS) {
    const tool = tools[entry.id];
    if (!tool) continue;
    const categoryId = tool.category ?? entry.category;
    const pricing = pricingLine(tool);
    const summary = tool.positioning?.trim();
    vendors.push({
      id: entry.id,
      name: tool.displayName || tool.name || entry.name,
      category: CATEGORY_LABEL[categoryId] ?? categoryId,
      pricing,
      pricingSummary: summary ? `${pricing}. ${summary}` : pricing,
      logo: tool.logo ?? '',
      features: featuresFor(tool),
      href: affiliateLinks[entry.id] ? `/go/${entry.id}/` : (CATEGORY_HUB[categoryId] ?? '/'),
    });
  }

  return vendors;
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Send a JSON body with a query string.' }, 400);
  }

  const query = typeof (payload as { query?: unknown })?.query === 'string'
    ? (payload as { query: string }).query.trim()
    : '';

  if (!query) return json({ error: 'Query is required.' }, 400);
  if (query.length > MAX_QUERY_LENGTH) {
    return json({ error: `Query must be ${MAX_QUERY_LENGTH} characters or fewer.` }, 400);
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY || import.meta.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    return json({ error: 'Vendor matching is unavailable right now.', latencyMs: 0, matches: [] }, 500);
  }
  process.env.AI_GATEWAY_API_KEY = apiKey;

  const vendors = vendorsForSearch();
  const questions: Record<
    string,
    { type: 'boolean'; instructions: string; criteria: { true: string; false: string } }
  > = {};

  for (const vendor of vendors) {
    questions[vendor.id] = {
      type: 'boolean',
      instructions: `Is ${vendor.name} a strong fit for the HR challenge in state.challenge? Judge only this vendor.`,
      criteria: {
        true: `${vendor.name} is a ${vendor.category} platform priced ${vendor.pricing}. Features: ${vendor.features.join('; ') || 'not published'}.`,
        false: `${vendor.name} is the wrong category, price model, or capability set for the challenge.`,
      },
    };
  }

  const started = performance.now();
  try {
    const result = await evaluate({
      model: 'typesafe-ai/jev',
      state: {
        challenge: query,
        vendors: vendors.map((vendor) => ({
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          pricing: vendor.pricing,
          features: vendor.features,
        })),
      },
      questions,
      providerOptions: {
        gateway: { zeroDataRetention: true },
      },
    });

    const latencyMs = Math.round(performance.now() - started);
    const matches = vendors
      .map((vendor) => {
        const answer = result.answers[vendor.id];
        const probability = answer?.type === 'boolean' ? answer.probability : 0;
        return {
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          pricing: vendor.pricing,
          pricingSummary: vendor.pricingSummary,
          logo: vendor.logo,
          confidence: Math.round(Math.max(0, Math.min(1, probability)) * 100),
          href: vendor.href,
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, TOP_MATCHES);

    return json({ query, latencyMs, matches });
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    console.error('jev-search failed', gatewayErrorDetail(error));
    return json({ error: 'Vendor matching is unavailable right now.', latencyMs, matches: [] }, 502);
  }
};
