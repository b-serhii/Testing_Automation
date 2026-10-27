import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { login, createOrder, patchStatus, bearer } from './helpers';
import { expectSchema } from './schema';
import {
  orderSchema,
  errorSchema,
  transitionErrorSchema,
} from './schemas/order.schema';

describe('PATCH /orders/:id/status', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;
  let orderId: string;

  const currentStatus = async () => {
    const res = await request(app).get(`/orders/${orderId}`).set(bearer(token));
    return res.body.status;
  };

  beforeEach(async () => {
    app = createApp(); // власний застосунок і власні дані
    token = await login(app, 'bob@example.com');
    orderId = (await createOrder(app, token)).id;
  });

  describe('допустимі переходи', () => {
    it('new → paid: 200, структура за схемою, значення, заголовок', async () => {
      const res = await patchStatus(app, token, orderId, 'paid');

      expect(res.status).toBe(200); // рівень 1
      expectSchema(res.body, orderSchema); // рівень 2
      expect(res.body.status).toBe('paid'); // рівень 3
      expect(res.body.id).toBe(orderId);
      expect(res.headers['content-type']).toMatch(/application\/json/); // рівень 4
    });

    it('зміна статусу зберігається: наступний GET повертає paid', async () => {
      await patchStatus(app, token, orderId, 'paid');

      expect(await currentStatus()).toBe('paid'); // рівень 5
    });

    it('повний ланцюжок new → paid → shipped', async () => {
      const paid = await patchStatus(app, token, orderId, 'paid');
      const shipped = await patchStatus(app, token, orderId, 'shipped');

      expect(paid.status).toBe(200);
      expect(shipped.status).toBe(200);
      expect(shipped.body.status).toBe('shipped');
      expect(await currentStatus()).toBe('shipped');
    });

    it('зміна статусу не змінює суму та позиції замовлення', async () => {
      const before = await request(app).get(`/orders/${orderId}`).set(bearer(token));
      const res = await patchStatus(app, token, orderId, 'paid');

      expect(res.body).toEqual({ ...before.body, status: 'paid' });
    });
  });

  describe('недопустимі переходи → 409', () => {
    it.each([
      { name: 'new → shipped (пропуск paid)', path: [], target: 'shipped', from: 'new' },
      { name: 'new → new (той самий статус)', path: [], target: 'new', from: 'new' },
      { name: 'paid → new (назад)', path: ['paid'], target: 'new', from: 'paid' },
      { name: 'paid → paid (той самий статус)', path: ['paid'], target: 'paid', from: 'paid' },
      { name: 'shipped → paid (назад)', path: ['paid', 'shipped'], target: 'paid', from: 'shipped' },
      { name: 'shipped → shipped (той самий статус)', path: ['paid', 'shipped'], target: 'shipped', from: 'shipped' },
    ])('$name', async ({ path, target, from }) => {
      for (const step of path) await patchStatus(app, token, orderId, step);

      const res = await patchStatus(app, token, orderId, target);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ code: 'INVALID_TRANSITION', from, to: target });
      expectSchema(res.body, transitionErrorSchema);
      expect(await currentStatus()).toBe(from); // статус не змінився
    });
  });

  describe('некоректне значення статусу → 400', () => {
    it.each([
      { name: 'невідомий статус', body: { status: 'cancelled' } },
      { name: 'статус — число', body: { status: 1 } },
      { name: 'статус — null', body: { status: null } },
      { name: 'порожній рядок', body: { status: '' } },
      { name: 'відсутнє поле status', body: {} },
    ])('$name', async ({ body }) => {
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set(bearer(token))
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS');
      expectSchema(res.body, errorSchema);
      expect(await currentStatus()).toBe('new');
    });
  });

  describe('доступ', () => {
    it.each([
      { name: 'без токена', header: undefined },
      { name: 'підроблений токен', header: 'Bearer invalid-token' },
      { name: 'без префікса Bearer', header: 'some-token' },
    ])('$name → 401, статус не змінюється', async ({ header }) => {
      const req = request(app).patch(`/orders/${orderId}/status`);
      if (header) req.set('Authorization', header);
      const res = await req.send({ status: 'paid' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(await currentStatus()).toBe('new');
    });

    it('чуже замовлення → 404, статус власника не змінюється', async () => {
      const alice = await login(app, 'alice@example.com');

      const res = await patchStatus(app, alice, orderId, 'paid');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
      expect(await currentStatus()).toBe('new');
    });

    it('неіснуюче замовлення → 404', async () => {
      const res = await patchStatus(app, token, 'no-such-id', 'paid');

      expect(res.status).toBe(404);
      expectSchema(res.body, errorSchema);
    });
  });
});
