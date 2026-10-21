import type { Scene } from '@diorama/schema';
import type { Placement, Slot, Theme } from './types.ts';

export interface PlacedZone extends Placement {
  accent: string;
  /** True when the theme had no free slot for the zone's metaphor. */
  annex: boolean;
  /** Asset for parts of this zone that don't name one. */
  defaultAsset: string;
}

export const ANNEX_ASSET = 'crate';

/** Places every zone: on its metaphor's slot when free, otherwise on the next annex slot. */
export function layoutZones(scene: Scene, theme: Theme): Map<string, PlacedZone> {
  const placed = new Map<string, PlacedZone>();
  const used = new Set<string>();
  let annexIndex = 0;

  for (const zone of scene.zones) {
    const slot: Slot | undefined = Object.hasOwn(theme.slots, zone.metaphor)
      ? theme.slots[zone.metaphor]
      : undefined;
    if (slot && !used.has(zone.metaphor)) {
      used.add(zone.metaphor);
      placed.set(zone.id, { ...slot, annex: false });
      continue;
    }
    placed.set(zone.id, {
      ...annexPlacement(theme, annexIndex++),
      accent: theme.annexAccent,
      annex: true,
      defaultAsset: ANNEX_ASSET,
    });
  }
  return placed;
}

/** Annex slots first, then an open-ended row along the back of the floor. */
function annexPlacement(theme: Theme, index: number): Placement {
  const fixed = theme.annexSlots[index];
  if (fixed) return fixed;
  const overflow = index - theme.annexSlots.length;
  return { x: -12 + overflow * 5, z: -12, width: 4, depth: 3 };
}

export interface PartCell {
  /** Offset from the zone's centre. */
  x: number;
  z: number;
  /** Size of the square a part prop may fill. */
  size: number;
}

/** Spreads `count` parts over a zone in a grid shaped like the zone. */
export function layoutParts(zone: Pick<Placement, 'width' | 'depth'>, count: number): PartCell[] {
  if (count === 0) return [];
  const cols = Math.min(
    count,
    Math.max(1, Math.round(Math.sqrt((count * zone.width) / zone.depth))),
  );
  const rows = Math.ceil(count / cols);
  const cellW = zone.width / cols;
  const cellD = zone.depth / rows;
  const size = Math.min(cellW, cellD);

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: -zone.width / 2 + cellW * (col + 0.5),
      z: -zone.depth / 2 + cellD * (row + 0.5),
      size,
    };
  });
}
