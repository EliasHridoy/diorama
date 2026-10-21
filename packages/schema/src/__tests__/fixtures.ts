import { readFileSync } from 'node:fs';
import type { IssueState, SceneInput } from '../index.ts';

const examples = new URL('../../../../examples/', import.meta.url);

export function readExample<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(name, examples), 'utf8')) as T;
}

export const cornerShop = () => readExample<SceneInput>('corner-shop.scene.json');

export const cornerShopIssues = () =>
  new Map(Object.entries(readExample<Record<string, IssueState>>('corner-shop.issues.json')));

/** Smallest valid scene; tests override the bits they care about. */
export function minimalScene(overrides: Partial<SceneInput> = {}): SceneInput {
  return {
    schemaVersion: 1,
    project: { name: 'Test' },
    theme: 'ecommerce-shop',
    zones: [{ id: 'cart', label: 'Cart', metaphor: 'trolley' }],
    ...overrides,
  };
}
