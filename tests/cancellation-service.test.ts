import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CancellationService } from '../src/cancellation-service';
import type { Order, PaymentGateway } from '../src/cancellation-service';
import type { Notifier } from '../src/order-service';
import { InMemoryOrderStore } from './fakes/in-memory-order-store';

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'O-1',
  paymentId: 'P-1',
  amount: 500,
  email: 'client@e.com',
  status: 'paid',
  ...overrides,
});

describe('CancellationService', () => {
  let gateway: PaymentGateway;
  let notifier: Notifier;
  let store: InMemoryOrderStore;
  let service: CancellationService;

  beforeEach(() => {
    gateway = { refund: vi.fn().mockResolvedValue({ refundId: 'R-1' }) }; // заглушка + шпигун
    notifier = { send: vi.fn().mockResolvedValue(undefined) }; // шпигун
    store = new InMemoryOrderStore([makeOrder()]); // підробка
    service = new CancellationService(gateway, store, notifier);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('успішне скасування (перевірка стану)', () => {
    it('переводить замовлення у стан cancelled у сховищі', async () => {
      await service.cancelOrder('O-1');
      const saved = await store.findById('O-1');
      expect(saved?.status).toBe('cancelled');
    });

    it('зберігає ідентифікатор повернення коштів', async () => {
      await service.cancelOrder('O-1');
      const saved = await store.findById('O-1');
      expect(saved?.refundId).toBe('R-1');
    });

    it('повертає скасоване замовлення', async () => {
      const result = await service.cancelOrder('O-1');
      expect(result).toMatchObject({ id: 'O-1', status: 'cancelled' });
    });
  });

  describe('взаємодія із зовнішніми системами (перевірка взаємодії)', () => {
    // Повернення коштів і лист не змінюють стану нашої системи, тому
    // переконатися, що вони відбулися, можна лише через перевірку виклику.
    it('просить шлюз повернути правильну суму за правильним платежем', async () => {
      await service.cancelOrder('O-1');
      expect(gateway.refund).toHaveBeenCalledTimes(1);
      expect(gateway.refund).toHaveBeenCalledWith('P-1', 500);
    });

    it('надсилає клієнту лист із сумою повернення', async () => {
      await service.cancelOrder('O-1');
      expect(notifier.send).toHaveBeenCalledTimes(1);
      expect(notifier.send).toHaveBeenCalledWith(
        'client@e.com',
        expect.stringContaining('500'),
      );
    });

    it('не повертає кошти вдруге при повторному скасуванні', async () => {
      await service.cancelOrder('O-1');
      await expect(service.cancelOrder('O-1')).rejects.toThrow(
        'ALREADY_CANCELLED',
      );
      expect(gateway.refund).toHaveBeenCalledTimes(1);
      expect(notifier.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('відмови залежностей', () => {
    it('не скасовує замовлення й не надсилає лист, якщо повернення не вдалося', async () => {
      gateway.refund = vi.fn().mockRejectedValue(new Error('REFUND_UNAVAILABLE'));
      await expect(service.cancelOrder('O-1')).rejects.toThrow(
        'REFUND_UNAVAILABLE',
      );
      const saved = await store.findById('O-1');
      expect(saved?.status).toBe('paid');
      expect(saved?.refundId).toBeUndefined();
      expect(notifier.send).not.toHaveBeenCalled();
    });

    it('передає помилку шлюзу про відсутній платіж', async () => {
      gateway.refund = vi.fn().mockRejectedValue(new Error('PAYMENT_NOT_FOUND'));
      await expect(service.cancelOrder('O-1')).rejects.toThrow(
        'PAYMENT_NOT_FOUND',
      );
      expect(notifier.send).not.toHaveBeenCalled();
    });

    it('залишає замовлення скасованим, якщо не вдалося надіслати лист', async () => {
      notifier.send = vi.fn().mockRejectedValue(new Error('SMTP_DOWN'));
      await expect(service.cancelOrder('O-1')).rejects.toThrow('SMTP_DOWN');
      const saved = await store.findById('O-1');
      expect(saved?.status).toBe('cancelled');
      expect(gateway.refund).toHaveBeenCalledTimes(1);
    });
  });

  describe('некоректний стан замовлення', () => {
    it('відхиляє невідоме замовлення', async () => {
      await expect(service.cancelOrder('O-404')).rejects.toThrow(
        'ORDER_NOT_FOUND',
      );
      expect(gateway.refund).not.toHaveBeenCalled();
    });

    it.each(['pending', 'shipped'] as const)(
      'не скасовує замовлення зі статусом %s',
      async (status) => {
        store = new InMemoryOrderStore([makeOrder({ status })]);
        service = new CancellationService(gateway, store, notifier);
        await expect(service.cancelOrder('O-1')).rejects.toThrow(
          'CANNOT_CANCEL',
        );
        expect(gateway.refund).not.toHaveBeenCalled();
        expect(notifier.send).not.toHaveBeenCalled();
      },
    );
  });

  describe('фіксація часу', () => {
    it('записує момент скасування', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15T10:00:00.000Z'));
      await service.cancelOrder('O-1');
      const saved = await store.findById('O-1');
      expect(saved?.cancelledAt).toBe('2026-03-15T10:00:00.000Z');
    });
  });
});
