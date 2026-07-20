const ABSOLUTE_CAP_MS = 10 * 60 * 1000;
const MULTIPLIER = 2;

export const videoCeilingMs = durationSeconds => {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return ABSOLUTE_CAP_MS;
  return Math.min(durationSeconds * MULTIPLIER * 1000, ABSOLUTE_CAP_MS);
};
