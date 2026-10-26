export interface DeliveryOptions {
  express?: boolean;
  orderAmount?: number;
}

const BASE_WEIGHT_KG = 5;
const BASE_FEE = 50;
const EXTRA_KG_FEE = 10;
const MAX_FEE = 300;

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }
  if (weightKg <= BASE_WEIGHT_KG) return BASE_FEE;
  const fee = BASE_FEE + Math.ceil(weightKg - BASE_WEIGHT_KG) * EXTRA_KG_FEE;
  return Math.min(fee, MAX_FEE);
}
