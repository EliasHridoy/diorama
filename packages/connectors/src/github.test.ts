import { describe, expect, it, vi } from 'vitest';
import {
  ConnectorError,
  fetchGitHubIssues,
  parseRepoRef,
  readRepoFile,
  writeRepoFile,
} from './index.ts';
import type { FetchLike } from './types.ts';

const repo = { owner: 'acme', name: 'shop' };

function raw(number: number, extra: Record<string, unknown> = {}) {
  return {
    number,
    title: `Issue ${number}`,
    url: `https://github.com/acme/shop/issues/${number}`,
    state: 'OPEN',
    stateReason: null,
    assignees: { nodes: [] },
    labels: { nodes: [] },
    milestone: null,
    closedByPullRequestsReferences: { nodes: [] },
    ...extra,
  };
}

const page = (nodes: unknown[], next: string | null = null) => ({
  data: {
    rateLimit: { remaining: 4990, resetAt: '2026-10-21T10:00:00Z' },
    repository: { issues: { pageInfo: { hasNextPage: next !== null, endCursor: next }, nodes } },
  },
});

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, ...init });

describe('parseRepoRef', () => {
  it.each([
    ['acme/shop', { owner: 'acme', name: 'shop' }],
    ['github:acme/shop', { owner: 'acme', name: 'shop' }],
    ['https://github.com/acme/shop.git', { owner: 'acme', name: 'shop' }],
    ['  https://github.com/Acme/my.shop/  ', { owner: 'Acme', name: 'my.shop' }],
  ])('parses %s', (text, expected) => expect(parseRepoRef(text)).toEqual(expected));

  it.each(['', 'acme', 'acme/shop/extra', 'ac me/shop', '../shop', 'acme/'])('rejects %j', (text) =>
    expect(parseRepoRef(text)).toBeUndefined(),
  );
});

describe('fetchGitHubIssues', () => {
  it('normalizes issues, milestones, assignees, labels and open PRs', async () => {
    const fetchLike: FetchLike = async () =>
      json(
        page([
          raw(1, {
            assignees: { nodes: [{ login: 'ada' }] },
            labels: { nodes: [{ name: 'part:cart/trolley' }] },
            milestone: { title: 'Sprint 1', dueOn: '2026-11-01T00:00:00Z', closed: false },
            closedByPullRequestsReferences: { nodes: [{ state: 'OPEN' }] },
          }),
          raw(2, { state: 'CLOSED', stateReason: 'COMPLETED' }),
          raw(3, { state: 'CLOSED', stateReason: 'NOT_PLANNED' }),
          raw(4, { state: 'CLOSED', stateReason: 'DUPLICATE' }),
        ]),
      );
    const result = await fetchGitHubIssues({ repo, token: 't', fetch: fetchLike });

    expect(result.truncated).toBe(false);
    expect(result.rateLimit).toEqual({ remaining: 4990, resetAt: '2026-10-21T10:00:00Z' });
    expect(result.issues[0]).toEqual({
      ref: 'github:1',
      title: 'Issue 1',
      state: 'open',
      url: 'https://github.com/acme/shop/issues/1',
      assignees: ['ada'],
      labels: ['part:cart/trolley'],
      milestone: { title: 'Sprint 1', dueOn: '2026-11-01T00:00:00Z', closed: false },
      hasOpenPullRequest: true,
    });
    expect(result.issues.slice(1).map((i) => [i.state, i.stateReason])).toEqual([
      ['closed', 'completed'],
      ['closed', 'not_planned'],
      ['closed', 'not_planned'],
    ]);
  });

  it('follows pagination cursors and sends the token as a bearer header', async () => {
    const fetchLike = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(json(page([raw(1), raw(2)], 'cursor-1')))
      .mockResolvedValueOnce(json(page([raw(3)])));
    const result = await fetchGitHubIssues({ repo, token: 'secret-token', fetch: fetchLike });

    expect(result.issues.map((i) => i.ref)).toEqual(['github:1', 'github:2', 'github:3']);
    const [, second] = fetchLike.mock.calls;
    expect(JSON.parse(second?.[1]?.body as string).variables).toEqual({
      owner: 'acme',
      name: 'shop',
      after: 'cursor-1',
    });
    expect((second?.[1]?.headers as Record<string, string>).authorization).toBe(
      'Bearer secret-token',
    );
  });

  it('stops at the page cap and says it was truncated', async () => {
    const fetchLike = vi.fn<FetchLike>(async () => json(page([raw(1)], 'more')));
    const result = await fetchGitHubIssues({ repo, token: 't', fetch: fetchLike });
    expect(result.truncated).toBe(true);
    expect(fetchLike).toHaveBeenCalledTimes(50);
  });

  it.each([
    ['a rejected token', () => json({ message: 'Bad credentials' }, { status: 401 }), 'bad-token'],
    [
      'a missing repo',
      () => json({ data: { repository: null }, errors: [{ type: 'NOT_FOUND', message: 'x' }] }),
      'not-found',
    ],
    ['an empty repository field', () => json({ data: { repository: null } }), 'not-found'],
    ['no access', () => json({ message: 'Forbidden' }, { status: 403 }), 'no-access'],
    ['a server error', () => new Response('oops', { status: 502 }), 'bad-response'],
    ['a non-JSON body', () => new Response('<html>', { status: 200 }), 'bad-response'],
    [
      'a GraphQL rate limit',
      () => json({ errors: [{ type: 'RATE_LIMITED', message: 'x' }] }),
      'rate-limited',
    ],
  ])('reports %s', async (_, respond, code) => {
    const error = await fetchGitHubIssues({ repo, token: 't', fetch: async () => respond() }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ConnectorError);
    expect((error as ConnectorError).code).toBe(code);
  });

  it('reports the reset time when rate limited by HTTP', async () => {
    const response = () =>
      json(
        { message: 'limit' },
        {
          status: 403,
          headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1792567785' },
        },
      );
    const error = (await fetchGitHubIssues({
      repo,
      token: 't',
      fetch: async () => response(),
    }).catch((e: unknown) => e)) as ConnectorError;
    expect(error.code).toBe('rate-limited');
    expect(error.retryAt).toBe(new Date(1792567785 * 1000).toISOString());
  });

  it('reports network failures without leaking the token', async () => {
    const error = (await fetchGitHubIssues({
      repo,
      token: 'secret-token',
      fetch: async () => {
        throw new TypeError('Failed to fetch secret-token');
      },
    }).catch((e: unknown) => e)) as ConnectorError;
    expect(error.code).toBe('network');
    expect(error.message).not.toContain('secret-token');
  });
});

