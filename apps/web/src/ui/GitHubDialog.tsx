import type { UnmappedIssue, UnmappedReason } from '@diorama/connectors';
import { useEffect, useState } from 'react';
import type { Connection } from '../github/connect.ts';
import type { SyncInfo } from '../github/useGitHubSync.ts';

interface GitHubDialogProps {
  connection: Connection | null;
  info: SyncInfo;
  /** Repo to suggest, e.g. from the scene's `project.repo`. */
  suggestedRepo: string;
  unmapped: UnmappedIssue[];
  labelLinked: number;
  /** Resolves to an error message, or null when connected. */
  onConnect: (repoText: string, token: string) => Promise<string | null>;
  onDisconnect: () => void;
  onSyncNow: () => void;
  onClose: () => void;
}

const REASON_TEXT: Record<UnmappedReason, string> = {
  'no-label': 'no part label',
  'zone-only': 'has a zone label but no part',
  'unknown-target': 'label names something not in the scene',
};

const TRAY_LIMIT = 50;

export function GitHubDialog(props: GitHubDialogProps) {
  const { connection, info, unmapped, labelLinked } = props;
  const [repoText, setRepoText] = useState(props.suggestedRepo);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);

  const open = unmapped.filter((u) => u.issue.state === 'open');
  const closedCount = unmapped.length - open.length;

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <section
        className="card modal"
        role="dialog"
        aria-label="GitHub"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-head">
          <h2>GitHub</h2>
          <button className="icon-button" onClick={props.onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!connection && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              void props.onConnect(repoText, token).then((message) => {
                setBusy(false);
                setError(message);
                if (!message) setToken('');
              });
            }}
          >
            <label className="field">
              Repository
              <input
                value={repoText}
                onChange={(e) => setRepoText(e.target.value)}
                placeholder="owner/name"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="field">
              Token
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="github_pat_…"
                autoComplete="off"
              />
            </label>
            <p className="muted small">
              A fine-grained personal access token with read access to <strong>Issues</strong> and{' '}
              <strong>Contents</strong> (and <strong>Pull requests</strong> to show work in
              progress). It stays in this tab's memory and is only sent to api.github.com. Reloading
              the page forgets it.
            </p>
            {error && (
              <p className="warning small" role="alert">
                {error}
              </p>
            )}
            <div className="row buttons">
              <button type="submit" disabled={busy}>
                {busy ? 'Connecting…' : 'Connect'}
              </button>
            </div>
          </form>
        )}

        {connection && (
          <>
            <div className="row">
              <strong>
                {connection.repo.owner}/{connection.repo.name}
              </strong>
              <span className="muted small">
                {info.syncing
                  ? 'Syncing…'
                  : info.lastSync
                    ? `Synced ${new Date(info.lastSync).toLocaleTimeString()}`
                    : ''}
              </span>
            </div>
            <p className="muted small">Issues refresh every minute while this tab is open.</p>
            {info.error && (
              <p className="warning small" role="alert">
                {info.error} Showing the last successful sync.
              </p>
            )}
            {info.truncated && (
              <p className="warning small">This repo has more issues than Diorama reads (5,000).</p>
            )}
            <div className="row buttons">
              <button onClick={props.onSyncNow} disabled={info.syncing}>
                Sync now
              </button>
              <button onClick={props.onDisconnect}>Disconnect</button>
            </div>

            <h3>Not placed in the scene yet</h3>
            {labelLinked > 0 && (
              <p className="muted small">
                {labelLinked} issue(s) were placed by their <code>part:zone/part</code> label.
              </p>
            )}
            {open.length === 0 && <p className="muted small">Every open issue has a place. 🎉</p>}
            <ul className="tray">
              {open.slice(0, TRAY_LIMIT).map(({ issue, reason, label }) => (
                <li key={issue.ref}>
                  <a href={issue.url} target="_blank" rel="noreferrer">
                    {issue.ref.replace('github:', '#')} {issue.title}
                  </a>
                  <span className="muted small">
                    {' '}
                    · {REASON_TEXT[reason]}
                    {label ? ` (${label})` : ''}
                  </span>
                </li>
              ))}
            </ul>
            {open.length > TRAY_LIMIT && (
              <p className="muted small">…and {open.length - TRAY_LIMIT} more.</p>
            )}
            {closedCount > 0 && (
              <p className="muted small">{closedCount} closed issue(s) not shown.</p>
            )}
            <p className="muted small">
              Label an issue <code>part:&lt;zone&gt;/&lt;part&gt;</code> (for example{' '}
              <code>part:cart/trolley</code>) to place it.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
