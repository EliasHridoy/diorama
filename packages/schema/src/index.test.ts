import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from './index.ts';

describe('schema', () => {
  it('exposes the current schema version', () => {
    expect(SCHEMA_VERSION).toBe(1);
  });
});
