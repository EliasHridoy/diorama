import { describe, expect, it } from 'vitest';
import { fromJson, isSceneJson, loadFromSearch } from './loadScene.ts';

const scene = {
  schemaVersion: 1,
  project: { name: 'Remote' },
  theme: 'ecommerce-shop',
  zones: [
    {
      id: 'cart',
      label: 'Cart',
      metaphor: 'trolley',
      parts: [{ id: 'a', label: 'A', issues: ['github:1'] }],
    },
  ],
};

function fakeFetch(files: Record<string, unknown>) {
  return async (url: string) => ({
    ok: url in files,
    status: url in files ? 200 : 404,
    json: async () => files[url],
  });
}

describe('loadFromSearch', () => {
  it('loads the bundled example with its issue states by default', async () => {
    const result = await loadFromSearch('');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.scene.project.name).toBe('Corner Shop');
      expect(result.value.issues.size).toBe(17);
    }
  });

  it('loads a scene and issues from URLs', async () => {
    const result = await loadFromSearch(
      '?scene=/s.json&issues=/i.json',
      fakeFetch({ '/s.json': scene, '/i.json': { 'github:1': { state: 'closed' } } }),
    );
    expect(result.ok && result.value.issues.get('github:1')).toEqual({ state: 'closed' });
  });

  it('treats a scene without an issues file as nothing reported yet', async () => {
    const result = await loadFromSearch('?scene=/s.json', fakeFetch({ '/s.json': scene }));
    expect(result.ok && result.value.issues.size).toBe(0);
  });

  it('reports HTTP failures and invalid scenes as errors', async () => {
    const missing = await loadFromSearch('?scene=/nope.json', fakeFetch({}));
    expect(missing).toMatchObject({
      ok: false,
      errors: [{ message: expect.stringContaining('404') }],
    });

    const invalid = await loadFromSearch(
      '?scene=/s.json',
      fakeFetch({ '/s.json': { ...scene, zones: [] } }),
    );
    expect(invalid).toMatchObject({ ok: false, source: '/s.json', errors: [{ path: 'zones' }] });
  });
});

describe('fromJson', () => {
  it('prefixes issue-file errors so they are not mistaken for scene errors', () => {
    const result = fromJson(scene, { 'github:1': { state: 'merged' } }, 'test');
    expect(result).toMatchObject({ ok: false, errors: [{ path: 'issues: github:1.state' }] });
  });
});

describe('isSceneJson', () => {
  it('recognises scenes by schemaVersion', () => {
    expect(isSceneJson(scene)).toBe(true);
    expect(isSceneJson({ 'github:1': { state: 'open' } })).toBe(false);
    expect(isSceneJson(null)).toBe(false);
  });
});
