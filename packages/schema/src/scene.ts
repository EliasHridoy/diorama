import { z } from 'zod';

/** Version of the scene file format. Bump on breaking changes to the schema. */
export const SCHEMA_VERSION = 1;

/** Lowercase slug used for zone and part ids, e.g. `checkout` or `payment-form`. */
export const IdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, 'must be a lowercase slug like "cart" or "payment-form"')
  .describe('Lowercase slug, unique within its parent');

/**
 * Reference to an issue in a tracker, written `<provider>:<id>`.
 * `github:12` is issue #12 in the project's repo; `jira:SHOP-7` comes later.
 */
export const IssueRefSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*:\S+$/, 'must look like "github:12"')
  .describe('Tracker issue reference, "<provider>:<id>", e.g. "github:12"');

export const PartSchema = z
  .strictObject({
    id: IdSchema,
    label: z.string().min(1).describe('Human-readable name shown in the viewer'),
    description: z.string().optional(),
    asset: z
      .string()
      .min(1)
      .optional()
      .describe('Theme asset used to draw this part; the theme picks a default when omitted'),
    issues: z
      .array(IssueRefSchema)
      .default([])
      .describe('Issues whose state decides how built this part is'),
  })
  .describe('A buildable piece of a zone');

export const ZoneSchema = z
  .strictObject({
    id: IdSchema,
    label: z.string().min(1).describe('Name of the software module, e.g. "Checkout & payments"'),
    description: z.string().optional(),
    metaphor: z
      .string()
      .min(1)
      .describe('Theme slot that draws this module, e.g. "entrance" or "shelves"'),
    parts: z.array(PartSchema).default([]),
  })
  .describe('A software module placed in the theme');

export const FlowSchema = z
  .strictObject({
    from: IdSchema.describe('Zone the data leaves'),
    to: IdSchema.describe('Zone the data arrives at'),
    label: z.string().min(1).optional().describe('What moves, e.g. "add item"'),
  })
  .describe('Directed data flow between two zones');

export const ProjectSchema = z.strictObject({
  name: z.string().min(1),
  repo: z
    .string()
    .regex(/^[a-z][a-z0-9-]*:\S+$/, 'must look like "github:owner/name"')
    .optional()
    .describe('Tracker repository, e.g. "github:acme/corner-shop"'),
});

export const SceneSchema = z
  .strictObject({
    $schema: z.string().optional().describe('Path or URL of this JSON Schema, for editors'),
    schemaVersion: z.literal(SCHEMA_VERSION),
    project: ProjectSchema,
    theme: z.string().min(1).describe('Theme id, e.g. "ecommerce-shop"'),
    zones: z.array(ZoneSchema).min(1),
    flows: z.array(FlowSchema).default([]),
  })
  .superRefine((scene, ctx) => {
    const zoneIds = new Set<string>();
    scene.zones.forEach((zone, z) => {
      if (zoneIds.has(zone.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['zones', z, 'id'],
          message: `duplicate zone id "${zone.id}"`,
        });
      }
      zoneIds.add(zone.id);

      const partIds = new Set<string>();
      zone.parts.forEach((part, p) => {
        if (partIds.has(part.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['zones', z, 'parts', p, 'id'],
            message: `duplicate part id "${part.id}" in zone "${zone.id}"`,
          });
        }
        partIds.add(part.id);
      });
    });

    const flowKeys = new Set<string>();
    scene.flows.forEach((flow, f) => {
      for (const end of ['from', 'to'] as const) {
        if (!zoneIds.has(flow[end])) {
          ctx.addIssue({
            code: 'custom',
            path: ['flows', f, end],
            message: `unknown zone "${flow[end]}"`,
          });
        }
      }
      if (flow.from === flow.to) {
        ctx.addIssue({
          code: 'custom',
          path: ['flows', f],
          message: `flow from "${flow.from}" to itself`,
        });
      }
      const key = `${flow.from}->${flow.to}:${flow.label ?? ''}`;
      if (flowKeys.has(key)) {
        ctx.addIssue({ code: 'custom', path: ['flows', f], message: 'duplicate flow' });
      }
      flowKeys.add(key);
    });
  })
  .describe('A Diorama scene: software modules mapped onto a themed 3D world');

export type IssueRef = z.infer<typeof IssueRefSchema>;
export type Part = z.infer<typeof PartSchema>;
export type Zone = z.infer<typeof ZoneSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Scene = z.infer<typeof SceneSchema>;
/** Scene as written in a file, before defaults are applied. */
export type SceneInput = z.input<typeof SceneSchema>;

/** Splits `github:12` into its provider and id. */
export function parseIssueRef(ref: IssueRef): { provider: string; id: string } {
  const colon = ref.indexOf(':');
  return { provider: ref.slice(0, colon), id: ref.slice(colon + 1) };
}
