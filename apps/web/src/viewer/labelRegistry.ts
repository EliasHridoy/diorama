import { Vector3, type Camera } from 'three';

/**
 * DOM labels pinned to points in the 3D scene. Elements carry their anchor in `data-x/y/z`;
 * `project` moves each one to its on-screen position every frame. One plain DOM layer
 * instead of a React root per label (which drei's <Html> uses).
 */
export class LabelRegistry {
  private readonly elements = new Map<string, HTMLElement>();
  private readonly point = new Vector3();

  attach(id: string, element: HTMLElement): () => void {
    this.elements.set(id, element);
    return () => {
      if (this.elements.get(id) === element) this.elements.delete(id);
    };
  }

  project(camera: Camera, width: number, height: number): void {
    for (const element of this.elements.values()) {
      const { x, y, z } = element.dataset;
      this.point.set(Number(x), Number(y), Number(z)).project(camera);
      const behind = this.point.z > 1;
      element.style.visibility = behind ? 'hidden' : 'visible';
      if (behind) continue;
      const left = ((this.point.x + 1) / 2) * width;
      const top = ((1 - this.point.y) / 2) * height;
      element.style.transform = `translate(-50%, -50%) translate(${left}px, ${top}px)`;
    }
  }
}
