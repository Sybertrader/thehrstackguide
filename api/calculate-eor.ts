import {
  MAX_CONTRACTOR_HEADCOUNT,
  MAX_EOR_HEADCOUNT,
  buildEorCostEstimate,
  parseHeadcount,
} from '../src/lib/eor-cost-api';

type NodeReq = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

type NodeRes = {
  setHeader: (name: string, value: string) => NodeRes | void;
  status: (code: number) => NodeRes;
  json: (body: unknown) => void;
  end: () => void;
};

const CORS = {
  origin: '*',
  methods: 'GET, OPTIONS',
  headers: 'Content-Type',
};

function applyCors(res: NodeRes) {
  res.setHeader('Access-Control-Allow-Origin', CORS.origin);
  res.setHeader('Access-Control-Allow-Methods', CORS.methods);
  res.setHeader('Access-Control-Allow-Headers', CORS.headers);
}

function requestUrl(req: NodeReq): URL {
  const hostHeader = req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader || 'www.thehrstackguide.com';
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || 'https';
  return new URL(req.url || '/', `${proto}://${host}`);
}

export default function handler(req: NodeReq, res: NodeRes) {
  applyCors(res);
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', CORS.methods);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = requestUrl(req);
  const eorCount = parseHeadcount(url.searchParams.get('eor'), MAX_EOR_HEADCOUNT);
  const contractorCount = parseHeadcount(url.searchParams.get('contractors'), MAX_CONTRACTOR_HEADCOUNT);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json(buildEorCostEstimate(eorCount, contractorCount));
}
