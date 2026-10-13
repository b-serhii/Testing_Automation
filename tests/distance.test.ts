import { describe, it, expect } from 'vitest';
import { kilometersToMiles, milesToKilometers } from '../src/distance';

describe('kilometersToMiles', () => {
  it('перетворює 100 кілометрів на приблизно 62.137 милі', () => {
    // Arrange
    const kilometers = 100;
    // Act
    const result = kilometersToMiles(kilometers);
    // Assert
    expect(result).toBeCloseTo(62.137, 3);
  });

  it('перетворює довжину марафону 42.195 км на приблизно 26.2188 милі', () => {
    expect(kilometersToMiles(42.195)).toBeCloseTo(26.2188, 4);
  });

  it('повертає 0 для нульової відстані (межове значення)', () => {
    expect(kilometersToMiles(0)).toBe(0);
  });

  it('відхиляє від’ємну відстань', () => {
    expect(() => kilometersToMiles(-3)).toThrow('INVALID_DISTANCE');
  });

  it('відхиляє NaN', () => {
    expect(() => kilometersToMiles(NaN)).toThrow('INVALID_DISTANCE');
  });
});

describe('milesToKilometers', () => {
  it('перетворює 1 милю на 1.609344 кілометра', () => {
    expect(milesToKilometers(1)).toBeCloseTo(1.609344, 6);
  });

  it('перетворює 5 миль на 8.04672 кілометра', () => {
    expect(milesToKilometers(5)).toBeCloseTo(8.04672, 5);
  });

  it('повертає 0 для нульової відстані (межове значення)', () => {
    expect(milesToKilometers(0)).toBe(0);
  });

  it('відхиляє від’ємну відстань', () => {
    expect(() => milesToKilometers(-0.5)).toThrow('INVALID_DISTANCE');
  });

  it('відхиляє нескінченність', () => {
    expect(() => milesToKilometers(Infinity)).toThrow('INVALID_DISTANCE');
  });

  it('відхиляє значення нечислового типу', () => {
    const notANumber = '10' as unknown as number;
    expect(() => milesToKilometers(notANumber)).toThrow('INVALID_DISTANCE');
  });
});

describe('взаємна обернутість перетворень', () => {
  it.each([0.5, 12, 1000])(
    'милі, отримані з %s км, повертаються до початкового значення',
    (km) => {
      expect(milesToKilometers(kilometersToMiles(km))).toBeCloseTo(km, 9);
    },
  );
});
