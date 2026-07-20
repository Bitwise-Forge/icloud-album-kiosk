import { normalizeConfig } from './config.js';
import { makeLayer, makePlaceholder } from './dom.js';
import { fetchConfig } from './manifestClient.js';
import { createSlideshow } from './slideshow.js';

const CONFIG_URL = '/config.json';

export const boot = async ({
  doc = document,
  fetchImpl = fetch,
  createSlideshowImpl = createSlideshow,
  configUrl = CONFIG_URL,
} = {}) => {
  const rawConfig = await fetchConfig(configUrl, { fetchImpl }).catch(() => ({}));
  const config = normalizeConfig(rawConfig);

  const stage = doc.getElementById('stage');
  const placeholderEl = doc.getElementById('placeholder');
  const layers = [makeLayer(stage, 'a', { doc }), makeLayer(stage, 'b', { doc })];
  const placeholder = makePlaceholder(placeholderEl);

  const slideshow = createSlideshowImpl({ config, layers, placeholder, fetchImpl });
  await slideshow.start();
  return slideshow;
};
