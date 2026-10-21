import type { IssueRef, Part, Scene, Zone } from './scene.ts';

/** How built something is: ghost, partly solid, or solid. */
export type BuildStatus = 'planned' | 'in_progress' | 'done';

/** Tracker state for one issue, as reported by a connector. */
export interface IssueState {
  state: 'open' | 'closed';
  /** An open pull request is linked to the issue, so work has visibly started. */
  hasOpenPullRequest?: boolean;
}

export interface PartStatus {
  status: BuildStatus;
  /** Closed issues / total issues, 0..1. */
  progress: number;
  closedIssues: number;
  totalIssues: number;
}

export interface ZoneStatus {
  status: BuildStatus;
  /** Mean progress of the zone's parts, 0..1. */
  progress: number;
  parts: ReadonlyMap<string, PartStatus>;
}

export interface SceneStatus {
  /** Mean progress over every part in the scene, 0..1. */
  progress: number;
  zones: ReadonlyMap<string, ZoneStatus>;
  /** Issues the scene links to that the tracker didn't report. Counted as open. */
  missingIssues: IssueRef[];
}

/**
 * Computes build status from tracker state (D-12: status is derived, never stored).
 *
 * - Part: `done` when all its issues are closed; `in_progress` when some are closed or an
 *   open issue has an open PR; otherwise `planned`. A part with no issues is `planned`.
 * - Zone: `done` when all parts are done, `planned` when all are planned (or it has no
 *   parts), otherwise `in_progress`.
 */
export function deriveStatus(scene: Scene, issues: ReadonlyMap<IssueRef, IssueState>): SceneStatus {
  const missing = new Set<IssueRef>();
  const zones = new Map<string, ZoneStatus>();
  const allProgress: number[] = [];

  for (const zone of scene.zones) {
    const zoneStatus = deriveZoneStatus(zone, issues, missing);
    zones.set(zone.id, zoneStatus);
    for (const part of zoneStatus.parts.values()) allProgress.push(part.progress);
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

  const statuses = [...parts.values()].map((p) => p.status);
  let status: BuildStatus = 'in_progress';
  if (statuses.every((s) => s === 'planned')) status = 'planned';
  else if (statuses.every((s) => s === 'done')) status = 'done';

  return { status, progress: mean([...parts.values()].map((p) => p.progress)), parts };
}

function derivePartStatus(
  part: Part,
  issues: ReadonlyMap<IssueRef, IssueState>,
  missing: Set<IssueRef>,
): PartStatus {
  const refs = [...new Set(part.issues)];
  let closed = 0;
  let prOpen = false;
  for (const ref of refs) {
    const issue = issues.get(ref);
    if (!issue) missing.add(ref);
    else if (issue.state === 'closed') closed++;
    else if (issue.hasOpenPullRequest) prOpen = true;
  }

  const total = refs.length;
  let status: BuildStatus = 'planned';
  if (total > 0 && closed === total) status = 'done';
  else if (closed > 0 || prOpen) status = 'in_progress';

  return {
    status,
    progress: total === 0 ? 0 : closed / total,
    closedIssues: closed,
    totalIssues: total,
  };
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}
