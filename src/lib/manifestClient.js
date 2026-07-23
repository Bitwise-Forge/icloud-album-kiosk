import { filterManifest } from './classify.js';

// `cache: 'no-store'` — without it, Chromium may satisfy either fetch
// from disk cache, leaving the slideshow cycling through a stale manifest
// long after the source album has changed.
export const fetchManifest = async (url, { fetchImpl = fetch } = {}) => {
  const response = await fetchImpl(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Manifest fetch failed: ${response.status}`);
  const raw = await response.json();
  return filterManifest(raw);
};

export const fetchConfig = async (url, { fetchImpl = fetch } = {}) => {
  const response = await fetchImpl(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Config fetch failed: ${response.status}`);
  return response.json();
};
