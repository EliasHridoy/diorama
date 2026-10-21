import { listThemes } from '@diorama/themes';
import { describe, expect, it } from 'vitest';
import { PROP_ASSETS } from './props.tsx';

describe('props', () => {
  it.each(listThemes().map((theme) => [theme.id, theme] as const))(
    'can draw every asset of theme %s',
    (_, theme) => {
      expect(PROP_ASSETS).toEqual(expect.arrayContaining([...theme.assets]));
    },
  );
});
