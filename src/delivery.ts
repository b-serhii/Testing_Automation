export interface DeliveryOptions {
  express?: boolean;
  orderAmount?: number;
}

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  throw new Error('INVALID_WEIGHT');
}
