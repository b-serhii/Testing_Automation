import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { expect } from 'vitest';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export function validateSchema(data: unknown, schema: object): ErrorObject[] {
  const validate = ajv.compile(schema);
  validate(data);
  return validate.errors ?? [];
}

export function expectSchema(data: unknown, schema: object) {
  expect(validateSchema(data, schema)).toEqual([]);
}
