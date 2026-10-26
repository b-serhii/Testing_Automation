import type { PaymentGateway, RefundResult } from './cancellation-service';

export class HttpPaymentGateway implements PaymentGateway {
  constructor(private baseUrl: string) {}

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    const response = await fetch(`${this.baseUrl}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, amount }),
    });
    if (response.status === 404) throw new Error('PAYMENT_NOT_FOUND');
    if (!response.ok) throw new Error('REFUND_UNAVAILABLE');

    const data = await response.json();
    if (typeof data?.refundId !== 'string' || data.refundId === '') {
      throw new Error('INVALID_REFUND_FORMAT');
    }
    return { refundId: data.refundId };
  }
}
