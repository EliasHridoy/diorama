import type { CommonKitEntry, Placement, Slot } from './types.ts';

/**
 * Metaphors for modules most products have, whatever their business (D-13):
 * analytics, notifications and translation.
 */
export const COMMON_KIT = {
  'analyst-room': {
    accent: '#4a7c9d',
    defaultAsset: 'analyst-desk',
    assets: ['analyst-desk'],
  },
  'postal-route': {
    accent: '#d1495b',
    defaultAsset: 'letterbox',
    assets: ['mailbox', 'sorting-station', 'letterbox'],
  },
  interpreter: {
    accent: '#7b61c9',
    defaultAsset: 'interpreter',
    assets: ['interpreter'],
  },
} as const satisfies Record<string, CommonKitEntry>;

export type CommonKitMetaphor = keyof typeof COMMON_KIT;

/** Where a theme puts each common-kit metaphor on its floor. */
export type CommonKitPlacements = Record<CommonKitMetaphor, Placement>;

/** Turns placements for the common kit into slots a theme can spread into `slots`. */
export function commonKitSlots(placements: CommonKitPlacements): Record<CommonKitMetaphor, Slot> {
  const entries = (Object.keys(COMMON_KIT) as CommonKitMetaphor[]).map((metaphor) => {
    const { accent, defaultAsset } = COMMON_KIT[metaphor];
    return [metaphor, { ...placements[metaphor], accent, defaultAsset }] as const;
  });
  return Object.fromEntries(entries) as Record<CommonKitMetaphor, Slot>;
}

/** Every asset the common kit adds to a theme. */
export const COMMON_KIT_ASSETS: readonly string[] = Object.values(COMMON_KIT).flatMap(
  (entry) => entry.assets,
);
