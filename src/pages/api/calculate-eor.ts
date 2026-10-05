import type { APIRoute } from 'astro';
import {
  MAX_CONTRACTOR_HEADCOUNT,
  MAX_EOR_HEADCOUNT,
  buildEorCostEstimate,
  parseHeadcount,
} from '../../lib/eor-cost-api';

// Force a Vercel serverless function in `output: 'static'` mode.
export const prerender = false;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...CORS_HEADERS,
    },
  });
}

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const eorCount = parseHeadcount(url.searchParams.get('eor'), MAX_EOR_HEADCOUNT);
  const contractorCount = parseHeadcount(url.searchParams.get('contractors'), MAX_CONTRACTOR_HEADCOUNT);

  return jsonResponse(buildEorCostEstimate(eorCount, contractorCount));
};
