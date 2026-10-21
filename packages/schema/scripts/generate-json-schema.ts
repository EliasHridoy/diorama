// Regenerates scene.schema.json from the Zod schema. Run via `pnpm gen:json-schema`.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildJsonSchema } from '../src/json-schema.ts';

const out = new URL('../scene.schema.json', import.meta.url);
writeFileSync(out, JSON.stringify(buildJsonSchema(), null, 2) + '\n');
console.log(`wrote ${fileURLToPath(out)}`);
