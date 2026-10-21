import { useEffect, useState } from 'react';
import type { Connection } from '../github/connect.ts';
import type { SyncInfo } from '../github/useGitHubSync.ts';
import { timeAgo } from './timeAgo.ts';

interface GitHubStatusProps {
  connection: Connection | null;
  info: SyncInfo;
  unmappedOpen: number;
  onOpen: () => void;
}

/** Toolbar button: opens the GitHub dialog and, once connected, shows sync state. */
export function GitHubStatus({ connection, info, unmappedOpen, onOpen }: GitHubStatusProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  if (!connection) return <button onClick={onOpen}>Connect GitHub</button>;
  const state = info.error ? 'error' : info.syncing ? 'syncing' : 'ok';
  return (
    <button onClick={onOpen} className="github-chip" title="GitHub sync">
      <span className={`sync-dot ${state}`} />
      {connection.repo.owner}/{connection.repo.name}
      <span className="muted">
        {info.syncing ? ' · syncing…' : info.lastSync ? ` · ${timeAgo(info.lastSync, now)}` : ''}
      </span>
      {unmappedOpen > 0 && <span className="badge">{unmappedOpen} unplaced</span>}
    </button>
  );
}
