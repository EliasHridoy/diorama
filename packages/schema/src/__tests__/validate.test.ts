import { describe, expect, it } from 'vitest';
import { validateScene, type ThemeInfo } from '../index.ts';
import { cornerShop, minimalScene } from './fixtures.ts';

const shopTheme: ThemeInfo = {
  id: 'ecommerce-shop',
  metaphors: ['entrance', 'shelves', 'trolley', 'counter', 'warehouse', 'postal-route'],
};

describe('validateScene', () => {
  it('returns the parsed scene on success', () => {
    const result = validateScene(cornerShop());
    expect(result.success).toBe(true);
    if (result.success) expect(result.scene.zones).toHaveLength(6);
  });

  it('reports every error at once, with readable paths', () => {
    const result = validateScene(
      minimalScene({
        zones: [
          {
            id: 'cart',
            label: 'Cart',
            metaphor: 'trolley',
            parts: [{ id: 'a', label: 'A', issues: ['nope'] }],
          },
        ],
        flows: [{ from: 'cart', to: 'ghost' }],
      }),
    );
    expect(result).toEqual({
      success: false,
      errors: [
        { path: 'zones[0].parts[0].issues[0]', message: 'must look like "github:12"' },
        { path: 'flows[0].to', message: 'unknown zone "ghost"' },
      ],
    });
  });

  it.each([
    ['a non-object', null],
    ['a string', 'scene'],
    ['zones of the wrong type', minimalScene({ zones: 'x' as never })],
    [
      'parts of the wrong type',
      minimalScene({ zones: [{ id: 'a', label: 'A', metaphor: 'm', parts: 5 as never }] }),
    ],
    ['a null zone', minimalScene({ zones: [null as never] })],
    ['flows of the wrong type', minimalScene({ flows: 'x' as never })],
    ['a flow with a non-string end', minimalScene({ flows: [{ from: 1 as never, to: 'cart' }] })],
  ])('rejects %s without throwing', (_, input) => {
    expect(validateScene(input).success).toBe(false);
  });

  describe('with a theme', () => {
    it('accepts the example against the shop theme', () => {
      expect(validateScene(cornerShop(), { theme: shopTheme }).success).toBe(true);
    });

    it('rejects metaphors the theme does not have', () => {
      const result = validateScene(
        minimalScene({ zones: [{ id: 'cart', label: 'Cart', metaphor: 'spaceship' }] }),
        { theme: shopTheme },
      );
      expect(result).toEqual({
        success: false,
        errors: [
          {
            path: 'zones[0].metaphor',
            message: 'theme "ecommerce-shop" has no metaphor "spaceship"',
          },
        ],
      });
    });

    it('checks part assets only when the theme lists them', () => {
      const scene = minimalScene({
        zones: [
          {
            id: 'cart',
            label: 'Cart',
            metaphor: 'trolley',
            parts: [{ id: 'a', label: 'A', asset: 'rocket' }],
          },
        ],
      });
      expect(validateScene(scene, { theme: shopTheme }).success).toBe(true);
      expect(validateScene(scene, { theme: { ...shopTheme, assets: ['trolley'] } })).toEqual({
        success: false,
        errors: [
          {
            path: 'zones[0].parts[0].asset',
            message: 'theme "ecommerce-shop" has no asset "rocket"',
          },
        ],
      });
    });

    it('rejects a scene checked against a different theme', () => {
      const result = validateScene(minimalScene(), {
        theme: { id: 'hospital', metaphors: ['trolley'] },
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors[0]?.path).toBe('theme');
    });
  });
});
