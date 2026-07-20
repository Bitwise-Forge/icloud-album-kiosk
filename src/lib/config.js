export const DEFAULTS = Object.freeze({
  photoDwellSeconds: 45,
  refreshIntervalMinutes: 15,
  bootMinimumMs: 5000,
  crossfadeMs: 800,
});

const positiveNumberOr = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const normalizeConfig = raw => {
  const merged = { ...DEFAULTS, ...(raw ?? {}) };
  return {
    photoDwellSeconds: positiveNumberOr(merged.photoDwellSeconds, DEFAULTS.photoDwellSeconds),
    refreshIntervalMinutes: positiveNumberOr(
      merged.refreshIntervalMinutes,
      DEFAULTS.refreshIntervalMinutes,
    ),
    bootMinimumMs: positiveNumberOr(merged.bootMinimumMs, DEFAULTS.bootMinimumMs),
    crossfadeMs: positiveNumberOr(merged.crossfadeMs, DEFAULTS.crossfadeMs),
  };
};
