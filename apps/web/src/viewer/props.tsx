import { Edges } from '@react-three/drei';
import type { ReactNode } from 'react';
import { usePartLook } from './partLook.ts';

/**
 * Low-poly props built from primitives, one per theme asset. Each fits a ~1.6 × 1.6 footprint
 * centred on the origin, standing on y = 0. Placeholder art until Phase 3 brings glTF models.
 */

type V3 = [number, number, number];

function Shape({
  position,
  rotation,
  children,
}: {
  position: V3;
  rotation?: V3;
  children: ReactNode;
}) {
  const { material, edgeColor, castShadow } = usePartLook();
  return (
    <mesh
      position={position}
      rotation={rotation}
      material={material}
      castShadow={castShadow}
      receiveShadow
    >
      {children}
      {edgeColor && <Edges color={edgeColor} threshold={20} />}
    </mesh>
  );
}

const Box = ({ size, ...rest }: { size: V3; position: V3; rotation?: V3 }) => (
  <Shape {...rest}>
    <boxGeometry args={size} />
  </Shape>
);

const Cyl = ({ r, h, ...rest }: { r: number; h: number; position: V3; rotation?: V3 }) => (
  <Shape {...rest}>
    <cylinderGeometry args={[r, r, h, 12]} />
  </Shape>
);

const Ball = ({ r, ...rest }: { r: number; position: V3 }) => (
  <Shape {...rest}>
    <sphereGeometry args={[r, 14, 10]} />
  </Shape>
);

function Person({ position, turn = 0 }: { position: V3; turn?: number }) {
  return (
    <group position={position} rotation={[0, turn, 0]}>
      <Cyl r={0.2} h={0.8} position={[0, 0.4, 0]} />
      <Ball r={0.17} position={[0, 0.98, 0]} />
    </group>
  );
}

const Door = () => (
  <>
    <Box size={[0.14, 2, 0.14]} position={[-0.6, 1, 0]} />
    <Box size={[0.14, 2, 0.14]} position={[0.6, 1, 0]} />
    <Box size={[1.34, 0.16, 0.16]} position={[0, 2.06, 0]} />
    <Box size={[0.55, 1.9, 0.06]} position={[-0.27, 0.95, 0.12]} rotation={[0, -0.5, 0]} />
    <Box size={[0.55, 1.9, 0.06]} position={[0.27, 0.95, 0.12]} rotation={[0, 0.5, 0]} />
  </>
);

const SecurityDesk = () => (
  <>
    <Box size={[1.4, 0.85, 0.6]} position={[0, 0.43, 0]} />
    <Box size={[0.5, 0.35, 0.05]} position={[-0.3, 1.1, -0.1]} />
    <Person position={[0.2, 0, -0.65]} />
  </>
);

const Shelf = () => (
  <>
    <Box size={[0.08, 1.8, 0.55]} position={[-0.66, 0.9, 0]} />
    <Box size={[0.08, 1.8, 0.55]} position={[0.66, 0.9, 0]} />
    {[0.15, 0.6, 1.05, 1.5].map((y) => (
      <Box key={y} size={[1.3, 0.06, 0.55]} position={[0, y, 0]} />
    ))}
    {[0.6, 1.05].flatMap((y) =>
      [-0.4, 0, 0.4].map((x) => (
        <Box key={`${x}-${y}`} size={[0.24, 0.3, 0.3]} position={[x, y + 0.18, 0]} />
      )),
    )}
  </>
);

const AisleSign = () => (
  <>
    <Cyl r={0.05} h={2} position={[0, 1, 0]} />
    <Box size={[1.2, 0.45, 0.06]} position={[0, 2.1, 0]} />
  </>
);

