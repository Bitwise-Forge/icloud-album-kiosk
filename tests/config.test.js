import { describe, expect, it } from 'vitest';

import { DEFAULTS, normalizeConfig } from '../src/lib/config.js';

describe('normalizeConfig', () => {
  it('returns defaults when given undefined', () => {
    expect(normalizeConfig(undefined)).toEqual(DEFAULTS);
  });

  it('returns defaults when given null', () => {
    expect(normalizeConfig(null)).toEqual(DEFAULTS);
  });

  it('returns defaults when given an empty object', () => {
    expect(normalizeConfig({})).toEqual(DEFAULTS);
  });

  it('accepts numeric string values', () => {
    const config = normalizeConfig({ photoDwellSeconds: '30' });
    expect(config.photoDwellSeconds).toBe(30);
  });

  it('falls back to default for zero', () => {
    expect(normalizeConfig({ photoDwellSeconds: 0 }).photoDwellSeconds).toBe(
      DEFAULTS.photoDwellSeconds,
    );
  });

  it('falls back to default for negative numbers', () => {
    expect(normalizeConfig({ photoDwellSeconds: -5 }).photoDwellSeconds).toBe(
      DEFAULTS.photoDwellSeconds,
    );
  });

  it('falls back to default for non-numeric strings', () => {
    expect(normalizeConfig({ photoDwellSeconds: 'abc' }).photoDwellSeconds).toBe(
      DEFAULTS.photoDwellSeconds,
    );
  });

  it('accepts overrides for every field', () => {
    const config = normalizeConfig({
      photoDwellSeconds: 30,
      refreshIntervalMinutes: 5,
      bootMinimumMs: 2000,
      crossfadeMs: 500,
    });
    expect(config).toEqual({
      photoDwellSeconds: 30,
      refreshIntervalMinutes: 5,
      bootMinimumMs: 2000,
      crossfadeMs: 500,
    });
  });
});
