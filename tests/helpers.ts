import request from 'supertest';
import type { Express } from 'express';

export async function login(app: Express, email: string): Promise<string> {
  const res = await request(app)
    .post('/auth/login')
    .send({ email, password: 'Secret123' });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return res.body.accessToken;
}

export function makeOrderPayload(overrides: Partial<{ items: unknown }> = {}) {
  return { items: [{ sku: 'SKU-A', price: 500, qty: 1 }], ...overrides };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function createOrder(app: Express, token: string) {
  const res = await request(app)
    .post('/orders')
    .set(bearer(token))
    .send(makeOrderPayload());
  if (res.status !== 201) throw new Error(`create failed: ${res.status}`);
  return res.body as { id: string; status: string };
}

export async function patchStatus(
  app: Express,
  token: string,
  id: string,
  status: unknown,
) {
  return request(app)
    .patch(`/orders/${id}/status`)
    .set(bearer(token))
    .send({ status });
}
