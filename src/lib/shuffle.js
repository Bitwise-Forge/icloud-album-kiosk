const defaultRandomSource = exclusiveUpperBound => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % exclusiveUpperBound;
};

export const shuffle = (arr, randomSource = defaultRandomSource) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomSource(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
