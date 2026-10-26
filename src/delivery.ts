export interface DeliveryOptions {
  /** Експрес-доставка: подвійний тариф. */
  express?: boolean;
  /** Сума замовлення в гривнях; від 1000 грн доставка безкоштовна. */
  orderAmount?: number;
}

const BASE_WEIGHT_KG = 5;
const BASE_FEE = 50;
const EXTRA_KG_FEE = 10;
const MAX_FEE = 300;
const EXPRESS_RATE = 2;
const FREE_DELIVERY_FROM = 1000;

function assertValidWeight(weightKg: number): void {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }
}

function assertValidOrderAmount(orderAmount: number): void {
  if (!Number.isFinite(orderAmount) || orderAmount < 0) {
    throw new Error('INVALID_AMOUNT');
  }
}

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
  const orderAmount = options.orderAmount ?? 0;
  assertValidWeight(weightKg);
  assertValidOrderAmount(orderAmount);
  if (orderAmount >= FREE_DELIVERY_FROM) return 0;
  return applyExpress(calcBaseFee(weightKg), options);
}
