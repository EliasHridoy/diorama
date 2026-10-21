import { createContext, useContext } from 'react';
import type { Material } from 'three';

/** How the props of one part are drawn; shared by every mesh in the prop. */
export interface PartLook {
  material: Material;
  edgeColor: string | null;
  castShadow: boolean;
}

export const PartLookContext = createContext<PartLook | null>(null);

export function usePartLook(): PartLook {
  const look = useContext(PartLookContext);
  if (!look) throw new Error('Prop rendered outside a PartLookContext');
  return look;
}
