import type { Zone, ZoneStatus } from '@diorama/schema';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';
import { Color } from 'three';
import type { PlacedZone } from '../theme/shopLayout.ts';
import { PLATFORM_HEIGHT, type PartPlacement } from './geometry.ts';
import { PartModel } from './PartModel.tsx';

interface ZoneViewProps {
  zone: Zone;
  placed: PlacedZone;
  parts: PartPlacement[];
  status: ZoneStatus;
  selected: boolean;
  hovered: boolean;
  hoveredPart: string | null;
  onSelect: (zoneId: string) => void;
  onHover: (zoneId: string | null) => void;
  onHoverPart: (partId: string | null) => void;
}

export function ZoneView({
  zone,
  placed,
  parts,
  status,
  selected,
  hovered,
  hoveredPart,
  onSelect,
  onHover,
  onHoverPart,
}: ZoneViewProps) {
  const floorColor = useMemo(
    () => new Color('#ffffff').lerp(new Color(placed.accent), 0.3),
    [placed.accent],
  );

  return (
    <group
      position={[placed.x, 0, placed.z]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(zone.id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(zone.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <mesh position={[0, PLATFORM_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[placed.width, PLATFORM_HEIGHT, placed.depth]} />
        <meshStandardMaterial
          color={floorColor}
          emissive={placed.accent}
          emissiveIntensity={selected ? 0.35 : hovered ? 0.18 : 0}
          roughness={0.9}
        />
      </mesh>

      {zone.parts.map((part, i) => {
        const placement = parts[i];
        const partStatus = status.parts.get(part.id);
        if (!placement || !partStatus) return null;
        return (
          <group
            key={part.id}
            position={placement.local}
            scale={placement.scale}
            onPointerOver={() => onHoverPart(part.id)}
            onPointerOut={() => onHoverPart(null)}
          >
            <PartModel
              asset={part.asset}
              metaphor={zone.metaphor}
              status={partStatus.status}
              accent={placed.accent}
              highlighted={hoveredPart === part.id}
            />
          </group>
        );
      })}
    </group>
  );
}
