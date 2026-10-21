import type { Scene, SceneStatus } from '@diorama/schema';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../telemetry.ts';
import { layoutZones } from '../theme/shopLayout.ts';
import { FlowLine } from './FlowLine.tsx';
import { flowCurve, placeParts, zoneLabelAnchor } from './geometry.ts';
import { LabelRegistry } from './labelRegistry.ts';
import { LabelOverlay, LabelProjector, type LabelSpec } from './Labels.tsx';
import { STATUS_LOOK } from './statusStyle.ts';
import { ZoneView } from './ZoneView.tsx';

interface ViewerProps {
  scene: Scene;
  status: SceneStatus;
  selectedZone: string | null;
  onSelectZone: (zoneId: string | null) => void;
}

const BACKGROUND = '#eef2f8';
const CAMERA_POSITION = [15, 17, 21] as const;

/** Starting camera: further back on tall (phone) screens so the whole shop fits. */
function initialCameraPosition(aspect: number): [number, number, number] {
  const pullBack = Math.min(1.8, Math.max(1, 1.15 / aspect));
  const [x, y, z] = CAMERA_POSITION;
  return [x * pullBack, y * pullBack, z * pullBack];
}

export function Viewer({ scene, status, selectedZone, onSelectZone }: ViewerProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<{ zoneId: string; partId: string } | null>(null);
  const [registry] = useState(() => new LabelRegistry());
  const [cameraPosition] = useState(() =>
    initialCameraPosition(window.innerWidth / window.innerHeight),
  );
  // Fog starts just beyond the shop, wherever the camera starts.
  const cameraDistance = Math.hypot(...cameraPosition);

  const placed = useMemo(() => layoutZones(scene), [scene]);
  const parts = useMemo(
    () =>
      new Map(
        scene.zones.flatMap((zone) => {
          const where = placed.get(zone.id);
          return where ? [[zone.id, placeParts(where, zone.parts.length)] as const] : [];
        }),
      ),
    [scene, placed],
  );
  const flows = useMemo(
    () =>
      scene.flows.flatMap((flow) => {
        const from = placed.get(flow.from);
        const to = placed.get(flow.to);
        return from && to
          ? [
              {
                flow,
                key: `${flow.from}->${flow.to}:${flow.label ?? ''}`,
                curve: flowCurve(from, to),
              },
            ]
          : [];
      }),
    [scene, placed],
  );

  useEffect(() => {
    document.body.style.cursor = hoveredZone ? 'pointer' : '';
    if (hoveredZone) track({ type: 'zone_hover', zoneId: hoveredZone });
  }, [hoveredZone]);

  const focus = hoveredZone ?? selectedZone;
  const isActive = (flow: { from: string; to: string }) =>
    focus !== null && (flow.from === focus || flow.to === focus);

  const labels: LabelSpec[] = [];
  for (const zone of scene.zones) {
    const where = placed.get(zone.id);
    const zoneStatus = status.zones.get(zone.id);
    if (!where || !zoneStatus) continue;
    labels.push({
      id: `zone:${zone.id}`,
      anchor: zoneLabelAnchor(where),
      className: `zone-label${selectedZone === zone.id ? ' selected' : ''}`,
      content: (
        <>
          <span className={`dot ${zoneStatus.status}`} />
          {zone.label}
          <span className="pct">{Math.round(zoneStatus.progress * 100)}%</span>
        </>
      ),
    });
  }
  for (const { flow, key, curve } of flows) {
    if (!flow.label || !isActive(flow)) continue;
    labels.push({
      id: `flow:${key}`,
      anchor: [curve.labelAt.x, curve.labelAt.y, curve.labelAt.z],
      className: 'flow-label',
      content: flow.label,
    });
  }
  if (hoveredPart) {
    const zone = scene.zones.find((z) => z.id === hoveredPart.zoneId);
    const index = zone?.parts.findIndex((p) => p.id === hoveredPart.partId) ?? -1;
    const part = zone?.parts[index];
    const placement = parts.get(hoveredPart.zoneId)?.[index];
    const partStatus = status.zones.get(hoveredPart.zoneId)?.parts.get(hoveredPart.partId);
    if (part && placement && partStatus) {
      const [x, y, z] = placement.world;
      labels.push({
        id: 'part-tip',
        anchor: [x, y + 2.6 * placement.scale, z],
        className: 'part-tip',
        content: `${part.label} · ${STATUS_LOOK[partStatus.status].label}`,
      });
    }
  }

  return (
    <div className="viewer">
      <Canvas
        shadows="percentage"
        flat
        dpr={[1, 2]}
        camera={{ position: cameraPosition, fov: 38 }}
        onPointerMissed={() => onSelectZone(null)}
      >
        <color attach="background" args={[BACKGROUND]} />
        <fog attach="fog" args={[BACKGROUND, cameraDistance * 1.2, cameraDistance * 2.4]} />
        <hemisphereLight args={['#ffffff', '#d5dcea', 1.6]} />
        <directionalLight
          position={[10, 20, 12]}
          intensity={2.1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={18}
          shadow-camera-bottom={-18}
          shadow-bias={-0.0005}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#fbfcfe" roughness={1} />
        </mesh>

        {scene.zones.map((zone) => {
          const where = placed.get(zone.id);
          const zoneStatus = status.zones.get(zone.id);
          if (!where || !zoneStatus) return null;
          return (
            <ZoneView
              key={zone.id}
              zone={zone}
              placed={where}
              parts={parts.get(zone.id) ?? []}
              status={zoneStatus}
              selected={selectedZone === zone.id}
              hovered={hoveredZone === zone.id}
              hoveredPart={hoveredPart?.zoneId === zone.id ? hoveredPart.partId : null}
              onSelect={onSelectZone}
              onHover={setHoveredZone}
              onHoverPart={(partId) =>
                setHoveredPart((current) =>
                  partId
                    ? { zoneId: zone.id, partId }
                    : current?.zoneId === zone.id
                      ? null
                      : current,
                )
              }
            />
          );
        })}

        {flows.map(({ flow, key, curve }) => (
          <FlowLine key={key} curve={curve} active={isActive(flow)} />
        ))}

        <Controls />
        <LabelProjector registry={registry} />
      </Canvas>
      <LabelOverlay registry={registry} labels={labels} />
    </div>
  );
}

function Controls() {
  const camera = useThree((state) => state.camera);
  const lastLogged = useRef('');
  return (
    <OrbitControls
      makeDefault
      enableDamping
      target={[0, 0, -0.5]}
      minDistance={10}
      maxDistance={75}
      maxPolarAngle={1.3}
      onEnd={() => {
        const position: [number, number, number] = [
          round(camera.position.x),
          round(camera.position.y),
          round(camera.position.z),
        ];
        // A plain click also ends a (zero-length) drag; only log real moves.
        if (position.join() === lastLogged.current) return;
        lastLogged.current = position.join();
        track({ type: 'camera_move', position });
      }}
    />
  );
}

const round = (n: number) => Math.round(n * 10) / 10;
