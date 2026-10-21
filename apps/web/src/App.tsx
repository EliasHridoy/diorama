import { SCHEMA_VERSION } from '@diorama/schema';

export function App() {
  return (
    <main>
      <h1>Diorama</h1>
      <p>Scene schema v{SCHEMA_VERSION}. The 3D viewer arrives in Phase 2.</p>
    </main>
  );
}
