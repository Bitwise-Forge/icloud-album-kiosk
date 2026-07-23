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

// Short enough that the loop reacts quickly when content appears in a
// previously-empty album, without waiting for the next refresh tick.
const EMPTY_PLAYLIST_TICK_MS = 1000;

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

  // Three-state return: null on fetch/parse failure, [] for a successfully-
  // fetched empty album, or a populated array. Callers must distinguish
  // the first two — a transient error is a reason to keep waiting, an
  // empty album is a real state that must be surfaced.
  const loadManifest = async () => {
    try {
      return await fetchManifest(manifestUrl, { fetchImpl });
    } catch {
      return null;
    }
  };

  const scheduleRefresh = () => {
    state.refreshHandle = timers.setInterval(
      async () => {
        const fresh = await loadManifest();
        if (fresh === null) return;
        if (!manifestsDiffer(state.assets, fresh)) return;
        state.assets = fresh;
        state.playlist = shuffle(fresh);
        state.cursor = 0;
        if (fresh.length === 0) {
          for (const layer of layers) layer.fadeOut();
          placeholder.show();
        } else {
          placeholder.hide();
        }
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
    if (state.playlist.length === 0) {
      // The refresh interval is the only path that surfaces new content;
      // yield to it rather than spinning here.
      await timers.sleep(EMPTY_PLAYLIST_TICK_MS);
      return;
    }

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

    // A successful-but-empty response is a valid terminal answer here.
    // Only null (fetch/parse failure) is a reason to keep retrying.
    let assets = await loadManifest();
    while (assets === null && state.running) {
      await timers.sleep(config.refreshIntervalMinutes * 60 * 1000);
      assets = await loadManifest();
    }
    if (!state.running) return;

    state.assets = assets;
    state.playlist = shuffle(assets);
    state.cursor = 0;

    const elapsed = now() - bootStart;
    const remaining = config.bootMinimumMs - elapsed;
    if (remaining > 0) await timers.sleep(remaining);

    // Placeholder starts visible; scheduleRefresh hides it once content arrives.
    if (state.assets.length > 0) placeholder.hide();
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
