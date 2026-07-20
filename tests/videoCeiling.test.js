import { describe, expect, it } from 'vitest';

import { videoCeilingMs } from '../src/lib/videoCeiling.js';

const TEN_MIN_MS = 10 * 60 * 1000;

describe('videoCeilingMs', () => {
  it('returns 2x duration for well-formed short clips', () => {
    expect(videoCeilingMs(15)).toBe(30000);
    expect(videoCeilingMs(60)).toBe(120000);
  });

  it('caps at 10 minutes for long clips', () => {
    expect(videoCeilingMs(400)).toBe(TEN_MIN_MS);
    expect(videoCeilingMs(600)).toBe(TEN_MIN_MS);
  });

  it.each([[NaN], [Infinity], [0], [-5]])('falls back to 10 minutes for invalid %s', duration => {
    expect(videoCeilingMs(duration)).toBe(TEN_MIN_MS);
  });
});
