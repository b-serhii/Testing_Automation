import type { Notifier } from './order-service';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

export interface Order {
  id: string;
  paymentId: string;
  amount: number;
  email: string;
  status: OrderStatus;
  refundId?: string;
  cancelledAt?: string;
}

export interface RefundResult {
  refundId: string;
}

export interface PaymentGateway {
  refund(paymentId: string, amount: number): Promise<RefundResult>;
}

export interface OrderStore {
  findById(id: string): Promise<Order | undefined>;
  update(order: Order): Promise<void>;
}

export class CancellationService {
  constructor(
    private gateway: PaymentGateway,
    private store: OrderStore,
    private notifier: Notifier,
  ) {}

  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.store.findById(orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === 'cancelled') throw new Error('ALREADY_CANCELLED');
    if (order.status !== 'paid') throw new Error('CANNOT_CANCEL');

    const { refundId } = await this.gateway.refund(
      order.paymentId,
      order.amount,
    );

    const cancelled: Order = {
      ...order,
      status: 'cancelled',
      refundId,
      cancelledAt: new Date().toISOString(),
    };
    await this.store.update(cancelled);

    await this.notifier.send(
      order.email,
      `Замовлення ${order.id} скасовано, повернено ${order.amount} грн`,
    );
    return cancelled;
  }
}
