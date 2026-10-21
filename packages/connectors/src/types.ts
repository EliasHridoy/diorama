import type { IssueRef } from '@diorama/schema';

/** A tracker issue in the shape Diorama uses, whichever tracker it came from. */
export interface NormalizedIssue {
  ref: IssueRef;
  title: string;
  state: 'open' | 'closed';
  /** Only set for closed issues. */
  stateReason?: 'completed' | 'not_planned';
  url: string;
  assignees: string[];
  labels: string[];
  /** The tracker's sprint: a GitHub milestone (D-14). */
  milestone?: { title: string; dueOn?: string; closed: boolean };
  /** An open pull request is linked to the issue. */
  hasOpenPullRequest: boolean;
}

export interface RepoRef {
  owner: string;
  name: string;
}

export interface RateLimit {
  remaining: number;
  /** ISO time the limit resets. */
  resetAt: string;
}

export interface FetchIssuesResult {
  issues: NormalizedIssue[];
  rateLimit?: RateLimit;
  /** True when the repo has more issues than the page cap allowed us to read. */
  truncated: boolean;
}

export type ConnectorErrorCode =
  'bad-token' | 'no-access' | 'not-found' | 'rate-limited' | 'network' | 'bad-response';

/** A failure talking to a tracker, with a code the UI can act on. Never includes the token. */
export class ConnectorError extends Error {
  readonly code: ConnectorErrorCode;
  /** ISO time to retry after, for `rate-limited`. */
  readonly retryAt?: string;

  constructor(code: ConnectorErrorCode, message: string, retryAt?: string) {
    super(message);
    this.name = 'ConnectorError';
    this.code = code;
    if (retryAt) this.retryAt = retryAt;
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
