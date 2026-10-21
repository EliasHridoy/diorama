import type { BuildStatus, Scene, SceneStatus } from '@diorama/schema';
import { STATUS_LOOK } from '../viewer/statusStyle.ts';
import { ProgressBar, StatusPill } from './bits.tsx';

const ORDER: BuildStatus[] = ['done', 'in_progress', 'planned'];

export function Header({
  scene,
  status,
  source,
}: {
  scene: Scene;
  status: SceneStatus;
  source: string;
}) {
  const counts = new Map<BuildStatus, number>();
  for (const zone of status.zones.values())
    counts.set(zone.status, (counts.get(zone.status) ?? 0) + 1);

  return (
    <header className="card header">
      <div className="header-title">
        <h1>{scene.project.name}</h1>
        <span className="muted" title={source}>
          {scene.theme}
        </span>
      </div>
      <ProgressBar value={status.progress} />
      <p className="muted small">
        {Math.round(status.progress * 100)}% built ·{' '}
        {ORDER.map((s) => `${counts.get(s) ?? 0} ${STATUS_LOOK[s].label.toLowerCase()}`).join(
          ' · ',
        )}
      </p>
      <div className="legend">
        {ORDER.map((s) => (
          <StatusPill key={s} status={s} />
        ))}
      </div>
      {status.missingIssues.length > 0 && (
        <p className="warning small">
          {status.missingIssues.length} linked issue(s) not reported by the tracker:{' '}
          {status.missingIssues.join(', ')}
        </p>
      )}
    </header>
  );
}
