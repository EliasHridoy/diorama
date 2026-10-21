import type { IssueRef, IssueState, Scene } from '@diorama/schema';

interface DevPanelProps {
  scene: Scene;
  issues: ReadonlyMap<IssueRef, IssueState>;
  onChange: (issues: Map<IssueRef, IssueState>) => void;
  onReset: () => void;
}

/** Cycle used by the dev panel: open → open with PR → closed → open. */
function next(issue: IssueState | undefined): IssueState {
  if (!issue || (issue.state === 'open' && !issue.hasOpenPullRequest))
    return { state: 'open', hasOpenPullRequest: true };
  if (issue.state === 'open') return { state: 'closed' };
  return { state: 'open' };
}

function label(issue: IssueState | undefined): string {
  if (!issue) return 'unknown';
  if (issue.state === 'closed') return 'closed';
  return issue.hasOpenPullRequest ? 'PR open' : 'open';
}

/** Fake tracker for Phase 2: flip issue states and watch the scene rebuild. */
export function DevPanel({ scene, issues, onChange, onReset }: DevPanelProps) {
  const setAll = (state: IssueState) => {
    const all = new Map(issues);
    for (const zone of scene.zones)
      for (const part of zone.parts) for (const ref of part.issues) all.set(ref, state);
    onChange(all);
  };

  return (
    <section className="card dev" aria-label="Dev panel">
      <div className="row">
        <h2>Dev: issue states</h2>
      </div>
      <div className="row buttons">
        <button onClick={() => setAll({ state: 'open' })}>All open</button>
        <button onClick={() => setAll({ state: 'closed' })}>All closed</button>
        <button onClick={onReset}>Reset</button>
      </div>
      <div className="dev-list">
        {scene.zones.map((zone) => (
          <div key={zone.id}>
            <h3>{zone.label}</h3>
            {zone.parts.map((part) => (
              <div key={part.id} className="dev-part">
                <span className="small">{part.label}</span>
                <span className="dev-issues">
                  {part.issues.map((ref) => {
                    const issue = issues.get(ref);
                    return (
                      <button
                        key={ref}
                        className={`chip ${issue?.state ?? 'unknown'}${issue?.hasOpenPullRequest ? ' pr' : ''}`}
                        title="Click to cycle: open → PR open → closed"
                        onClick={() => onChange(new Map(issues).set(ref, next(issue)))}
                      >
                        {ref.replace(/^github:/, '#')} {label(issue)}
                      </button>
                    );
                  })}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
