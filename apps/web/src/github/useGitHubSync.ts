import { fetchGitHubIssues, type NormalizedIssue } from '@diorama/connectors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError, type Connection } from './connect.ts';

/** How often the tab re-reads issues while it is visible. */
export const POLL_MS = 60_000;

export interface SyncInfo {
  syncing: boolean;
  /** When issues were last read, as a timestamp. */
  lastSync: number | null;
  error: string | null;
  truncated: boolean;
}

const IDLE: SyncInfo = { syncing: false, lastSync: null, error: null, truncated: false };

/**
 * Keeps issues in step with GitHub: once on connect, every minute while the tab is visible,
 * when the tab comes back, and on demand. A failed sync keeps the last good issues on screen.
 */
export function useGitHubSync(onIssues: (issues: NormalizedIssue[]) => void) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [info, setInfo] = useState<SyncInfo>(IDLE);
  const inFlight = useRef(false);

  const sync = useCallback(
    async (target: Connection) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setInfo((i) => ({ ...i, syncing: true }));
      try {
        const result = await fetchGitHubIssues({ repo: target.repo, token: target.token });
        onIssues(result.issues);
        setInfo({ syncing: false, lastSync: Date.now(), error: null, truncated: result.truncated });
      } catch (error) {
        setInfo((i) => ({ ...i, syncing: false, error: describeError(error) }));
      } finally {
        inFlight.current = false;
      }
    },
    [onIssues],
  );

  useEffect(() => {
    if (!connection) return;
    const poll = () => {
      if (!document.hidden) void sync(connection);
    };
    const timer = setInterval(poll, POLL_MS);
    document.addEventListener('visibilitychange', poll);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [connection, sync]);

  /** Starts syncing a connection whose first read the caller already has. */
  const attach = useCallback((target: Connection, truncated: boolean) => {
    setConnection(target);
    setInfo({ syncing: false, lastSync: Date.now(), error: null, truncated });
  }, []);

  const disconnect = useCallback(() => {
    setConnection(null);
    setInfo(IDLE);
  }, []);

  const syncNow = useCallback(() => {
    if (connection) void sync(connection);
  }, [connection, sync]);

  return { connection, info, attach, disconnect, syncNow };
}
