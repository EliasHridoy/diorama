import { readFileSync } from 'node:fs';
import { validateScene } from '@diorama/schema';
import { describe, expect, it } from 'vitest';
import { COMMON_KIT, COMMON_KIT_ASSETS } from './commonKit.ts';
import { getTheme, listThemes, themeInfo } from './registry.ts';
import type { Placement } from './types.ts';

const overlaps = (a: Placement, b: Placement) =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.z - b.z) < (a.depth + b.depth) / 2;

describe.each(listThemes().map((theme) => [theme.id, theme] as const))('theme %s', (_, theme) => {
  it('has unique ids and a default asset the theme owns for every slot', () => {
    for (const [metaphor, slot] of Object.entries(theme.slots)) {
      expect(theme.assets, `${metaphor} default asset`).toContain(slot.defaultAsset);
    }
    expect(new Set(theme.assets).size).toBe(theme.assets.length);
  });

  it('includes the whole common kit', () => {
    for (const metaphor of Object.keys(COMMON_KIT)) expect(theme.slots).toHaveProperty(metaphor);
    for (const asset of COMMON_KIT_ASSETS) expect(theme.assets).toContain(asset);
  });

  it('has a crate asset for the annex', () => {
    expect(theme.assets).toContain('crate');
  });

  it('keeps slots and annex slots from overlapping', () => {
    const all: [string, Placement][] = [
      ...Object.entries(theme.slots),
      ...theme.annexSlots.map((p, i): [string, Placement] => [`annex ${i}`, p]),
    ];
    for (const [i, [nameA, a]] of all.entries()) {
      for (const [nameB, b] of all.slice(i + 1)) {
        expect(overlaps(a, b), `${nameA} overlaps ${nameB}`).toBe(false);
      }
    }
  });
});

describe('registry', () => {
  it('finds themes by id and returns undefined for unknown ones', () => {
    expect(getTheme('ecommerce-shop')?.name).toBe('E-commerce shop');
    expect(getTheme('nope')).toBeUndefined();
    expect(getTheme('constructor')).toBeUndefined();
  });

  it('describes a theme for scene validation', () => {
    const info = themeInfo(getTheme('test-boxes')!);
    expect(info.metaphors).toContain('box-a');
    expect(info.assets).toContain('crate');
  });
});

describe('example scene', () => {
  it('validates against the shop theme', () => {
    const json: unknown = JSON.parse(
      readFileSync(new URL('../../../examples/corner-shop.scene.json', import.meta.url), 'utf8'),
    );
    const theme = getTheme('ecommerce-shop')!;
    const result = validateScene(json, { theme: themeInfo(theme) });
    expect(result.success, JSON.stringify(!result.success && result.errors)).toBe(true);
  });
});
