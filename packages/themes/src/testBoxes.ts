import { COMMON_KIT_ASSETS, commonKitSlots } from './commonKit.ts';
import type { Theme } from './types.ts';

/**
 * A deliberately tiny second theme: a row of coloured crates. It exists to prove that a
 * theme is just data. Switching a scene to it needs no viewer changes.
 */
export const testBoxes: Theme = {
  id: 'test-boxes',
  name: 'Test boxes',
  slots: {
    'box-a': { x: -6, z: 0, width: 5, depth: 5, accent: '#e76f51', defaultAsset: 'crate' },
    'box-b': { x: 0, z: 0, width: 5, depth: 5, accent: '#2a9d8f', defaultAsset: 'crate' },
    'box-c': { x: 6, z: 0, width: 5, depth: 5, accent: '#e9b949', defaultAsset: 'crate' },
    ...commonKitSlots({
      'analyst-room': { x: -6, z: -7, width: 5, depth: 4 },
      'postal-route': { x: 0, z: -7, width: 5, depth: 4 },
      interpreter: { x: 6, z: -7, width: 5, depth: 4 },
    }),
  },
  annexSlots: [{ x: 0, z: 7, width: 6, depth: 3 }],
  annexAccent: '#7a869a',
  assets: ['crate', ...COMMON_KIT_ASSETS],
};
