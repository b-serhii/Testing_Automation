export interface DeliveryOptions {
  express?: boolean;
  orderAmount?: number;
}

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }
  if (weightKg <= 5) return 50;
  return 50 + Math.ceil(weightKg - 5) * 10;
}
