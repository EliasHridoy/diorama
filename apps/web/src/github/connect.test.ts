import { ConnectorError } from '@diorama/connectors';
import { describe, expect, it } from 'vitest';
import { connectToRepo, describeError } from './connect.ts';

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), init);
const issuesPage = json({
  data: {
    repository: { issues: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } },
  },
});
const sceneFile = (text: string) =>
  json({ type: 'file', sha: 'a', encoding: 'base64', content: btoa(text) });

/** Fake GitHub: GraphQL for issues, contents for the scene file. */
function fakeGitHub(scene: Response) {
  return async (url: string) => (url.endsWith('/graphql') ? issuesPage.clone() : scene.clone());
}

describe('connectToRepo', () => {
  it('rejects malformed input before calling GitHub', async () => {
    const never = async () => {
      throw new Error('should not be called');
    };
    expect(await connectToRepo({ repoText: 'nope', token: 't', fetch: never })).toMatchObject({
      ok: false,
      message: expect.stringContaining('owner/name'),
    });
    expect(await connectToRepo({ repoText: 'a/b', token: '  ', fetch: never })).toMatchObject({
      ok: false,
      message: 'Enter a GitHub token.',
    });
  });

  it('returns the repo scene and issues', async () => {
    const result = await connectToRepo({
      repoText: 'https://github.com/acme/shop',
      token: ' tok ',
      fetch: fakeGitHub(sceneFile('{"a":1}')),
    });
    expect(result).toMatchObject({
      ok: true,
      connection: { repo: { owner: 'acme', name: 'shop' }, token: 'tok' },
      scene: { json: { a: 1 }, source: 'github:acme/shop/.diorama/scene.json' },
      issues: { issues: [], truncated: false },
    });
  });

  it('connects without a scene file', async () => {
    const result = await connectToRepo({
      repoText: 'acme/shop',
      token: 't',
      fetch: fakeGitHub(json({}, { status: 404 })),
    });
    expect(result).toMatchObject({ ok: true, scene: null });
  });

  it('reports invalid scene JSON, bad tokens, and never echoes the token', async () => {
    const badJson = await connectToRepo({
      repoText: 'acme/shop',
      token: 't',
      fetch: fakeGitHub(sceneFile('{oops')),
    });
    expect(badJson).toMatchObject({
      ok: false,
      message: expect.stringContaining('not valid JSON'),
    });

    const rejected = await connectToRepo({
      repoText: 'acme/shop',
      token: 'secret-token',
      fetch: async () => json({}, { status: 401 }),
    });
    expect(rejected).toMatchObject({
      ok: false,
      message: expect.stringContaining('rejected the token'),
    });
    expect(JSON.stringify(rejected)).not.toContain('secret-token');
  });
});

describe('describeError', () => {
  it('shows the retry time for rate limits and hides unknown errors', () => {
    const retryAt = '2026-10-21T10:00:00Z';
    expect(describeError(new ConnectorError('rate-limited', 'limit', retryAt))).toContain(
      'Try again after',
    );
    expect(describeError(new Error('secret-token leaked'))).toBe(
      'Something went wrong talking to GitHub.',
    );
  });
});
