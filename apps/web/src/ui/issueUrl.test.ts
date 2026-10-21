import { describe, expect, it } from 'vitest';
import { issueUrl } from './issueUrl.ts';

describe('issueUrl', () => {
  it('links GitHub issues when the repo is known', () => {
    expect(issueUrl({ name: 'S', repo: 'github:acme/shop' }, 'github:12')).toBe(
      'https://github.com/acme/shop/issues/12',
    );
  });

  it('returns nothing without a GitHub repo, for other trackers, or for odd ids', () => {
    expect(issueUrl({ name: 'S' }, 'github:12')).toBeUndefined();
    expect(issueUrl({ name: 'S', repo: 'github:acme/shop' }, 'jira:SHOP-1')).toBeUndefined();
    expect(issueUrl({ name: 'S', repo: 'github:acme/shop' }, 'github:../../evil')).toBeUndefined();
  });
});
