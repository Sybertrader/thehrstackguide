import type { APIRoute } from 'astro';
import { GET as handler, OPTIONS as optionsHandler } from './calculate-eor';

// Alias of /api/calculate-eor so GPT Actions and crawlers that expect a .json
// suffix still hit a serverless function (`output: 'static'`).
export const prerender = false;

export const GET: APIRoute = (context) => handler(context);

export const OPTIONS: APIRoute = (context) => optionsHandler(context);
