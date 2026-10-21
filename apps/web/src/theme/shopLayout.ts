import type { Scene } from '@diorama/schema';

/** A rectangular area of the floor a zone is drawn on. Units are roughly metres. */
export interface Slot {
  x: number;
  z: number;
  width: number;
  depth: number;
  /** Colour the zone's parts take once built. */
  accent: string;
}

export interface PlacedZone extends Slot {
  /** True when the theme had no slot for the zone's metaphor (or it was taken). */
  annex: boolean;
}

/**
 * Shop floor plan, viewed from the front (+z faces the camera). The last three slots are
 * the common kit (D-13). Phase 3 moves this into a theme package.
 */
export const SHOP_SLOTS: Readonly<Record<string, Slot>> = {
  entrance: { x: 0, z: 6, width: 7, depth: 3, accent: '#f08a4b' },
  shelves: { x: -6, z: 0, width: 8, depth: 5, accent: '#2a9d8f' },
  trolley: { x: 1, z: 0.5, width: 4, depth: 4, accent: '#e9b949' },
  counter: { x: 7, z: 0.5, width: 5, depth: 4, accent: '#c05299' },
  warehouse: { x: -6, z: -6.5, width: 8, depth: 4, accent: '#8d6e63' },
  'analyst-room': { x: 1.5, z: -6.5, width: 5, depth: 4, accent: '#4a7c9d' },
  'postal-route': { x: 8.5, z: -6.5, width: 7, depth: 4, accent: '#d1495b' },
  interpreter: { x: 8, z: 6, width: 5, depth: 3, accent: '#7b61c9' },
};

const ANNEX_ACCENT = '#7a869a';
const ANNEX_SLOTS: readonly Omit<Slot, 'accent'>[] = [
  { x: -8, z: 6, width: 5, depth: 3 },
  { x: -13, z: 0, width: 3, depth: 5 },
  { x: -13, z: -6.5, width: 3, depth: 4 },
  { x: 13, z: 0.5, width: 3, depth: 4 },
];

/** Places every zone: on its metaphor's slot when free, otherwise on the next annex slot. */
export function layoutZones(scene: Scene): Map<string, PlacedZone> {
  const placed = new Map<string, PlacedZone>();
  const used = new Set<string>();
  let annexIndex = 0;

  for (const zone of scene.zones) {
    const slot = Object.hasOwn(SHOP_SLOTS, zone.metaphor) ? SHOP_SLOTS[zone.metaphor] : undefined;
    if (slot && !used.has(zone.metaphor)) {
      used.add(zone.metaphor);
      placed.set(zone.id, { ...slot, annex: false });
      continue;
    }
    placed.set(zone.id, { ...annexSlot(annexIndex++), accent: ANNEX_ACCENT, annex: true });
  }
  return placed;
}

/** Annex slots first, then an open-ended row along the back of the shop. */
function annexSlot(index: number): Omit<Slot, 'accent'> {
  const fixed = ANNEX_SLOTS[index];
  if (fixed) return fixed;
  const overflow = index - ANNEX_SLOTS.length;
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
export function layoutParts(zone: Pick<Slot, 'width' | 'depth'>, count: number): PartCell[] {
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
