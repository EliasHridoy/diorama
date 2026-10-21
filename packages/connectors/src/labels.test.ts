import { SceneSchema, deriveStatus, type SceneInput } from '@diorama/schema';
import { describe, expect, it } from 'vitest';
import { applyLabelLinks, toIssueStates } from './index.ts';
import { issue } from './testing.ts';

const scene = SceneSchema.parse({
  schemaVersion: 1,
  project: { name: 'Shop' },
  theme: 'ecommerce-shop',
  zones: [
    {
      id: 'cart',
      label: 'Cart',
      metaphor: 'trolley',
      parts: [
        { id: 'trolley', label: 'Trolley', issues: ['github:1'] },
        { id: 'page', label: 'Page' },
      ],
    },
    { id: 'auth', label: 'Auth', metaphor: 'entrance', parts: [{ id: 'login', label: 'Login' }] },
  ],
} satisfies SceneInput);

const partIssues = (s: typeof scene, zone: string, part: string) =>
  s.zones.find((z) => z.id === zone)?.parts.find((p) => p.id === part)?.issues;

describe('applyLabelLinks', () => {
  it('links issues to parts by part label, case-insensitively', () => {
    const result = applyLabelLinks(scene, [
      issue(2, { labels: ['part:cart/page'] }),
      issue(3, { labels: ['Part:Auth/Login', 'bug'] }),
    ]);
    expect(partIssues(result.scene, 'cart', 'page')).toEqual(['github:2']);
    expect(partIssues(result.scene, 'auth', 'login')).toEqual(['github:3']);
    expect(result.labelLinked.map((i) => i.ref)).toEqual(['github:2', 'github:3']);
    expect(result.unmapped).toEqual([]);
  });

  it('does not change the original scene or move issues the scene already links', () => {
    const result = applyLabelLinks(scene, [issue(1, { labels: ['part:auth/login'] })]);
    expect(partIssues(result.scene, 'auth', 'login')).toEqual([]);
    expect(partIssues(scene, 'cart', 'page')).toEqual([]);
    expect(result.unmapped).toEqual([]);
  });

  it('explains why an issue is unmapped', () => {
    const result = applyLabelLinks(scene, [
      issue(4),
      issue(5, { labels: ['zone:cart'] }),
      issue(6, { labels: ['part:cart/wheel'] }),
      issue(7, { labels: ['zone:spaceship'] }),
    ]);
    expect(result.unmapped.map((u) => [u.issue.ref, u.reason, u.label])).toEqual([
      ['github:4', 'no-label', undefined],
      ['github:5', 'zone-only', 'zone:cart'],
      ['github:6', 'unknown-target', 'part:cart/wheel'],
      ['github:7', 'unknown-target', 'zone:spaceship'],
    ]);
  });

  it('is idempotent: applying it to its own result changes nothing', () => {
    const issues = [issue(2, { labels: ['part:cart/page'] })];
    const once = applyLabelLinks(scene, issues);
    const twice = applyLabelLinks(once.scene, issues);
    expect(twice.scene).toEqual(once.scene);
    expect(twice.labelLinked).toEqual([]);
  });

  it('feeds status: closing a labelled issue makes its part done', () => {
    const open = [issue(2, { labels: ['part:cart/page'] })];
    const closed = [
      issue(2, { labels: ['part:cart/page'], state: 'closed', stateReason: 'completed' }),
    ];
    const status = (issues: typeof open) =>
      deriveStatus(applyLabelLinks(scene, issues).scene, toIssueStates(issues))
        .zones.get('cart')
        ?.parts.get('page')?.status;
    expect(status(open)).toBe('planned');
    expect(status(closed)).toBe('done');
  });
});

describe('toIssueStates', () => {
  it('keeps only what drives status', () => {
    const states = toIssueStates([
      issue(1),
      issue(2, { hasOpenPullRequest: true }),
      issue(3, { state: 'closed', stateReason: 'not_planned' }),
    ]);
    expect(states.get('github:1')).toEqual({ state: 'open' });
    expect(states.get('github:2')).toEqual({ state: 'open', hasOpenPullRequest: true });
    expect(states.get('github:3')).toEqual({ state: 'closed', stateReason: 'not_planned' });
  });
});
