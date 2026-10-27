import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { login, makeOrderPayload, bearer } from './helpers';

describe('POST /orders', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(async () => {
    app = createApp(); // свіжий стан
    token = await login(app, 'bob@example.com'); // basic
  });

  it('створює замовлення: 201, Location, розрахована сума', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOrderPayload());

    expect(res.status).toBe(201); // рівень 1
    expect(res.body.total).toBeCloseTo(560, 2); // рівень 3: 500 + 60
    expect(res.headers.location).toBe(`/orders/${res.body.id}`); // рівень 4
  });

  it('нове замовлення має статус new і формат JSON', async () => {
    const res = await request(app)
      .post('/orders')
      .set(bearer(token))
      .send(makeOrderPayload());

    expect(res.body.status).toBe('new');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('створене замовлення доступне за GET', async () => {
    const created = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOrderPayload());

    const fetched = await request(app)
      .get(`/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fetched.status).toBe(200); // рівень 5
    expect(fetched.body).toEqual(created.body);
  });

  it.each([
    { name: 'порожній список', code: 'EMPTY_ORDER', items: [] },
    { name: 'відсутнє поле items', code: 'EMPTY_ORDER', items: undefined },
    { name: 'від’ємна ціна', code: 'INVALID_PRICE', items: [{ sku: 'A', price: -1, qty: 1 }] },
    { name: 'ціна-рядок', code: 'INVALID_PRICE', items: [{ sku: 'A', price: '10', qty: 1 }] },
    { name: 'нульова кількість', code: 'INVALID_QTY', items: [{ sku: 'A', price: 10, qty: 0 }] },
    { name: 'дробова кількість', code: 'INVALID_QTY', items: [{ sku: 'A', price: 10, qty: 1.5 }] },
  ])('відхиляє: $name → $code', async ({ items, code }) => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(code);
  });

  it('після відхиленого запиту замовлення не з’являється у списку', async () => {
    await request(app).post('/orders').set(bearer(token)).send({ items: [] });
    const list = await request(app).get('/orders').set(bearer(token));
    expect(list.body).toEqual([]);
  });
});

describe('розрахунок суми замовлення', () => {
  it.each([
    { user: 'bob@example.com', price: 500, expected: 560 }, // доставка 60
    { user: 'bob@example.com', price: 1000, expected: 1000 }, // безкоштовна доставка
    { user: 'bob@example.com', price: 1999, expected: 1999 }, // межа −1: знижки немає
    { user: 'bob@example.com', price: 2000, expected: 1900 }, // межа: бонус 5 %
    { user: 'alice@example.com', price: 1000, expected: 960 }, // 900 + 60
    { user: 'alice@example.com', price: 2500, expected: 2125 }, // 10 % + 5 %
  ])(
    '$user, сума $price → до сплати $expected',
    async ({ user, price, expected }) => {
      const app = createApp();
      const token = await login(app, user);
      const res = await request(app)
        .post('/orders')
        .set(bearer(token))
        .send({ items: [{ sku: 'SKU-A', price, qty: 1 }] });

      expect(res.status).toBe(201);
      expect(res.body.total).toBeCloseTo(expected, 2);
    },
  );
});
