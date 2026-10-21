import { describe, expect, it } from 'vitest';
import { deriveStatus, SceneSchema, type IssueState, type SceneInput } from '../index.ts';
import { cornerShop, cornerShopIssues, minimalScene } from './fixtures.ts';

const open: IssueState = { state: 'open' };
const closed: IssueState = { state: 'closed' };
const openWithPr: IssueState = { state: 'open', hasOpenPullRequest: true };

/** One zone with one part per entry of `parts`, each linked to the given issues. */
function sceneWithParts(parts: string[][]): SceneInput {
  return minimalScene({
    zones: [
      {
        id: 'cart',
        label: 'Cart',
        metaphor: 'trolley',
        parts: parts.map((issues, i) => ({ id: `p${i}`, label: `P${i}`, issues })),
      },
    ],
  });
}

function statusOf(parts: string[][], issues: Record<string, IssueState>) {
  return deriveStatus(SceneSchema.parse(sceneWithParts(parts)), new Map(Object.entries(issues)));
}

describe('deriveStatus: parts', () => {
  it.each([
    [
      'all issues closed',
      ['github:1', 'github:2'],
      { 'github:1': closed, 'github:2': closed },
      'done',
      1,
    ],
    [
      'some issues closed',
      ['github:1', 'github:2'],
      { 'github:1': closed, 'github:2': open },
      'in_progress',
      0.5,
    ],
    ['an open PR but nothing closed', ['github:1'], { 'github:1': openWithPr }, 'in_progress', 0],
    ['all issues open', ['github:1'], { 'github:1': open }, 'planned', 0],
    ['no issues linked', [], {}, 'planned', 0],
  ] as const)('%s', (_, issues, states, status, progress) => {
    const part = statusOf([[...issues]], states)
      .zones.get('cart')
      ?.parts.get('p0');
    expect(part?.status).toBe(status);
    expect(part?.progress).toBe(progress);
  });

  it('counts an issue linked twice to the same part once', () => {
    const part = statusOf([['github:1', 'github:1']], { 'github:1': closed })
      .zones.get('cart')
      ?.parts.get('p0');
    expect(part).toEqual({ status: 'done', progress: 1, closedIssues: 1, totalIssues: 1 });
  });

  it('treats issues the tracker did not report as open and lists them', () => {
    const status = statusOf([['github:1', 'github:2']], { 'github:1': closed });
    expect(status.zones.get('cart')?.parts.get('p0')?.status).toBe('in_progress');
    expect(status.missingIssues).toEqual(['github:2']);
  });
});

describe('deriveStatus: zones and scene', () => {
  it('rolls part statuses up to the zone', () => {
    const issues = { 'github:1': closed, 'github:2': open };
    expect(statusOf([['github:1'], ['github:1']], issues).zones.get('cart')?.status).toBe('done');
    expect(statusOf([['github:2'], ['github:2']], issues).zones.get('cart')?.status).toBe(
      'planned',
    );
    expect(statusOf([['github:1'], ['github:2']], issues).zones.get('cart')?.status).toBe(
      'in_progress',
    );
  });

  it('treats a zone without parts as planned', () => {
    const status = deriveStatus(SceneSchema.parse(minimalScene()), new Map());
    expect(status.zones.get('cart')).toMatchObject({ status: 'planned', progress: 0 });
    expect(status.progress).toBe(0);
  });

  it('averages progress over parts', () => {
    const status = statusOf([['github:1'], ['github:1', 'github:2'], ['github:2']], {
      'github:1': closed,
      'github:2': open,
    });
    expect(status.zones.get('cart')?.progress).toBe(0.5);
    expect(status.progress).toBe(0.5);
  });

  it('derives the expected statuses for the corner-shop example', () => {
    const status = deriveStatus(SceneSchema.parse(cornerShop()), cornerShopIssues());
    const zoneStatuses = Object.fromEntries([...status.zones].map(([id, z]) => [id, z.status]));
    expect(zoneStatuses).toEqual({
      auth: 'done',
      catalogue: 'in_progress',
      cart: 'in_progress',
      checkout: 'planned',
      inventory: 'planned',
      notifications: 'in_progress',
    });
    expect(status.missingIssues).toEqual([]);
    expect(status.progress).toBeCloseTo(6 / 15);
  });
});
