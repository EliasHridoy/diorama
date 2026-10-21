import { PerspectiveCamera } from 'three';
import { describe, expect, it } from 'vitest';
import { LabelRegistry } from './labelRegistry.ts';

function fakeElement(x: number, y: number, z: number) {
  return {
    dataset: { x: String(x), y: String(y), z: String(z) },
    style: {} as CSSStyleDeclaration,
  } as unknown as HTMLElement;
}

const camera = new PerspectiveCamera(50, 2, 0.1, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();

describe('LabelRegistry', () => {
  it('puts a label at the screen position of its anchor', () => {
    const registry = new LabelRegistry();
    const el = fakeElement(0, 0, 0);
    registry.attach('a', el);
    registry.project(camera, 800, 400);
    expect(el.style.visibility).toBe('visible');
    expect(el.style.transform).toBe('translate(-50%, -50%) translate(400px, 200px)');
  });

  it('hides labels behind the camera', () => {
    const registry = new LabelRegistry();
    const el = fakeElement(0, 0, 20);
    registry.attach('a', el);
    registry.project(camera, 800, 400);
    expect(el.style.visibility).toBe('hidden');
  });

  it('stops moving a label once detached, but not if a newer element took its id', () => {
    const registry = new LabelRegistry();
    const old = fakeElement(0, 0, 0);
    const detachOld = registry.attach('a', old);
    const fresh = fakeElement(0, 0, 0);
    registry.attach('a', fresh);
    detachOld();
    registry.project(camera, 800, 400);
    expect(fresh.style.transform).toBeDefined();
    expect(old.style.transform).toBeUndefined();
  });
});
