import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, REFUND_URL } from './msw/server';
import { HttpPaymentGateway } from '../src/payment-gateway';

const gateway = new HttpPaymentGateway('https://payments.example.com');

describe('HttpPaymentGateway', () => {
  it('повертає ідентифікатор повернення з успішної відповіді', async () => {
    await expect(gateway.refund('P-1', 500)).resolves.toEqual({
      refundId: 'R-100',
    });
  });

  it('відхиляє відповідь зі статусом 503 кодом REFUND_UNAVAILABLE', async () => {
    server.use(
      http.post(REFUND_URL, () => new HttpResponse(null, { status: 503 })),
    );
    await expect(gateway.refund('P-1', 500)).rejects.toThrow(
      'REFUND_UNAVAILABLE',
    );
  });

  it('відхиляє відповідь зі статусом 500 кодом REFUND_UNAVAILABLE', async () => {
    server.use(
      http.post(REFUND_URL, () => new HttpResponse(null, { status: 500 })),
    );
    await expect(gateway.refund('P-1', 500)).rejects.toThrow(
      'REFUND_UNAVAILABLE',
    );
  });

  it('відхиляє відповідь зі статусом 404 кодом PAYMENT_NOT_FOUND', async () => {
    server.use(
      http.post(REFUND_URL, () => new HttpResponse(null, { status: 404 })),
    );
    await expect(gateway.refund('P-404', 500)).rejects.toThrow(
      'PAYMENT_NOT_FOUND',
    );
  });

  it.each([
    { name: 'refundId — число', body: { refundId: 123 } },
    { name: 'refundId — порожній рядок', body: { refundId: '' } },
    { name: 'поле refundId відсутнє', body: { status: 'ok' } },
    { name: 'тіло відповіді — null', body: null },
  ])('відхиляє некоректний формат: $name', async ({ body }) => {
    server.use(http.post(REFUND_URL, () => HttpResponse.json(body)));
    await expect(gateway.refund('P-1', 500)).rejects.toThrow(
      'INVALID_REFUND_FORMAT',
    );
  });

  it('відхиляє відповідь, що не є JSON', async () => {
    server.use(http.post(REFUND_URL, () => new HttpResponse('not json')));
    await expect(gateway.refund('P-1', 500)).rejects.toThrow();
  });

  it('надсилає у запиті платіж, суму та заголовок JSON', async () => {
    let body: unknown;
    let contentType: string | null = null;
    server.use(
      http.post(REFUND_URL, async ({ request }) => {
        body = await request.json();
        contentType = request.headers.get('Content-Type');
        return HttpResponse.json({ refundId: 'R-1' });
      }),
    );
    await gateway.refund('P-7', 250.5);
    expect(body).toEqual({ paymentId: 'P-7', amount: 250.5 });
    expect(contentType).toBe('application/json');
  });

  it('опрацьовує мережеву помилку', async () => {
    server.use(http.post(REFUND_URL, () => HttpResponse.error()));
    await expect(gateway.refund('P-1', 500)).rejects.toThrow();
  });
});
