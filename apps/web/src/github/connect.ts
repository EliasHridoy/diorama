import {
  ConnectorError,
  fetchGitHubIssues,
  parseRepoRef,
  readRepoFile,
  SCENE_PATH,
  type FetchIssuesResult,
  type FetchLike,
  type RepoRef,
} from '@diorama/connectors';

export interface Connection {
  repo: RepoRef;
  /** Kept in memory for this tab only; never written to storage or put in a URL. */
  token: string;
}

export type ConnectResult =
  | {
      ok: true;
      connection: Connection;
      /** The repo's `.diorama/scene.json`, parsed but not validated; null when it has none. */
      scene: { json: unknown; source: string } | null;
      issues: FetchIssuesResult;
    }
  | { ok: false; message: string };

/** Checks the token and repo, reads the repo's scene file and its issues. */
export async function connectToRepo(options: {
  repoText: string;
  token: string;
  fetch?: FetchLike;
}): Promise<ConnectResult> {
  const repo = parseRepoRef(options.repoText);
  if (!repo) return { ok: false, message: 'Enter the repository as owner/name, e.g. acme/shop.' };
  const token = options.token.trim();
  if (!token) return { ok: false, message: 'Enter a GitHub token.' };

  const fetchOption = options.fetch ? { fetch: options.fetch } : {};
  try {
    const issues = await fetchGitHubIssues({ repo, token, ...fetchOption });
    const file = await readRepoFile({ repo, token, ...fetchOption });
    const source = `github:${repo.owner}/${repo.name}/${SCENE_PATH}`;
    let scene: { json: unknown; source: string } | null = null;
    if (file) {
      try {
        scene = { json: JSON.parse(file.text) as unknown, source };
      } catch {
        return {
          ok: false,
          message: `${SCENE_PATH} in ${repo.owner}/${repo.name} is not valid JSON.`,
        };
      }
    }
    return { ok: true, connection: { repo, token }, scene, issues };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }
}

/** A message for people. Connector errors are written never to contain the token. */
export function describeError(error: unknown): string {
  if (error instanceof ConnectorError) {
    if (error.code === 'rate-limited' && error.retryAt) {
      return `GitHub rate limit reached. Try again after ${new Date(error.retryAt).toLocaleTimeString()}.`;
    }
    return error.message;
  }
  return 'Something went wrong talking to GitHub.';
}
