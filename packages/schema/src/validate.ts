import type { z } from 'zod';
import { SceneSchema, type IssueRef, type Scene } from './scene.ts';
import { IssueStatesSchema, type IssueState } from './status.ts';

/** What validation needs to know about a theme. Full theme manifests arrive in Phase 3. */
export interface ThemeInfo {
  id: string;
  /** Slots the theme can draw, e.g. `entrance`, `shelves`, plus common-kit slots. */
  metaphors: readonly string[];
  /** Asset names parts may use. When omitted, part assets are not checked. */
  assets?: readonly string[];
}

export interface ValidationError {
  /** Location in the scene, e.g. `zones[2].parts[0].issues[1]`. Empty for the root. */
  path: string;
  message: string;
}

export type ValidationResult =
  { success: true; scene: Scene } | { success: false; errors: ValidationError[] };

export interface ValidateOptions {
  /** When given, metaphors and assets must exist in this theme. */
  theme?: ThemeInfo;
}

/** Parses and validates an untrusted scene (e.g. from a file, a repo or the agent). */
export function validateScene(input: unknown, options: ValidateOptions = {}): ValidationResult {
  const parsed = SceneSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: toValidationErrors(parsed.error) };

  const errors = options.theme ? checkTheme(parsed.data, options.theme) : [];
  return errors.length > 0 ? { success: false, errors } : { success: true, scene: parsed.data };
}

export type IssueStatesResult =
  | { success: true; issues: Map<IssueRef, IssueState> }
  | { success: false; errors: ValidationError[] };

/** Parses an untrusted `{ "github:12": { "state": "closed" }, ... }` object. */
export function validateIssueStates(input: unknown): IssueStatesResult {
  const parsed = IssueStatesSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: toValidationErrors(parsed.error) };
  return { success: true, issues: new Map(Object.entries(parsed.data)) };
}

function toValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({ path: formatPath(issue.path), message: issue.message }));
}

function checkTheme(scene: Scene, theme: ThemeInfo): ValidationError[] {
  const errors: ValidationError[] = [];
  if (scene.theme !== theme.id) {
    errors.push({
      path: 'theme',
      message: `scene uses theme "${scene.theme}" but was checked against "${theme.id}"`,
    });
    return errors;
  }

  const metaphors = new Set(theme.metaphors);
  const assets = theme.assets ? new Set(theme.assets) : undefined;
  scene.zones.forEach((zone, z) => {
    if (!metaphors.has(zone.metaphor)) {
      errors.push({
        path: `zones[${z}].metaphor`,
        message: `theme "${theme.id}" has no metaphor "${zone.metaphor}"`,
      });
    }
    zone.parts.forEach((part, p) => {
      if (assets && part.asset !== undefined && !assets.has(part.asset)) {
        errors.push({
          path: `zones[${z}].parts[${p}].asset`,
          message: `theme "${theme.id}" has no asset "${part.asset}"`,
        });
      }
    });
  });
  return errors;
}

function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((key, i) => (typeof key === 'number' ? `[${key}]` : `${i === 0 ? '' : '.'}${String(key)}`))
    .join('');
}
