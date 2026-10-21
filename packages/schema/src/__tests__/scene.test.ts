import { describe, expect, it } from 'vitest';
import { parseIssueRef, SceneSchema } from '../index.ts';
import { cornerShop, minimalScene } from './fixtures.ts';

const messages = (input: unknown) => {
  const result = SceneSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('SceneSchema', () => {
  it('accepts the corner-shop example', () => {
    expect(SceneSchema.safeParse(cornerShop()).success).toBe(true);
  });

  it('fills in defaults for parts, issues and flows', () => {
    const scene = SceneSchema.parse(
      minimalScene({
        zones: [
          { id: 'cart', label: 'Cart', metaphor: 'trolley', parts: [{ id: 'a', label: 'A' }] },
        ],
      }),
    );
    expect(scene.flows).toEqual([]);
    expect(scene.zones[0]?.parts[0]?.issues).toEqual([]);
  });

  it.each([
    ['unknown schemaVersion', minimalScene({ schemaVersion: 2 as 1 })],
    ['no zones', minimalScene({ zones: [] })],
    [
      'non-slug zone id',
      minimalScene({ zones: [{ id: 'Cart Zone', label: 'C', metaphor: 'trolley' }] }),
    ],
    [
      'malformed issue ref',
      minimalScene({
        zones: [
          {
            id: 'cart',
            label: 'C',
            metaphor: 'trolley',
            parts: [{ id: 'a', label: 'A', issues: ['12'] }],
          },
        ],
      }),
    ],
    ['typo in a key', { ...minimalScene(), zone: [] }],
  ])('rejects %s', (_, input) => {
    expect(SceneSchema.safeParse(input).success).toBe(false);
  });

  it('rejects duplicate zone ids', () => {
    const zone = { id: 'cart', label: 'Cart', metaphor: 'trolley' };
    expect(messages(minimalScene({ zones: [zone, zone] }))).toContain('duplicate zone id "cart"');
  });

  it('rejects duplicate part ids within a zone but allows them across zones', () => {
    const part = { id: 'list', label: 'List' };
    expect(
      messages(
        minimalScene({
          zones: [{ id: 'cart', label: 'Cart', metaphor: 'trolley', parts: [part, part] }],
        }),
      ),
    ).toContain('duplicate part id "list" in zone "cart"');
    expect(
      messages(
        minimalScene({
          zones: [
            { id: 'cart', label: 'Cart', metaphor: 'trolley', parts: [part] },
            { id: 'catalogue', label: 'Catalogue', metaphor: 'shelves', parts: [part] },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it('rejects flows to unknown zones, to themselves, and duplicates', () => {
    const zones = [
      { id: 'cart', label: 'Cart', metaphor: 'trolley' },
      { id: 'checkout', label: 'Checkout', metaphor: 'counter' },
    ];
    expect(messages(minimalScene({ zones, flows: [{ from: 'cart', to: 'payments' }] }))).toEqual([
      'unknown zone "payments"',
    ]);
    expect(messages(minimalScene({ zones, flows: [{ from: 'cart', to: 'cart' }] }))).toEqual([
      'flow from "cart" to itself',
    ]);
    const flow = { from: 'cart', to: 'checkout', label: 'pay' };
    expect(messages(minimalScene({ zones, flows: [flow, flow] }))).toEqual(['duplicate flow']);
    expect(messages(minimalScene({ zones, flows: [flow, { ...flow, label: 'refund' }] }))).toEqual(
      [],
    );
  });
});

describe('parseIssueRef', () => {
  it('splits provider and id at the first colon', () => {
    expect(parseIssueRef('github:12')).toEqual({ provider: 'github', id: '12' });
    expect(parseIssueRef('jira:SHOP-7')).toEqual({ provider: 'jira', id: 'SHOP-7' });
    expect(parseIssueRef('github:acme/shop:12')).toEqual({
      provider: 'github',
      id: 'acme/shop:12',
    });
  });
});
