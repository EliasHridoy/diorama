import { COMMON_KIT_ASSETS, commonKitSlots } from './commonKit.ts';
import type { Theme } from './types.ts';

/** The pilot theme: an online shop becomes a shop floor, viewed from the front (+z). */
export const ecommerceShop: Theme = {
  id: 'ecommerce-shop',
  name: 'E-commerce shop',
  slots: {
    entrance: { x: 0, z: 6, width: 7, depth: 3, accent: '#f08a4b', defaultAsset: 'door' },
    shelves: { x: -6, z: 0, width: 8, depth: 5, accent: '#2a9d8f', defaultAsset: 'shelf' },
    trolley: { x: 1, z: 0.5, width: 4, depth: 4, accent: '#e9b949', defaultAsset: 'trolley' },
    counter: { x: 7, z: 0.5, width: 5, depth: 4, accent: '#c05299', defaultAsset: 'counter' },
    warehouse: { x: -6, z: -6.5, width: 8, depth: 4, accent: '#8d6e63', defaultAsset: 'pallet' },
    ...commonKitSlots({
      'analyst-room': { x: 1.5, z: -6.5, width: 5, depth: 4 },
      'postal-route': { x: 8.5, z: -6.5, width: 7, depth: 4 },
      interpreter: { x: 8, z: 6, width: 5, depth: 3 },
    }),
  },
  annexSlots: [
    { x: -8, z: 6, width: 5, depth: 3 },
    { x: -13, z: 0, width: 3, depth: 5 },
    { x: -13, z: -6.5, width: 3, depth: 4 },
    { x: 13, z: 0.5, width: 3, depth: 4 },
  ],
  annexAccent: '#7a869a',
  assets: [
    'door',
    'security-desk',
    'shelf',
    'aisle-sign',
    'trolley',
    'counter',
    'till',
    'card-reader',
    'pallet',
    'crate',
    ...COMMON_KIT_ASSETS,
  ],
};
