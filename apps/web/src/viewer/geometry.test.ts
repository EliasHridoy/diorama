import { describe, expect, it } from 'vitest';
import type { PlacedZone } from '@diorama/themes';
import { flowCurve, PLATFORM_HEIGHT, placeParts, zoneLabelAnchor } from './geometry.ts';

const zone: PlacedZone = {
  x: 10,
  z: -4,
  width: 6,
  depth: 2,
  accent: '#000',
  annex: false,
  defaultAsset: 'crate',
};

describe('placeParts', () => {
  it('offsets parts by the zone position and stands them on the platform', () => {
    const [first] = placeParts(zone, 1);
    expect(first?.local).toEqual([0, PLATFORM_HEIGHT, 0]);
    expect(first?.world).toEqual([10, PLATFORM_HEIGHT, -4]);
  });

  it('never scales props up beyond their modelled size', () => {
    for (const p of placeParts({ ...zone, width: 40, depth: 40 }, 1)) expect(p.scale).toBe(1);
    for (const p of placeParts(zone, 6)) expect(p.scale).toBeLessThan(1);
  });
});

describe('zoneLabelAnchor', () => {
  it('sits in front of the zone', () => {
    expect(zoneLabelAnchor(zone)).toEqual([10, 0.2, -4 + 1 + 0.5]);
  });
});

describe('flowCurve', () => {
  it('arcs above both ends and puts the arrow near the destination', () => {
    const curve = flowCurve({ x: 0, z: 0 }, { x: 10, z: 0 });
    expect(curve.mid.y).toBeGreaterThan(curve.start.y);
    expect(curve.labelAt.x).toBeCloseTo(5);
    expect(curve.arrow.x).toBeGreaterThan(5);
    expect(curve.arrow.x).toBeLessThan(10);
  });

  it('points the arrowhead downhill, towards the destination', () => {
    const curve = flowCurve({ x: 0, z: 0 }, { x: 10, z: 0 });
    const up = { x: 0, y: 1, z: 0 };
    // Rotate the cone's up axis by the quaternion and check it heads +x and down.
    const { x, y, z, w } = curve.arrowRotation;
    const dirX = 2 * (x * y - w * z) * up.y;
    const dirY = (1 - 2 * (x * x + z * z)) * up.y;
    expect(dirX).toBeGreaterThan(0);
    expect(dirY).toBeLessThan(0);
  });
});
