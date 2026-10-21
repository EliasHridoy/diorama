import { ConnectorError, type FetchLike, type RepoRef } from '../types.ts';
import { API, githubRequest } from './http.ts';

/** Where a project keeps its scene (D-06). */
export const SCENE_PATH = '.diorama/scene.json';

export interface RepoFile {
  text: string;
  /** Needed to update the file later without overwriting someone else's change. */
  sha: string;
}

const contentsUrl = (repo: RepoRef, path: string) =>
  `${API}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/contents/${path}`;

/** Reads a file from the repo's default branch. Returns undefined when it doesn't exist. */
export async function readRepoFile(options: {
  repo: RepoRef;
  token: string;
  path?: string;
  fetch?: FetchLike;
}): Promise<RepoFile | undefined> {
  const fetchLike = options.fetch ?? ((url, init) => fetch(url, init));
  try {
    const response = await githubRequest(
      fetchLike,
      contentsUrl(options.repo, options.path ?? SCENE_PATH),
      options.token,
      { headers: { accept: 'application/vnd.github+json' } },
    );
    const body = (await response.json()) as {
      type?: string;
      sha?: string;
      content?: string;
      encoding?: string;
    };
    if (
      body.type !== 'file' ||
      !body.sha ||
      body.encoding !== 'base64' ||
      body.content === undefined
    ) {
      throw new ConnectorError(
        'bad-response',
        `${options.path ?? SCENE_PATH} is not a regular file.`,
      );
    }
    return { text: decodeBase64(body.content), sha: body.sha };
  } catch (error) {
    // A repo that is simply missing the file is normal, but a missing repo is not; the
    // issue fetch reports that case, so here "not found" means "no scene file".
    if (error instanceof ConnectorError && error.code === 'not-found') return undefined;
    throw error;
  }
}

/** Creates or updates a file with a commit on the default branch. Returns the new sha. */
export async function writeRepoFile(options: {
  repo: RepoRef;
  token: string;
  text: string;
  message: string;
  /** The sha from `readRepoFile`; omit to create the file. */
  sha?: string;
  path?: string;
  fetch?: FetchLike;
}): Promise<string> {
  const fetchLike = options.fetch ?? ((url, init) => fetch(url, init));
  const response = await githubRequest(
    fetchLike,
    contentsUrl(options.repo, options.path ?? SCENE_PATH),
    options.token,
    {
      method: 'PUT',
      headers: { accept: 'application/vnd.github+json', 'content-type': 'application/json' },
      body: JSON.stringify({
        message: options.message,
        content: encodeBase64(options.text),
        ...(options.sha && { sha: options.sha }),
      }),
    },
  );
  const body = (await response.json()) as { content?: { sha?: string } };
  if (!body.content?.sha)
    throw new ConnectorError('bad-response', 'Unexpected answer from GitHub.');
  return body.content.sha;
}

/** GitHub wraps base64 at 60 columns; atob wants it unwrapped. UTF-8 safe. */
function decodeBase64(content: string): string {
  const binary = atob(content.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
