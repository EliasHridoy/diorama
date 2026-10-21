import type { NormalizedIssue } from './types.ts';

/** Builds an issue for tests, with sensible defaults. */
export function issue(number: number, overrides: Partial<NormalizedIssue> = {}): NormalizedIssue {
  return {
    ref: `github:${number}`,
    title: `Issue ${number}`,
    state: 'open',
    url: `https://github.com/acme/shop/issues/${number}`,
    assignees: [],
    labels: [],
    hasOpenPullRequest: false,
    ...overrides,
  };
}
