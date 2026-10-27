import express from 'express';
import { randomUUID } from 'node:crypto';

type Tier = 'basic' | 'silver' | 'gold';
export type OrderStatus = 'new' | 'paid' | 'shipped';

interface Item {
  sku: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  ownerId: string;
  tier: Tier;
  status: OrderStatus;
  items: Item[];
  subtotal: number;
  total: number;
  createdAt: string;
}

const USERS = [
  { id: 'u1', email: 'alice@example.com', password: 'Secret123', tier: 'gold' as Tier },
  { id: 'u2', email: 'bob@example.com', password: 'Secret123', tier: 'basic' as Tier },
];

const DISCOUNT: Record<Tier, number> = { basic: 0, silver: 0.05, gold: 0.1 };

const STATUSES: OrderStatus[] = ['new', 'paid', 'shipped'];

// Єдиний дозволений наступний статус для кожного поточного: new → paid → shipped
const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  new: 'paid',
  paid: 'shipped',
  shipped: null,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function toPublic({ ownerId, ...rest }: Order) {
  return rest;
}

export function createApp() {
  const app = express();
  app.use(express.json());

  const tokens = new Map<string, string>();
  const orders = new Map<string, Order>();

  app.post('/auth/login', (req, res) => {
    const user = USERS.find(
      (u) => u.email === req.body?.email && u.password === req.body?.password,
    );
    if (!user) {
      res.status(401).json({ code: 'INVALID_CREDENTIALS' });
      return;
    }
    const token = randomUUID();
    tokens.set(token, user.id);
    res.json({ accessToken: token });
  });

  app.use('/orders', (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = token ? tokens.get(token) : undefined;
    if (!userId) {
      res.status(401).json({ code: 'UNAUTHORIZED' });
      return;
    }
    res.locals.user = USERS.find((u) => u.id === userId);
    next();
  });

  app.post('/orders', (req, res) => {
    const items: Item[] = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ code: 'EMPTY_ORDER' });
      return;
    }
    for (const i of items) {
      if (typeof i.price !== 'number' || i.price < 0) {
        res.status(400).json({ code: 'INVALID_PRICE' });
        return;
      }
      if (!Number.isInteger(i.qty) || i.qty <= 0) {
        res.status(400).json({ code: 'INVALID_QTY' });
        return;
      }
    }
    const user = res.locals.user;
    const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0));
    let rate = DISCOUNT[user.tier as Tier];
    if (subtotal >= 2000) rate += 0.05;
    const afterDiscount = round2(subtotal * (1 - Math.min(rate, 0.25)));
    const total = round2(afterDiscount + (afterDiscount >= 1000 ? 0 : 60));
    const order: Order = {
      id: randomUUID(),
      ownerId: user.id,
      tier: user.tier,
      status: 'new',
      items,
      subtotal,
      total,
      createdAt: new Date().toISOString(),
    };
    orders.set(order.id, order);
    res.status(201).location(`/orders/${order.id}`).json(toPublic(order));
  });

  app.get('/orders', (_req, res) => {
    const mine = [...orders.values()].filter((o) => o.ownerId === res.locals.user.id);
    res.json(mine.map(toPublic));
  });

  app.get('/orders/:id', (req, res) => {
    const order = orders.get(req.params.id);
    if (!order || order.ownerId !== res.locals.user.id) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.json(toPublic(order));
  });

  // Розширення за варіантом 1: зміна статусу замовлення
  app.patch('/orders/:id/status', (req, res) => {
    const order = orders.get(req.params.id);
    if (!order || order.ownerId !== res.locals.user.id) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const target = req.body?.status;
    if (typeof target !== 'string' || !STATUSES.includes(target as OrderStatus)) {
      res.status(400).json({ code: 'INVALID_STATUS' });
      return;
    }
    if (NEXT_STATUS[order.status] !== target) {
      res.status(409).json({ code: 'INVALID_TRANSITION', from: order.status, to: target });
      return;
    }
    order.status = target as OrderStatus;
    res.json(toPublic(order));
  });

  app.delete('/orders/:id', (req, res) => {
    const order = orders.get(req.params.id);
    if (!order || order.ownerId !== res.locals.user.id) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    orders.delete(order.id);
    res.status(204).end();
  });

  return app;
}
