import type { IssueRef, IssueState, Scene, SceneStatus } from '@diorama/schema';
import { ProgressBar, StatusPill } from './bits.tsx';
import { issueUrl } from './issueUrl.ts';

interface ZonePanelProps {
  scene: Scene;
  status: SceneStatus;
  issues: ReadonlyMap<IssueRef, IssueState>;
  zoneId: string;
  onClose: () => void;
  onSelectZone: (zoneId: string) => void;
}

export function ZonePanel({
  scene,
  status,
  issues,
  zoneId,
  onClose,
  onSelectZone,
}: ZonePanelProps) {
  const zone = scene.zones.find((z) => z.id === zoneId);
  const zoneStatus = status.zones.get(zoneId);
  if (!zone || !zoneStatus) return null;

  const labelOf = (id: string) => scene.zones.find((z) => z.id === id)?.label ?? id;
  const flowsIn = scene.flows.filter((f) => f.to === zoneId);
  const flowsOut = scene.flows.filter((f) => f.from === zoneId);

  return (
    <aside className="card panel" aria-label={`${zone.label} details`}>
      <div className="panel-head">
        <div>
          <h2>{zone.label}</h2>
          <span className="muted small">shown as: {zone.metaphor}</span>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="row">
        <StatusPill status={zoneStatus.status} />
        <span className="muted small">{Math.round(zoneStatus.progress * 100)}% built</span>
      </div>
      <ProgressBar value={zoneStatus.progress} />
      {zone.description && <p className="small">{zone.description}</p>}

      <h3>Parts</h3>
      {zone.parts.length === 0 && <p className="muted small">No parts yet.</p>}
      <ul className="parts">
        {zone.parts.map((part) => {
          const partStatus = zoneStatus.parts.get(part.id);
          return (
            <li key={part.id}>
              <div className="row">
                <strong>{part.label}</strong>
                {partStatus && <StatusPill status={partStatus.status} />}
              </div>
              <div className="issues">
                {part.issues.length === 0 && <span className="muted small">no linked issues</span>}
                {part.issues.map((ref) => {
                  const issue = issues.get(ref);
                  const url = issueUrl(scene.project, ref);
                  const state = issue
                    ? issue.state === 'closed'
                      ? 'closed'
                      : issue.hasOpenPullRequest
                        ? 'PR open'
                        : 'open'
                    : 'unknown';
                  const text = `${ref} · ${state}`;
                  return url ? (
                    <a
                      key={ref}
                      className={`chip ${issue?.state ?? 'unknown'}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {text}
                    </a>
                  ) : (
                    <span key={ref} className={`chip ${issue?.state ?? 'unknown'}`}>
                      {text}
                    </span>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {(flowsIn.length > 0 || flowsOut.length > 0) && <h3>Data flow</h3>}
      <ul className="flows">
        {flowsIn.map((f) => (
          <li key={`in-${f.from}-${f.label ?? ''}`}>
            ←{' '}
            <button className="link" onClick={() => onSelectZone(f.from)}>
              {labelOf(f.from)}
            </button>
            {f.label && <span className="muted"> · {f.label}</span>}
          </li>
        ))}
        {flowsOut.map((f) => (
          <li key={`out-${f.to}-${f.label ?? ''}`}>
            →{' '}
            <button className="link" onClick={() => onSelectZone(f.to)}>
              {labelOf(f.to)}
            </button>
            {f.label && <span className="muted"> · {f.label}</span>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