describe('readRepoFile / writeRepoFile', () => {
  const text = '{ "name": "Café ☕" }\n';
  const base64 = Buffer.from(text)
    .toString('base64')
    .replace(/(.{20})/g, '$1\n');

  it('reads and decodes a file, UTF-8 safe, with its sha', async () => {
    const fetchLike = vi.fn<FetchLike>(async () =>
      json({ type: 'file', sha: 'abc', encoding: 'base64', content: base64 }),
    );
    const file = await readRepoFile({ repo, token: 't', fetch: fetchLike });
    expect(file).toEqual({ text, sha: 'abc' });
    expect(fetchLike.mock.calls[0]?.[0]).toBe(
      'https://api.github.com/repos/acme/shop/contents/.diorama/scene.json',
    );
  });

  it('returns undefined when the repo has no scene file', async () => {
    expect(
      await readRepoFile({ repo, token: 't', fetch: async () => json({}, { status: 404 }) }),
    ).toBeUndefined();
  });

  it('still reports bad tokens and rejects directories', async () => {
    await expect(
      readRepoFile({ repo, token: 't', fetch: async () => json({}, { status: 401 }) }),
    ).rejects.toMatchObject({ code: 'bad-token' });
    await expect(
      readRepoFile({ repo, token: 't', fetch: async () => json([{ type: 'file' }]) }),
    ).rejects.toMatchObject({ code: 'bad-response' });
  });

  it('writes with the previous sha and returns the new one', async () => {
    const fetchLike = vi.fn<FetchLike>(async () => json({ content: { sha: 'new-sha' } }));
    const sha = await writeRepoFile({
      repo,
      token: 't',
      text,
      message: 'Update scene',
      sha: 'abc',
      fetch: fetchLike,
    });
    expect(sha).toBe('new-sha');
    const init = fetchLike.mock.calls[0]?.[1];
    expect(init?.method).toBe('PUT');
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({ message: 'Update scene', sha: 'abc' });
    expect(Buffer.from(body.content, 'base64').toString()).toBe(text);
  });

  it('creates a file when no sha is given', async () => {
    const fetchLike = vi.fn<FetchLike>(async () => json({ content: { sha: 's' } }));
    await writeRepoFile({ repo, token: 't', text: '{}', message: 'Add scene', fetch: fetchLike });
    expect(JSON.parse(fetchLike.mock.calls[0]?.[1]?.body as string)).not.toHaveProperty('sha');
  });
});
