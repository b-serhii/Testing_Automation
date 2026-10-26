export interface DeliveryOptions {
  express?: boolean;
  orderAmount?: number;
}

const BASE_WEIGHT_KG = 5;
const BASE_FEE = 50;
const EXTRA_KG_FEE = 10;
const MAX_FEE = 300;
const EXPRESS_RATE = 2;

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }
  let fee = BASE_FEE;
  if (weightKg > BASE_WEIGHT_KG) {
    fee += Math.ceil(weightKg - BASE_WEIGHT_KG) * EXTRA_KG_FEE;
  }
  fee = Math.min(fee, MAX_FEE);
  return options.express ? fee * EXPRESS_RATE : fee;
}
