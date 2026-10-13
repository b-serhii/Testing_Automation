/** Скільки кілометрів у одній міжнародній милі (точне значення). */
const KM_IN_MILE = 1.609344;

/** Перевіряє, що значення є скінченним невід’ємним числом. */
function ensureDistance(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error('INVALID_DISTANCE');
  }
  return value;
}

/** Перетворює кілометри на милі. */
export function kilometersToMiles(kilometers: number): number {
  return ensureDistance(kilometers) / KM_IN_MILE;
}

/** Перетворює милі на кілометри. */
export function milesToKilometers(miles: number): number {
  return ensureDistance(miles) * KM_IN_MILE;
}
