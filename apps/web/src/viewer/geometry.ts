import { Quaternion, Vector3 } from 'three';
import { layoutParts, type PlacedZone } from '@diorama/themes';

/** Thickness of a zone's floor tile; parts stand on top of it. */
export const PLATFORM_HEIGHT = 0.12;
/** Props are modelled for a cell this wide; larger cells don't scale them up. */
const PROP_CELL = 1.8;

export interface PartPlacement {
  /** Position relative to the zone's centre. */
  local: [number, number, number];
  /** Position in the world. */
  world: [number, number, number];
  scale: number;
}

export function placeParts(zone: PlacedZone, count: number): PartPlacement[] {
  return layoutParts(zone, count).map((cell) => ({
    local: [cell.x, PLATFORM_HEIGHT, cell.z],
    world: [zone.x + cell.x, PLATFORM_HEIGHT, zone.z + cell.z],
    scale: Math.min(1, (cell.size * 0.9) / PROP_CELL),
  }));
}

/** Where a zone's name tag sits: on the floor just in front of the zone. */
export function zoneLabelAnchor(zone: PlacedZone): [number, number, number] {
  return [zone.x, 0.2, zone.z + zone.depth / 2 + 0.5];
}

export interface FlowCurve {
  start: Vector3;
  mid: Vector3;
  end: Vector3;
  arrow: Vector3;
  arrowRotation: Quaternion;
  labelAt: Vector3;
}

const LIFT = 0.5;
const ARROW_AT = 0.8;

/** A quadratic arc between two zone centres, higher for longer flows. */
export function flowCurve(from: { x: number; z: number }, to: { x: number; z: number }): FlowCurve {
  const start = new Vector3(from.x, LIFT, from.z);
  const end = new Vector3(to.x, LIFT, to.z);
  const mid = start.clone().lerp(end, 0.5);
  mid.y = 2.4 + start.distanceTo(end) * 0.12;

  const at = (t: number) =>
    start
      .clone()
      .multiplyScalar((1 - t) ** 2)
      .addScaledVector(mid, 2 * (1 - t) * t)
      .addScaledVector(end, t ** 2);
  const tangent = mid
    .clone()
    .sub(start)
    .multiplyScalar(2 * (1 - ARROW_AT))
    .addScaledVector(end.clone().sub(mid), 2 * ARROW_AT)
    .normalize();

  return {
    start,
    mid,
    end,
    arrow: at(ARROW_AT),
    arrowRotation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), tangent),
    labelAt: at(0.5),
  };
}
