import {
  ConnectorError,
  type FetchIssuesResult,
  type FetchLike,
  type NormalizedIssue,
  type RepoRef,
} from '../types.ts';
import { API, githubRequest } from './http.ts';

const QUERY = `
query ($owner: String!, $name: String!, $after: String) {
  rateLimit { remaining resetAt }
  repository(owner: $owner, name: $name) {
    issues(first: 100, after: $after, orderBy: { field: CREATED_AT, direction: ASC }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number title url state stateReason
        assignees(first: 10) { nodes { login } }
        labels(first: 30) { nodes { name } }
        milestone { title dueOn closed }
        closedByPullRequestsReferences(first: 5, includeClosedPrs: false) { nodes { state } }
      }
    }
  }
}`;

/** 100 issues per page; 50 pages covers 5,000 issues, far beyond a sane Diorama project. */
const MAX_PAGES = 50;

interface RawIssue {
  number: number;
  title: string;
  url: string;
  state: 'OPEN' | 'CLOSED';
  stateReason: string | null;
  assignees: { nodes: { login: string }[] };
  labels: { nodes: { name: string }[] };
  milestone: { title: string; dueOn: string | null; closed: boolean } | null;
  closedByPullRequestsReferences: { nodes: { state: string }[] } | null;
}

interface GraphqlBody {
  data?: {
    rateLimit?: { remaining: number; resetAt: string };
    repository: {
      issues: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: RawIssue[] };
    } | null;
  };
  errors?: { type?: string; message: string }[];
}

/** Reads every issue of a repo (pull requests are not issues in GitHub's GraphQL). */
export async function fetchGitHubIssues(options: {
  repo: RepoRef;
  token: string;
  fetch?: FetchLike;
}): Promise<FetchIssuesResult> {
  const fetchLike = options.fetch ?? ((url, init) => fetch(url, init));
  const issues: NormalizedIssue[] = [];
  let after: string | null = null;
  let rateLimit: FetchIssuesResult['rateLimit'];

  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await githubRequest(fetchLike, `${API}/graphql`, options.token, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { owner: options.repo.owner, name: options.repo.name, after },
      }),
    });

    const body = await readJson<GraphqlBody>(response);
    if (body.errors?.some((e) => e.type === 'NOT_FOUND') || (body.data && !body.data.repository)) {
      throw new ConnectorError(
        'not-found',
        `Repository ${options.repo.owner}/${options.repo.name} was not found, or the token cannot see it.`,
      );
    }
    if (body.errors?.some((e) => e.type === 'RATE_LIMITED')) {
      throw new ConnectorError('rate-limited', 'GitHub rate limit reached.');
    }
    const connection = body.data?.repository?.issues;
    if (!connection) throw new ConnectorError('bad-response', 'Unexpected answer from GitHub.');

    rateLimit = body.data?.rateLimit ?? rateLimit;
    issues.push(...connection.nodes.map(normalizeIssue));
    if (!connection.pageInfo.hasNextPage)
      return { issues, ...(rateLimit && { rateLimit }), truncated: false };
    after = connection.pageInfo.endCursor;
  }
  return { issues, ...(rateLimit && { rateLimit }), truncated: true };
}

function normalizeIssue(raw: RawIssue): NormalizedIssue {
  const closed = raw.state === 'CLOSED';
  const dropped = raw.stateReason === 'NOT_PLANNED' || raw.stateReason === 'DUPLICATE';
  return {
    ref: `github:${raw.number}`,
    title: raw.title,
    state: closed ? 'closed' : 'open',
    ...(closed && { stateReason: dropped ? ('not_planned' as const) : ('completed' as const) }),
    url: raw.url,
    assignees: raw.assignees.nodes.map((a) => a.login),
    labels: raw.labels.nodes.map((l) => l.name),
    ...(raw.milestone && {
      milestone: {
        title: raw.milestone.title,
        ...(raw.milestone.dueOn && { dueOn: raw.milestone.dueOn }),
        closed: raw.milestone.closed,
      },
    }),
    hasOpenPullRequest: (raw.closedByPullRequestsReferences?.nodes ?? []).some(
      (pr) => pr.state === 'OPEN',
    ),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ConnectorError('bad-response', 'GitHub sent something that was not JSON.');
  }
}
