import { describe, expect, it } from 'vitest';
import { timeAgo } from './timeAgo.ts';

describe('timeAgo', () => {
  it.each([
    [0, 'just now'],
    [4_000, 'just now'],
    [12_000, '12s ago'],
    [59_000, '59s ago'],
    [60_000, '1m ago'],
    [185_000, '3m ago'],
    [-5_000, 'just now'],
  ])('%i ms → %s', (ms, text) => expect(timeAgo(1_000_000, 1_000_000 + ms)).toBe(text));
});
