import { Color, MeshStandardMaterial, type Object3D } from 'three';

export interface LookTarget {
  opacity: number;
  color: string;
  /** Accent colour to glow with, or null for no highlight. */
  glow: string | null;
}

/** Height a part drops from when it becomes built. */
const DROP_HEIGHT = 1.2;
const EASE_RATE = 6;

/** Owns a part's material and eases it, and the part's height, towards a target look. */
export class PartAnimator {
  readonly material: MeshStandardMaterial;
  private readonly color = new Color();

  constructor(initial: LookTarget) {
    this.material = new MeshStandardMaterial({
      color: initial.color,
      opacity: initial.opacity,
      transparent: true,
      depthWrite: initial.opacity === 1,
      roughness: 0.75,
    });
  }

  /** Lifts the part so it visibly drops into place. */
  drop(object: Object3D): void {
    object.position.y = DROP_HEIGHT;
  }

  step(delta: number, target: LookTarget, object: Object3D | null): void {
    const k = 1 - Math.exp(-delta * EASE_RATE);
    const m = this.material;
    m.opacity += (target.opacity - m.opacity) * k;
    m.depthWrite = m.opacity > 0.95;
    m.color.lerp(this.color.set(target.color), k);
    m.emissive.set(target.glow ?? '#000000');
    m.emissiveIntensity = target.glow ? 0.3 : 0;
    if (object) object.position.y *= 1 - k;
  }

  dispose(): void {
    this.material.dispose();
  }
}
