const IMAGE_EXTS = /\.(jpe?g)$/i;
const VIDEO_EXTS = /\.(mp4|m4v)$/i;

export const classify = entry => {
  if (IMAGE_EXTS.test(entry.name)) return { ...entry, kind: 'photo' };
  if (VIDEO_EXTS.test(entry.name)) return { ...entry, kind: 'video' };
  return null;
};

export const filterManifest = entries => {
  const out = [];
  for (const entry of entries) {
    if (entry.type !== 'file') continue;
    const classified = classify(entry);
    if (classified !== null) out.push(classified);
  }
  return out;
};

export const manifestsDiffer = (a, b) => {
  if (a.length !== b.length) return true;
  const nameSet = new Set(a.map(e => e.name));
  return b.some(entry => !nameSet.has(entry.name));
};
