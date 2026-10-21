import { z } from 'zod';
import { SceneSchema } from './scene.ts';

/**
 * JSON Schema for scene files, for editor autocomplete and LLM structured output.
 * Describes the shape as written (defaults are optional). Cross-field rules such as
 * "flows must point at real zones" only run in `validateScene`.
 */
export function buildJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(SceneSchema, { io: 'input' });
}
