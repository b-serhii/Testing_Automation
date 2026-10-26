export interface DeliveryOptions {
  express?: boolean;
  orderAmount?: number;
}

const BASE_WEIGHT_KG = 5;
const BASE_FEE = 50;
const EXTRA_KG_FEE = 10;
const MAX_FEE = 300;
const EXPRESS_RATE = 2;
const FREE_DELIVERY_FROM = 1000;

export function calcBaseFee(weightKg: number): number {
  if (weightKg <= BASE_WEIGHT_KG) return BASE_FEE;
  const extraKg = Math.ceil(weightKg - BASE_WEIGHT_KG);
  return Math.min(BASE_FEE + extraKg * EXTRA_KG_FEE, MAX_FEE);
}

export function applyExpress(fee: number, options: DeliveryOptions): number {
  return options.express ? fee * EXPRESS_RATE : fee;
}

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }
  if ((options.orderAmount ?? 0) >= FREE_DELIVERY_FROM) return 0;
  return applyExpress(calcBaseFee(weightKg), options);
}
