import type { BuildStatus, Scene, SceneStatus } from '@diorama/schema';
import { STATUS_LOOK } from '../viewer/statusStyle.ts';
import { ProgressBar, StatusPill } from './bits.tsx';

const ORDER: BuildStatus[] = ['done', 'in_progress', 'planned', 'dropped'];

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
  const shown = ORDER.filter(
    (s) =>
      s !== 'dropped' ||
      (status.zones.size > 0 && [...status.zones.values()].some((z) => z.status === 'dropped')),
  );
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
        {shown
          .map((s) => `${counts.get(s) ?? 0} ${STATUS_LOOK[s].label.toLowerCase()}`)
          .join(' · ')}
      </p>
      <div className="legend">
        {shown.map((s) => (
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
