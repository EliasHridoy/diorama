import { SceneSchema, type SceneInput } from '@diorama/schema';
import { describe, expect, it } from 'vitest';
import { ecommerceShop } from './ecommerceShop.ts';
import { layoutParts, layoutZones } from './layout.ts';
import { testBoxes } from './testBoxes.ts';

function scene(metaphors: string[], theme = ecommerceShop.id) {
  const input: SceneInput = {
    schemaVersion: 1,
    project: { name: 'Test' },
    theme,
    zones: metaphors.map((metaphor, i) => ({ id: `z${i}`, label: `Z${i}`, metaphor })),
  };
  return SceneSchema.parse(input);
}

describe('layoutZones', () => {
  it('puts known metaphors on their slot', () => {
    const placed = layoutZones(scene(['entrance', 'shelves']), ecommerceShop);
    expect(placed.get('z0')).toEqual({ ...ecommerceShop.slots.entrance, annex: false });
    expect(placed.get('z1')).toMatchObject({ x: ecommerceShop.slots.shelves?.x, annex: false });
  });

  it('sends unknown metaphors, taken slots and prototype keys to the annex', () => {
    const placed = layoutZones(
      scene(['spaceship', 'shelves', 'shelves', 'constructor']),
      ecommerceShop,
    );
    expect(placed.get('z0')).toMatchObject({ annex: true, defaultAsset: 'crate' });
    expect(placed.get('z1')?.annex).toBe(false);
    expect(placed.get('z2')?.annex).toBe(true);
    expect(placed.get('z3')?.annex).toBe(true);
  });

  it('never stacks two annex zones on the same spot', () => {
    const placed = layoutZones(
      scene(Array.from({ length: 8 }, (_, i) => `unknown-${i}`)),
      ecommerceShop,
    );
    expect(new Set([...placed.values()].map((p) => `${p.x},${p.z}`)).size).toBe(8);
  });

  it('lays the same scene out differently in another theme', () => {
    const placed = layoutZones(scene(['box-a', 'postal-route'], testBoxes.id), testBoxes);
    expect(placed.get('z0')).toMatchObject({ x: -6, z: 0, annex: false });
    expect(placed.get('z1')).toMatchObject({ x: 0, z: -7, annex: false });
  });
});

describe('layoutParts', () => {
  it('returns no cells for no parts', () => {
    expect(layoutParts({ width: 4, depth: 4 }, 0)).toEqual([]);
  });

  it('centres a single part', () => {
    expect(layoutParts({ width: 4, depth: 2 }, 1)).toEqual([{ x: 0, z: 0, size: 2 }]);
  });

  it('keeps every part inside the zone', () => {
    for (const count of [2, 3, 5, 9]) {
      for (const cell of layoutParts({ width: 8, depth: 3 }, count)) {
        expect(Math.abs(cell.x) + cell.size / 2).toBeLessThanOrEqual(4 + 1e-9);
        expect(Math.abs(cell.z) + cell.size / 2).toBeLessThanOrEqual(1.5 + 1e-9);
      }
    }
  });

  it('lays a wide zone out in a row', () => {
    const cells = layoutParts({ width: 8, depth: 2 }, 3);
    expect(new Set(cells.map((c) => c.z)).size).toBe(1);
  });
});
