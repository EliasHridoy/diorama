import { useFrame } from '@react-three/fiber';
import type { ReactNode } from 'react';
import type { LabelRegistry } from './labelRegistry.ts';

export interface LabelSpec {
  id: string;
  anchor: [number, number, number];
  className: string;
  content: ReactNode;
}

/** Inside the Canvas: keeps every label on top of its anchor. */
export function LabelProjector({ registry }: { registry: LabelRegistry }) {
  useFrame(({ camera, size }) => registry.project(camera, size.width, size.height));
  return null;
}

/** Outside the Canvas: the labels themselves, as ordinary DOM. */
export function LabelOverlay({
  registry,
  labels,
}: {
  registry: LabelRegistry;
  labels: LabelSpec[];
}) {
  return (
    <div className="labels" aria-hidden="true">
      {labels.map((label) => (
        <div
          key={label.id}
          ref={(el) => (el ? registry.attach(label.id, el) : undefined)}
          className={`label ${label.className}`}
          data-x={label.anchor[0]}
          data-y={label.anchor[1]}
          data-z={label.anchor[2]}
        >
          {label.content}
        </div>
      ))}
    </div>
  );
}
