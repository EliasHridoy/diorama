import { QuadraticBezierLine } from '@react-three/drei';
import type { FlowCurve } from './geometry.ts';

/** A static arc from one zone to another with an arrowhead. Animation comes in v0.2. */
export function FlowLine({ curve, active }: { curve: FlowCurve; active: boolean }) {
  const color = active ? '#1d4ed8' : '#7c8aa5';
  return (
    <group>
      <QuadraticBezierLine
        start={curve.start}
        end={curve.end}
        mid={curve.mid}
        color={color}
        lineWidth={active ? 3 : 1.6}
        dashed
        dashSize={0.35}
        gapSize={0.2}
      />
      <mesh position={curve.arrow} quaternion={curve.arrowRotation}>
        <coneGeometry args={[0.16, 0.45, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
