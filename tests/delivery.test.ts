import { describe, it, expect } from 'vitest';
import { calcDeliveryFee } from '../src/delivery';

describe('Цикл 1. Некоректна вага', () => {
  it.each([0, -1, -0.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'відхиляє вагу %s кодом INVALID_WEIGHT',
    (weight) => {
      expect(() => calcDeliveryFee(weight)).toThrow('INVALID_WEIGHT');
    },
  );
});

describe('Цикл 2. Базовий тариф до 5 кг', () => {
  it.each([0.01, 1, 4.99, 5])('вага %s кг → 50 грн', (weight) => {
    expect(calcDeliveryFee(weight)).toBe(50);
  });
});

describe('Цикл 3. Кожен наступний розпочатий кілограм', () => {
  it.each([
    { weight: 5, expected: 50 },
    { weight: 5.01, expected: 60 },
    { weight: 6, expected: 60 },
    { weight: 6.01, expected: 70 },
    { weight: 10, expected: 100 },
  ])('вага $weight кг → $expected грн', ({ weight, expected }) => {
    expect(calcDeliveryFee(weight)).toBe(expected);
  });
});

describe('Цикл 4. Максимальний тариф 300 грн', () => {
  it.each([
    { weight: 29, expected: 290 },
    { weight: 30, expected: 300 },
    { weight: 31, expected: 300 },
    { weight: 100, expected: 300 },
  ])('вага $weight кг → $expected грн', ({ weight, expected }) => {
    expect(calcDeliveryFee(weight)).toBe(expected);
  });
});

describe('Цикл 5. Експрес-доставка (подвійний тариф)', () => {
  it.each([
    { weight: 5, expected: 100 },
    { weight: 6, expected: 120 },
    { weight: 29, expected: 580 },
    { weight: 30, expected: 600 },
    { weight: 31, expected: 600 },
  ])(
    'експрес, вага $weight кг → $expected грн',
    ({ weight, expected }) => {
      expect(calcDeliveryFee(weight, { express: true })).toBe(expected);
    },
  );

  it('прапорець express: false не змінює тариф', () => {
    expect(calcDeliveryFee(6, { express: false })).toBe(60);
  });
});

describe('Цикл 6. Безкоштовна доставка від 1000 грн', () => {
  it.each([
    { orderAmount: 999, expected: 50 },
    { orderAmount: 1000, expected: 0 },
    { orderAmount: 1001, expected: 0 },
  ])(
    'сума замовлення $orderAmount → доставка $expected грн',
    ({ orderAmount, expected }) => {
      expect(calcDeliveryFee(5, { orderAmount })).toBe(expected);
    },
  );

  it.each([
    { orderAmount: 999, expected: 100 },
    { orderAmount: 1000, expected: 0 },
  ])(
    'експрес, сума замовлення $orderAmount → $expected грн',
    ({ orderAmount, expected }) => {
      expect(calcDeliveryFee(5, { express: true, orderAmount })).toBe(expected);
    },
  );
});
