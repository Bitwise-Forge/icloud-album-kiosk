import { filterManifest } from './classify.js';

export const fetchManifest = async (url, { fetchImpl = fetch } = {}) => {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Manifest fetch failed: ${response.status}`);
  const raw = await response.json();
  return filterManifest(raw);
};

export const fetchConfig = async (url, { fetchImpl = fetch } = {}) => {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Config fetch failed: ${response.status}`);
  return response.json();
};
