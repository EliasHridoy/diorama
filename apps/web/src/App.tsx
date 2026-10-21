import {
  deriveStatus,
  type IssueRef,
  type IssueState,
  type ValidationError,
} from '@diorama/schema';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fromJson, isSceneJson, loadFromSearch, type LoadedScene } from './data/loadScene.ts';
import { track } from './telemetry.ts';
import { DevPanel } from './ui/DevPanel.tsx';
import { Header } from './ui/Header.tsx';
import { ZonePanel } from './ui/ZonePanel.tsx';
import { Viewer } from './viewer/Viewer.tsx';

type AppState =
  | { kind: 'loading' }
  | { kind: 'error'; source: string; errors: ValidationError[] }
  | { kind: 'ready'; loaded: LoadedScene; issues: Map<IssueRef, IssueState> };

export function App() {
  const [state, setState] = useState<AppState>({ kind: 'loading' });
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [devOpen, setDevOpen] = useState(() => new URLSearchParams(location.search).has('dev'));

  const show = useCallback((result: Awaited<ReturnType<typeof loadFromSearch>>) => {
    setSelectedZone(null);
    if (!result.ok) {
      setState({ kind: 'error', source: result.source, errors: result.errors });
      return;
    }
    track({ type: 'scene_load', source: result.value.source });
    setState({ kind: 'ready', loaded: result.value, issues: result.value.issues });
  }, []);

  useEffect(() => {
    void loadFromSearch(location.search).then(show);
  }, [show]);

  const openFiles = useCallback(
    async (files: FileList | File[]) => {
      const parsed = await Promise.all(
        [...files].map(async (file) => ({
          name: file.name,
          json: JSON.parse(await file.text()) as unknown,
        })),
      ).catch((error: unknown) => {
        show({ ok: false, source: 'dropped file', errors: [{ path: '', message: String(error) }] });
        return null;
      });
      if (!parsed) return;

      const sceneFile = parsed.find((f) => isSceneJson(f.json));
      const issuesFile = parsed.find((f) => !isSceneJson(f.json));
      if (sceneFile) {
        show(fromJson(sceneFile.json, issuesFile?.json, sceneFile.name));
      } else if (issuesFile && state.kind === 'ready') {
        // Only issue states: apply them to the scene already on screen.
        show(fromJson(state.loaded.scene, issuesFile.json, state.loaded.source));
      }
    },
    [show, state],
  );

  useDropFiles(openFiles);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedZone(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const selectZone = useCallback((zoneId: string | null) => {
    setSelectedZone(zoneId);
    track({ type: 'zone_select', zoneId });
  }, []);

  const ready = state.kind === 'ready' ? state : null;
  const status = useMemo(
    () => (ready ? deriveStatus(ready.loaded.scene, ready.issues) : null),
    [ready],
  );

  if (state.kind === 'loading') return <p className="centered muted">Loading scene…</p>;
  if (state.kind === 'error')
    return <ErrorView source={state.source} errors={state.errors} onOpen={openFiles} />;
  if (!status) return null;

  const { scene, theme } = state.loaded;
  return (
    <div className="app">
      <Viewer
        scene={scene}
        theme={theme}
        status={status}
        selectedZone={selectedZone}
        onSelectZone={selectZone}
      />
      <Header scene={scene} status={status} source={state.loaded.source} />
      <div className="toolbar">
        <OpenButton onOpen={openFiles} />
        <button className="dev-toggle" aria-pressed={devOpen} onClick={() => setDevOpen((o) => !o)}>
          Dev
        </button>
      </div>
      {selectedZone && (
        <ZonePanel
          scene={scene}
          status={status}
          issues={state.issues}
          zoneId={selectedZone}
          onClose={() => selectZone(null)}
          onSelectZone={selectZone}
        />
      )}
      {devOpen && (
        <DevPanel
          scene={scene}
          issues={state.issues}
          onChange={(issues) => setState({ ...state, issues })}
          onReset={() => setState({ ...state, issues: state.loaded.issues })}
        />
      )}
    </div>
  );
}

function OpenButton({ onOpen }: { onOpen: (files: FileList) => void }) {
  return (
    <label className="button" title="Open a scene file, an issues file, or both">
      Open files…
      <input
        type="file"
        accept=".json,application/json"
        multiple
        hidden
        onChange={(e) => e.target.files && onOpen(e.target.files)}
      />
    </label>
  );
}

function ErrorView({
  source,
  errors,
  onOpen,
}: {
  source: string;
  errors: ValidationError[];
  onOpen: (files: FileList) => void;
}) {
  return (
    <div className="centered">
      <div className="card error-card">
        <h1>This scene can't be shown</h1>
        <p className="muted small">{source}</p>
        <ul>
          {errors.map((e, i) => (
            <li key={i}>
              {e.path && <code>{e.path}</code>} {e.message}
            </li>
          ))}
        </ul>
        <div className="row buttons">
          <OpenButton onOpen={onOpen} />
          <a className="button" href={location.pathname}>
            Load the example
          </a>
        </div>
      </div>
    </div>
  );
}

/** Lets people drop scene/issue JSON files anywhere on the page. */
function useDropFiles(onFiles: (files: File[]) => void) {
  useEffect(() => {
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      const files = [...(e.dataTransfer?.files ?? [])];
      if (files.length > 0) onFiles(files);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, [onFiles]);
}
