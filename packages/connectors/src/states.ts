import type { IssueRef, IssueState } from '@diorama/schema';
import type { NormalizedIssue } from './types.ts';

/** The part of an issue that drives the scene's status. */
export function toIssueState(issue: NormalizedIssue): IssueState {
  return {
    state: issue.state,
    ...(issue.stateReason && { stateReason: issue.stateReason }),
    ...(issue.hasOpenPullRequest && { hasOpenPullRequest: true }),
  };
}

export function toIssueStates(issues: readonly NormalizedIssue[]): Map<IssueRef, IssueState> {
  return new Map(issues.map((issue) => [issue.ref, toIssueState(issue)]));
}
