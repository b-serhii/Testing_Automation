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