const Trolley = () => (
  <>
    <Box size={[1.1, 0.55, 0.65]} position={[0, 0.75, 0]} />
    <Box size={[0.95, 0.04, 0.55]} position={[0, 0.26, 0]} />
    <Box size={[0.05, 0.45, 0.65]} position={[0.62, 1.12, 0]} rotation={[0, 0, -0.3]} />
    {[-0.4, 0.4].flatMap((x) =>
      [-0.24, 0.24].map((z) => (
        <Cyl
          key={`${x}-${z}`}
          r={0.09}
          h={0.06}
          position={[x, 0.09, z]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      )),
    )}
  </>
);

const Counter = () => (
  <>
    <Box size={[1.5, 0.9, 0.7]} position={[0, 0.45, 0]} />
    <Box size={[0.45, 0.28, 0.38]} position={[0.35, 1.04, 0]} />
    <Box size={[0.8, 0.04, 0.5]} position={[-0.3, 0.92, 0]} />
  </>
);

const CardReader = () => (
  <>
    <Box size={[0.32, 1, 0.32]} position={[0, 0.5, 0]} />
    <Box size={[0.36, 0.5, 0.08]} position={[0, 1.2, 0.04]} rotation={[-0.4, 0, 0]} />
  </>
);

const Pallet = () => (
  <>
    <Box size={[1.3, 0.12, 1.1]} position={[0, 0.06, 0]} />
    {[-0.3, 0.3].flatMap((x) =>
      [-0.26, 0.26].map((z) => (
        <Box key={`${x}-${z}`} size={[0.55, 0.48, 0.48]} position={[x, 0.36, z]} />
      )),
    )}
    <Box size={[0.55, 0.48, 0.48]} position={[-0.3, 0.84, 0]} />
  </>
);

const Mailbox = () => (
  <>
    <Cyl r={0.06} h={1} position={[0, 0.5, 0]} />
    <Box size={[0.5, 0.45, 0.75]} position={[0, 1.2, 0]} />
    <Box size={[0.04, 0.3, 0.12]} position={[0.28, 1.45, 0.2]} />
  </>
);

const SortingStation = () => (
  <>
    <Box size={[1.5, 0.8, 0.8]} position={[0, 0.4, 0]} />
    <Box size={[1.5, 0.9, 0.25]} position={[0, 1.25, -0.3]} />
    {[-0.45, 0, 0.45].map((x) => (
      <Box key={x} size={[0.3, 0.02, 0.2]} position={[x, 0.82, 0.1]} />
    ))}
  </>
);

const Letterbox = () => (
  <>
    <Box size={[0.6, 1, 0.45]} position={[0, 0.5, 0]} />
    <Box size={[0.66, 0.08, 0.5]} position={[0, 1.04, 0]} />
  </>
);

const AnalystDesk = () => (
  <>
    <Box size={[1.4, 0.75, 0.75]} position={[0, 0.38, 0]} />
    {[-0.4, -0.15, 0.2].map((x, i) => (
      <Box key={x} size={[0.3, 0.04 + i * 0.05, 0.38]} position={[x, 0.78 + i * 0.02, 0.05]} />
    ))}
    <Box size={[0.9, 0.6, 0.04]} position={[0, 1.4, -0.42]} />
    <Person position={[0, 0, 0.7]} turn={Math.PI} />
  </>
);

const Interpreter = () => (
  <>
    <Person position={[-0.6, 0, 0]} turn={Math.PI / 2} />
    <Person position={[0, 0, -0.25]} />
    <Person position={[0.6, 0, 0]} turn={-Math.PI / 2} />
  </>
);

const Crate = () => <Box size={[1, 1, 1]} position={[0, 0.5, 0]} />;

const PROPS: Readonly<Record<string, ReactNode>> = {
  door: <Door />,
  'security-desk': <SecurityDesk />,
  shelf: <Shelf />,
  'aisle-sign': <AisleSign />,
  trolley: <Trolley />,
  counter: <Counter />,
  till: <Counter />,
  'card-reader': <CardReader />,
  pallet: <Pallet />,
  mailbox: <Mailbox />,
  'sorting-station': <SortingStation />,
  letterbox: <Letterbox />,
  'analyst-desk': <AnalystDesk />,
  interpreter: <Interpreter />,
  crate: <Crate />,
};

/** Names of the assets this viewer can draw. Every theme asset must be one of them. */
// eslint-disable-next-line react-refresh/only-export-components
export const PROP_ASSETS: readonly string[] = Object.keys(PROPS);

/** Draws an asset by name; unknown names fall back to a crate rather than failing. */
export function Prop({ asset }: { asset: string }) {
  return Object.hasOwn(PROPS, asset) ? PROPS[asset] : <Crate />;
}
