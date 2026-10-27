import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { login, makeOrderPayload, createOrder, bearer } from './helpers';
import { expectSchema, validateSchema } from './schema';
import { orderSchema, orderListSchema } from './schemas/order.schema';

describe('контракт відповідей', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(async () => {
    app = createApp();
    token = await login(app, 'bob@example.com');
  });

  it('відповідь POST /orders відповідає контракту', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOrderPayload());

    expectSchema(res.body, orderSchema);
  });

  it('відповідь GET /orders/:id відповідає контракту', async () => {
    const order = await createOrder(app, token);
    const res = await request(app).get(`/orders/${order.id}`).set(bearer(token));

    expectSchema(res.body, orderSchema);
  });

  it('відповідь GET /orders відповідає контракту списку', async () => {
    await createOrder(app, token);
    await createOrder(app, token);
    const res = await request(app).get('/orders').set(bearer(token));

    expect(res.body).toHaveLength(2);
    expectSchema(res.body, orderListSchema);
  });

  it('схема відхиляє зайве поле (витік внутрішніх даних)', async () => {
    const order = await createOrder(app, token);
    const leaked = { ...order, ownerId: 'u2' };

    const errors = validateSchema(leaked, orderSchema);

    expect(errors).toHaveLength(1);
    expect(errors[0].keyword).toBe('additionalProperties');
    expect(errors[0].params).toEqual({ additionalProperty: 'ownerId' });
  });

  it('схема відхиляє відсутнє обов’язкове поле', async () => {
    const order = await createOrder(app, token);
    const { total, ...withoutTotal } = order as Record<string, unknown>;

    const errors = validateSchema(withoutTotal, orderSchema);

    expect(errors.map((e) => e.keyword)).toContain('required');
  });
});
