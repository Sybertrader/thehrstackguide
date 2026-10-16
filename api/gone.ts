import { GONE_HEADERS, GONE_HTML, GONE_STATUS, GONE_STATUS_TEXT } from '../src/lib/gone.js';

export const config = {
  runtime: 'nodejs',
};

export default function handler() {
  return new Response(GONE_HTML, {
    status: GONE_STATUS,
    statusText: GONE_STATUS_TEXT,
    headers: GONE_HEADERS,
  });
}
