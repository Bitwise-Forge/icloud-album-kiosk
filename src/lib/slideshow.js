import { manifestsDiffer } from './classify.js';
import { fetchManifest } from './manifestClient.js';
import { preloadPhoto, preloadVideo } from './preloader.js';
import { shuffle } from './shuffle.js';
import { playToEnd } from './videoPlayback.js';

export const defaultTimers = {
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: id => clearInterval(id),
};

export const defaultNow = () => performance.now();

export const createSlideshow = ({
  config,
  manifestUrl = '/list/',
  layers,
  placeholder,
  fetchImpl = fetch,
  timers = defaultTimers,
  now = defaultNow,
  preloadPhotoImpl = preloadPhoto,
  preloadVideoImpl = preloadVideo,
  playToEndImpl = playToEnd,
}) => {
  const state = {
    assets: [],
    playlist: [],
    cursor: 0,
    activeLayer: 0,
    running: false,
    refreshHandle: null,
  };

  const loadManifest = async () => {
    try {
      return await fetchManifest(manifestUrl, { fetchImpl });
    } catch {
      return [];
    }
  };

  const scheduleRefresh = () => {
    state.refreshHandle = timers.setInterval(
      async () => {
        const fresh = await loadManifest();
        if (fresh.length === 0) return;
        if (!manifestsDiffer(state.assets, fresh)) return;
        state.assets = fresh;
        state.playlist = shuffle(fresh);
        state.cursor = 0;
      },
      config.refreshIntervalMinutes * 60 * 1000,
    );
  };

  const bumpCursor = () => {
    state.cursor++;
    if (state.cursor >= state.playlist.length) {
      state.playlist = shuffle(state.assets);
      state.cursor = 0;
    }
  };

  const advance = async () => {
    const next = state.playlist[state.cursor];
    const hiddenIndex = 1 - state.activeLayer;
    const hiddenLayer = layers[hiddenIndex];

    let preloaded;
    try {
      preloaded =
        next.kind === 'photo'
          ? await preloadPhotoImpl(next.name)
          : await preloadVideoImpl(next.name);
    } catch {
      bumpCursor();
      return;
    }

    hiddenLayer.mount(preloaded.element);
    layers[state.activeLayer].fadeOut();
    hiddenLayer.fadeIn();
    state.activeLayer = hiddenIndex;

    if (next.kind === 'photo') {
      await timers.sleep(config.photoDwellSeconds * 1000);
    } else {
      const { done, cleanup } = playToEndImpl(preloaded.element);
      try {
        await done;
      } finally {
        cleanup();
      }
    }

    preloaded.cleanup();
    bumpCursor();
  };

  const start = async () => {
    state.running = true;
    const bootStart = now();

    let assets = await loadManifest();
    while (assets.length === 0 && state.running) {
      await timers.sleep(config.refreshIntervalMinutes * 60 * 1000);
      assets = await loadManifest();
    }

    state.assets = assets;
    state.playlist = shuffle(assets);
    state.cursor = 0;

    const elapsed = now() - bootStart;
    const remaining = config.bootMinimumMs - elapsed;
    if (remaining > 0) await timers.sleep(remaining);

    placeholder.hide();
    scheduleRefresh();

    while (state.running) {
      await advance();
    }
  };

  const stop = () => {
    state.running = false;
    if (state.refreshHandle !== null) {
      timers.clearInterval(state.refreshHandle);
      state.refreshHandle = null;
    }
  };

  return { start, stop, _state: state };
};
