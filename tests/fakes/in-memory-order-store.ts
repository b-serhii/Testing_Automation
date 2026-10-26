import type { Order, OrderStore } from '../../src/cancellation-service';

export class InMemoryOrderStore implements OrderStore {
  private items = new Map<string, Order>();

  constructor(initial: Order[] = []) {
    for (const order of initial) this.items.set(order.id, { ...order });
  }

  async findById(id: string): Promise<Order | undefined> {
    const order = this.items.get(id);
    return order ? { ...order } : undefined;
  }

  async update(order: Order): Promise<void> {
    this.items.set(order.id, { ...order });
  }
}
