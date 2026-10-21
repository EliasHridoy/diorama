import { z } from 'zod';
import { IssueRefSchema, type IssueRef, type Part, type Scene, type Zone } from './scene.ts';

/**
 * How built something is: ghost, partly solid, or solid. `dropped` means every issue behind
 * it was closed as "not planned" (D-15): the scope was cut, not built.
 */
export type BuildStatus = 'planned' | 'in_progress' | 'done' | 'dropped';

/** Tracker state for one issue, as reported by a connector. */
export const IssueStateSchema = z.strictObject({
  state: z.enum(['open', 'closed']),
  /** Why a closed issue was closed. `not_planned` issues don't count towards progress. */
  stateReason: z.enum(['completed', 'not_planned']).optional(),
  /** An open pull request is linked to the issue, so work has visibly started. */
  hasOpenPullRequest: z.boolean().optional(),
});

/** Issue states keyed by ref, as stored in an `*.issues.json` file. */
export const IssueStatesSchema = z.record(IssueRefSchema, IssueStateSchema);

export type IssueState = z.infer<typeof IssueStateSchema>;

export interface PartStatus {
  status: BuildStatus;
  /** Closed issues / counted issues (dropped ones are not counted), 0..1. */
  progress: number;
  closedIssues: number;
  /** Issues that count towards progress: all linked issues except dropped ones. */
  totalIssues: number;
  /** Issues closed as "not planned". */
  droppedIssues: number;
}

export interface ZoneStatus {
  status: BuildStatus;
  /** Mean progress of the zone's parts that weren't dropped, 0..1. */
  progress: number;
  parts: ReadonlyMap<string, PartStatus>;
}

export interface SceneStatus {
  /** Mean progress over every part that wasn't dropped, 0..1. */
  progress: number;
  zones: ReadonlyMap<string, ZoneStatus>;
  /** Issues the scene links to that the tracker didn't report. Counted as open. */
  missingIssues: IssueRef[];
}

/**
 * Computes build status from tracker state (D-12: status is derived, never stored).
 *
 * - Part: issues closed as "not planned" are set aside. If that leaves nothing, the part is
 *   `dropped`. Otherwise it is `done` when all remaining issues are closed; `in_progress`
 *   when some are closed or an open issue has an open PR; else `planned`. A part with no
 *   issues is `planned`.
 * - Zone: dropped parts are ignored. `done` when all the rest are done, `planned` when all
 *   are planned (or there are none), otherwise `in_progress`. A zone whose parts are all
 *   dropped is `dropped`.
 */
export function deriveStatus(scene: Scene, issues: ReadonlyMap<IssueRef, IssueState>): SceneStatus {
  const missing = new Set<IssueRef>();
  const zones = new Map<string, ZoneStatus>();
  const allProgress: number[] = [];

  for (const zone of scene.zones) {
    const zoneStatus = deriveZoneStatus(zone, issues, missing);
    zones.set(zone.id, zoneStatus);
    for (const part of zoneStatus.parts.values()) {
      if (part.status !== 'dropped') allProgress.push(part.progress);
    }
  }

  return { progress: mean(allProgress), zones, missingIssues: [...missing] };
}

function deriveZoneStatus(
  zone: Zone,
  issues: ReadonlyMap<IssueRef, IssueState>,
  missing: Set<IssueRef>,
): ZoneStatus {
  const parts = new Map<string, PartStatus>();
  for (const part of zone.parts) parts.set(part.id, derivePartStatus(part, issues, missing));

  const live = [...parts.values()].filter((p) => p.status !== 'dropped');
  let status: BuildStatus = 'in_progress';
  if (parts.size > 0 && live.length === 0) status = 'dropped';
  else if (live.every((p) => p.status === 'planned')) status = 'planned';
  else if (live.every((p) => p.status === 'done')) status = 'done';

  return { status, progress: mean(live.map((p) => p.progress)), parts };
}

function derivePartStatus(
  part: Part,
  issues: ReadonlyMap<IssueRef, IssueState>,
  missing: Set<IssueRef>,
): PartStatus {
  const refs = [...new Set(part.issues)];
  let closed = 0;
  let dropped = 0;
  let prOpen = false;
  for (const ref of refs) {
    const issue = issues.get(ref);
    if (!issue) missing.add(ref);
    else if (issue.state === 'closed' && issue.stateReason === 'not_planned') dropped++;
    else if (issue.state === 'closed') closed++;
    else if (issue.hasOpenPullRequest) prOpen = true;
  }

  const total = refs.length - dropped;
  let status: BuildStatus = 'planned';
  if (refs.length > 0 && total === 0) status = 'dropped';
  else if (total > 0 && closed === total) status = 'done';
  else if (closed > 0 || prOpen) status = 'in_progress';

  return {
    status,
    progress: total === 0 ? 0 : closed / total,
    closedIssues: closed,
    totalIssues: total,
    droppedIssues: dropped,
  };
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}
