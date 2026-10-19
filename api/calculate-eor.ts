import {
  MAX_CONTRACTOR_HEADCOUNT,
  MAX_EOR_HEADCOUNT,
  buildEorCostEstimate,
  parseHeadcount,
} from '../src/lib/eor-cost-api.js';

export const config = {
  runtime: 'nodejs',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_HEADERS,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        Allow: 'GET, OPTIONS',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  const url = new URL(request.url);
  const eorCount = parseHeadcount(url.searchParams.get('eor'), MAX_EOR_HEADCOUNT);
  const contractorCount = parseHeadcount(url.searchParams.get('contractors'), MAX_CONTRACTOR_HEADCOUNT);
  const salaryRaw = Number.parseFloat(url.searchParams.get('salary') ?? '');
  const averageMonthlySalary = Number.isFinite(salaryRaw) && salaryRaw > 0 ? salaryRaw : 0;
  const vendor = url.searchParams.get('vendor');

  return new Response(
    JSON.stringify(buildEorCostEstimate(eorCount, contractorCount, new Date(), { vendor, averageMonthlySalary })),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
