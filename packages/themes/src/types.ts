/** A rectangular area of the floor a zone is drawn on. Units are roughly metres. */
export interface Placement {
  x: number;
  z: number;
  width: number;
  depth: number;
}

/** A place in a theme that a module can be drawn at. Its key in `Theme.slots` is the metaphor. */
export interface Slot extends Placement {
  /** Colour the zone's parts take once built. */
  accent: string;
  /** Asset used for parts that don't name one. */
  defaultAsset: string;
}

/** A metaphor that works in every theme (D-13). Each theme decides where it goes. */
export interface CommonKitEntry {
  accent: string;
  defaultAsset: string;
  /** Assets only this metaphor uses, so scenes can name them. */
  assets: readonly string[];
}

export interface Theme {
  id: string;
  name: string;
  /** Slots by metaphor, including the common kit placed on this theme's floor. */
  slots: Readonly<Record<string, Slot>>;
  /** Places for modules that fit no slot, used in order. Beyond them zones form a back row. */
  annexSlots: readonly Placement[];
  annexAccent: string;
  /** Every asset parts in this theme may name. */
  assets: readonly string[];
}
