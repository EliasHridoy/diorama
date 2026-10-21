import { ConnectorError, type FetchLike } from '../types.ts';

export const API = 'https://api.github.com';

/** Sends a request to GitHub and turns failures into `ConnectorError`s. */
export async function githubRequest(
  fetchLike: FetchLike,
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  let response: Response;
  try {
    response = await fetchLike(url, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new ConnectorError('network', 'Could not reach GitHub. Check your connection.');
  }

  if (response.ok) return response;
  if (response.status === 401) {
    throw new ConnectorError(
      'bad-token',
      'GitHub rejected the token. Check it is valid and not expired.',
    );
  }
  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    if (remaining === '0' || response.status === 429 || response.headers.has('retry-after')) {
      throw new ConnectorError(
        'rate-limited',
        'GitHub rate limit reached.',
        reset ? new Date(Number(reset) * 1000).toISOString() : undefined,
      );
    }
    throw new ConnectorError('no-access', 'The token cannot access this repository.');
  }
  if (response.status === 404) throw new ConnectorError('not-found', 'Not found on GitHub.');
  throw new ConnectorError('bad-response', `GitHub answered with HTTP ${response.status}.`);
}
