import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { login, makeOrderPayload, createOrder, bearer } from './helpers';
import { expectSchema } from './schema';
import { loginSchema, errorSchema } from './schemas/order.schema';

describe('POST /auth/login', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('видає токен за правильних облікових даних', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'Secret123' });

    expect(res.status).toBe(200);
    expectSchema(res.body, loginSchema);
  });

  it.each([
    { name: 'хибний пароль', body: { email: 'bob@example.com', password: 'wrong' } },
    { name: 'невідомий користувач', body: { email: 'nobody@example.com', password: 'Secret123' } },
    { name: 'порожнє тіло', body: {} },
  ])('відхиляє: $name → 401', async ({ body }) => {
    const res = await request(app).post('/auth/login').send(body);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
    expectSchema(res.body, errorSchema);
  });
});

describe('Доступ до замовлень', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it.each([
    { name: 'без токена', header: undefined },
    { name: 'підроблений токен', header: 'Bearer invalid-token' },
    { name: 'без префікса Bearer', header: 'some-token' },
  ])('GET /orders $name → 401', async ({ header }) => {
    const req = request(app).get('/orders');
    if (header) req.set('Authorization', header);
    const res = await req;

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
    expectSchema(res.body, errorSchema);
  });

  it.each([
    { method: 'get', url: '/orders' },
    { method: 'post', url: '/orders' },
    { method: 'get', url: '/orders/any-id' },
    { method: 'patch', url: '/orders/any-id/status' },
    { method: 'delete', url: '/orders/any-id' },
  ] as const)('$method $url без токена → 401', async ({ method, url }) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });

  it('чуже замовлення повертає 404, а не 403', async () => {
    const alice = await login(app, 'alice@example.com');
    const bob = await login(app, 'bob@example.com');
    const created = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${alice}`)
      .send(makeOrderPayload());

    const res = await request(app)
      .get(`/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${bob}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('список містить лише власні замовлення', async () => {
    const alice = await login(app, 'alice@example.com');
    const bob = await login(app, 'bob@example.com');
    await request(app).post('/orders').set('Authorization', `Bearer ${alice}`).send(makeOrderPayload());
    await request(app).post('/orders').set('Authorization', `Bearer ${bob}`).send(makeOrderPayload());

    const res = await request(app).get('/orders').set('Authorization', `Bearer ${bob}`);

    expect(res.body).toHaveLength(1);
  });

  it('чужий користувач не може видалити замовлення, власник його зберігає', async () => {
    const alice = await login(app, 'alice@example.com');
    const bob = await login(app, 'bob@example.com');
    const order = await createOrder(app, alice);

    const res = await request(app).delete(`/orders/${order.id}`).set(bearer(bob));
    expect(res.status).toBe(404);

    const stillThere = await request(app).get(`/orders/${order.id}`).set(bearer(alice));
    expect(stillThere.status).toBe(200);
  });
});
