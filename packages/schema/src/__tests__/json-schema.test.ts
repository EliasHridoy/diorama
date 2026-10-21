import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildJsonSchema } from '../index.ts';

describe('scene.schema.json', () => {
  it('is up to date with the Zod schema (run `pnpm --filter @diorama/schema gen:json-schema`)', () => {
    const committed: unknown = JSON.parse(
      readFileSync(new URL('../../scene.schema.json', import.meta.url), 'utf8'),
    );
    expect(committed).toEqual(buildJsonSchema());
  });

  it('describes scene files as written, with defaults optional', () => {
    const schema = buildJsonSchema() as { required: string[] };
    expect(schema.required).toEqual(['schemaVersion', 'project', 'theme', 'zones']);
  });
});
