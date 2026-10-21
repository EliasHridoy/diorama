import type { BuildStatus } from '@diorama/schema';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { PartAnimator, type LookTarget } from './partAnimator.ts';
import { PartLookContext } from './partLook.ts';
import { Prop } from './props.tsx';
import { DROPPED_COLOR, GHOST_COLOR, STATUS_LOOK } from './statusStyle.ts';

interface PartModelProps {
  asset: string;
  status: BuildStatus;
  accent: string;
  highlighted: boolean;
}

function ghostColor(status: BuildStatus): string | null {
  if (status === 'planned') return GHOST_COLOR;
  return status === 'dropped' ? DROPPED_COLOR : null;
}

/** One part's prop, easing between ghost, in-progress and built looks as its status changes. */
export function PartModel({ asset, status, accent, highlighted }: PartModelProps) {
  const look = STATUS_LOOK[status];
  const target: LookTarget = {
    opacity: look.opacity,
    color: ghostColor(status) ?? accent,
    glow: highlighted ? accent : null,
  };
  const [animator] = useState(() => new PartAnimator(target));
  useEffect(() => () => animator.dispose(), [animator]);

  const group = useRef<Group>(null);
  const previous = useRef(status);
  useEffect(() => {
    if (status === 'done' && previous.current !== 'done' && group.current) {
      animator.drop(group.current);
    }
    previous.current = status;
  }, [status, animator]);

  useFrame((_, delta) => animator.step(delta, target, group.current));

  const partLook = useMemo(
    () => ({
      material: animator.material,
      edgeColor: look.edgeColor,
      castShadow: status === 'in_progress' || status === 'done',
    }),
    [animator, look.edgeColor, status],
  );

  return (
    <group ref={group}>
      <PartLookContext.Provider value={partLook}>
        <Prop asset={asset} />
      </PartLookContext.Provider>
    </group>
  );
}
