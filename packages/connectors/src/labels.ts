import type { Scene } from '@diorama/schema';
import type { NormalizedIssue } from './types.ts';

export type UnmappedReason =
  /** No `part:` or `zone:` label and not linked in the scene. */
  | 'no-label'
  /** A `zone:` label but no part: say which part with `part:<zone>/<part>`. */
  | 'zone-only'
  /** A label names a zone or part the scene doesn't have. */
  | 'unknown-target';

export interface UnmappedIssue {
  issue: NormalizedIssue;
  reason: UnmappedReason;
  /** The label that was tried, for `unknown-target` and `zone-only`. */
  label?: string;
}

export interface LabelLinkResult {
  /** The scene with label-derived issue links added. The scene file itself is not changed. */
  scene: Scene;
  /** Issues linked only because of their labels. */
  labelLinked: NormalizedIssue[];
  /** Issues the scene doesn't know where to put. */
  unmapped: UnmappedIssue[];
}

const PART_LABEL = /^part:([a-z0-9-]+)\/([a-z0-9-]+)$/;
const ZONE_LABEL = /^zone:([a-z0-9-]+)$/;

/**
 * Places issues without AI (see PHASES.md, Phase 4). An issue already linked in the scene stays
 * where the scene put it. Otherwise a `part:<zone>/<part>` label links it to that part. Labels
 * are matched case-insensitively.
 */
export function applyLabelLinks(scene: Scene, issues: readonly NormalizedIssue[]): LabelLinkResult {
  const linked = new Set(scene.zones.flatMap((z) => z.parts.flatMap((p) => p.issues)));
  const additions = new Map<string, string[]>();
  const labelLinked: NormalizedIssue[] = [];
  const unmapped: UnmappedIssue[] = [];

  for (const issue of issues) {
    if (linked.has(issue.ref)) continue;

    const labels = issue.labels.map((l) => l.trim().toLowerCase());
    const partLabel = labels.find((l) => PART_LABEL.test(l));
    const zoneLabel = labels.find((l) => ZONE_LABEL.test(l));

    if (partLabel) {
      const [, zoneId, partId] = PART_LABEL.exec(partLabel) as RegExpExecArray;
      const part = scene.zones.find((z) => z.id === zoneId)?.parts.find((p) => p.id === partId);
      if (part) {
        const key = `${zoneId}/${partId}`;
        additions.set(key, [...(additions.get(key) ?? []), issue.ref]);
        labelLinked.push(issue);
      } else {
        unmapped.push({ issue, reason: 'unknown-target', label: partLabel });
      }
    } else if (zoneLabel) {
      const zoneId = (ZONE_LABEL.exec(zoneLabel) as RegExpExecArray)[1];
      const known = scene.zones.some((z) => z.id === zoneId);
      unmapped.push({ issue, reason: known ? 'zone-only' : 'unknown-target', label: zoneLabel });
    } else {
      unmapped.push({ issue, reason: 'no-label' });
    }
  }

  const linkedScene: Scene = {
    ...scene,
    zones: scene.zones.map((zone) => ({
      ...zone,
      parts: zone.parts.map((part) => {
        const extra = additions.get(`${zone.id}/${part.id}`);
        return extra ? { ...part, issues: [...part.issues, ...extra] } : part;
      }),
    })),
  };
  return { scene: linkedScene, labelLinked, unmapped };
}
