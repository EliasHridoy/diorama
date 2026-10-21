import type { ThemeInfo } from '@diorama/schema';
import { ecommerceShop } from './ecommerceShop.ts';
import { testBoxes } from './testBoxes.ts';
import type { Theme } from './types.ts';

const THEMES: readonly Theme[] = [ecommerceShop, testBoxes];

export function listThemes(): readonly Theme[] {
  return THEMES;
}

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((theme) => theme.id === id);
}

/** What scene validation needs to know about a theme. */
export function themeInfo(theme: Theme): ThemeInfo {
  return { id: theme.id, metaphors: Object.keys(theme.slots), assets: theme.assets };
}
