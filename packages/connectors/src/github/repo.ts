import type { RepoRef } from '../types.ts';

const PART = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

/**
 * Parses `owner/name`, `github:owner/name` or a github.com URL. Returns undefined when the
 * text isn't a repo reference, so callers can show their own message.
 */
export function parseRepoRef(text: string): RepoRef | undefined {
  const cleaned = text
    .trim()
    .replace(/^github:/, '')
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');
  const [owner, name, ...rest] = cleaned.split('/');
  if (!owner || !name || rest.length > 0) return undefined;
  if (!PART.test(owner) || !PART.test(name)) return undefined;
  return { owner, name };
}

export function formatRepoRef(repo: RepoRef): string {
  return `${repo.owner}/${repo.name}`;
}
