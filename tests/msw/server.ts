import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const RATE_URL = 'https://api.example.com/rate';
export const REFUND_URL = 'https://payments.example.com/refunds';

export const handlers = [
  http.get(RATE_URL, () => HttpResponse.json({ rate: 41.25 })),
  http.post(REFUND_URL, () => HttpResponse.json({ refundId: 'R-100' })),
];

export const server = setupServer(...handlers);
