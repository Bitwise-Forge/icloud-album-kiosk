import { describe, expect, it, vi } from 'vitest';

import { createSlideshow, defaultNow, defaultTimers } from '../src/lib/slideshow.js';

const CONFIG = {
  photoDwellSeconds: 1,
  refreshIntervalMinutes: 15,
  bootMinimumMs: 100,
  crossfadeMs: 100,
};

const makeLayer = () => ({
  mount: vi.fn(),
  fadeIn: vi.fn(),
  fadeOut: vi.fn(),
});

const makePlaceholder = () => ({ hide: vi.fn() });

const makeTimers = () => {
  const intervals = new Map();
  let nextIntervalId = 1;
  return {
    sleep: vi.fn(() => new Promise(r => setTimeout(r, 0))),
    setInterval: vi.fn(fn => {
      const id = nextIntervalId++;
      intervals.set(id, fn);
      return id;
    }),
    clearInterval: vi.fn(id => intervals.delete(id)),
    _fireInterval: id => {
      const fn = intervals.get(id);
      if (fn) return fn();
    },
    _intervals: intervals,
  };
};

const manifestResponse = entries => ({ ok: true, status: 200, json: async () => entries });

// Gate: wait until N iterations happen, then trigger stop.
const makeGate = target => {
  let resolve;
  const promise = new Promise(r => {
    resolve = r;
  });
  let count = 0;
  return {
    promise,
    tick: () => {
      count++;
      if (count >= target) resolve();
    },
  };
};

// Wrap a preload impl so each successful preload ticks the gate.
const gatedPreload = (gate, impl) =>
  vi.fn(async name => {
    const result = await impl(name);
    gate.tick();
    return result;
  });

const basicPhoto = () => async name => ({ element: { tag: 'img', name }, cleanup: vi.fn() });
const basicVideo = () => async name => ({ element: { tag: 'video', name }, cleanup: vi.fn() });
const basicPlayToEnd = (resolution = 'ended') =>
  vi.fn(() => ({ done: Promise.resolve(resolution), cleanup: vi.fn() }));

// Run a slideshow through exactly N iterations, then stop and await teardown.
const runFor = async ({ slideshow, gate }) => {
  const startPromise = slideshow.start();
  await gate.promise;
  slideshow.stop();
  await startPromise;
};

describe('createSlideshow', () => {
  it('boots with a non-empty manifest, hides placeholder, and advances photos', async () => {
    const layers = [makeLayer(), makeLayer()];
    const placeholder = makePlaceholder();
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(manifestResponse([{ name: 'a.jpg', type: 'file' }]));
    const gate = makeGate(2);
    const preloadPhotoImpl = gatedPreload(gate, basicPhoto());

    const slideshow = createSlideshow({
      config: CONFIG,
      layers,
      placeholder,
      fetchImpl,
      timers,
      now: () => 0,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    await runFor({ slideshow, gate });

    expect(placeholder.hide).toHaveBeenCalled();
    expect(preloadPhotoImpl).toHaveBeenCalled();
    expect(layers[1].mount).toHaveBeenCalled();
    expect(layers[1].fadeIn).toHaveBeenCalled();
    expect(layers[0].fadeOut).toHaveBeenCalled();
    expect(timers.clearInterval).toHaveBeenCalled();
  });

  it('waits for a non-empty manifest before starting the slideshow', async () => {
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(manifestResponse([]))
      .mockResolvedValue(manifestResponse([{ name: 'a.jpg', type: 'file' }]));
    const gate = makeGate(1);
    const preloadPhotoImpl = gatedPreload(gate, basicPhoto());

    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: () => 0,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    await runFor({ slideshow, gate });

    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('handles fetch failure by treating it as an empty manifest', async () => {
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(manifestResponse([{ name: 'a.jpg', type: 'file' }]));
    const gate = makeGate(1);
    const preloadPhotoImpl = gatedPreload(gate, basicPhoto());

    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: () => 0,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    await runFor({ slideshow, gate });

    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('plays videos through playToEnd', async () => {
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(manifestResponse([{ name: 'clip.mp4', type: 'file' }]));
    const gate = makeGate(1);
    const preloadVideoImpl = gatedPreload(gate, basicVideo());
    const playToEndImpl = basicPlayToEnd('ended');

    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: () => 0,
      preloadPhotoImpl: vi.fn(basicPhoto()),
      preloadVideoImpl,
      playToEndImpl,
    });

    await runFor({ slideshow, gate });

    expect(preloadVideoImpl).toHaveBeenCalledWith('clip.mp4');
    expect(playToEndImpl).toHaveBeenCalled();
  });

  it('skips assets that fail to preload', async () => {
    const timers = makeTimers();
    const fetchImpl = vi.fn().mockResolvedValue(
      manifestResponse([
        { name: 'a.jpg', type: 'file' },
        { name: 'b.jpg', type: 'file' },
      ]),
    );
    const gate = makeGate(1);
    let call = 0;
    const preloadPhotoImpl = vi.fn(async _name => {
      call++;
      if (call === 1) throw new Error('bad');
      gate.tick();
      return { element: {}, cleanup: vi.fn() };
    });

    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: () => 0,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    await runFor({ slideshow, gate });

    expect(preloadPhotoImpl.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('waits out remaining boot minimum when manifest arrives quickly', async () => {
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(manifestResponse([{ name: 'a.jpg', type: 'file' }]));
    let calls = 0;
    const nowFn = () => {
      calls++;
      return calls === 1 ? 0 : 10;
    };
    const gate = makeGate(1);
    const preloadPhotoImpl = gatedPreload(gate, basicPhoto());

    const slideshow = createSlideshow({
      config: { ...CONFIG, bootMinimumMs: 5000 },
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: nowFn,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    await runFor({ slideshow, gate });

    // sleep called at least twice: once for boot-remaining, once for photo dwell
    expect(timers.sleep.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('skips boot minimum wait when already elapsed', async () => {
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(manifestResponse([{ name: 'a.jpg', type: 'file' }]));
    let calls = 0;
    const nowFn = () => {
      calls++;
      return calls === 1 ? 0 : 10000;
    };
    const gate = makeGate(1);
    const preloadPhotoImpl = gatedPreload(gate, basicPhoto());

    const slideshow = createSlideshow({
      config: { ...CONFIG, bootMinimumMs: 500 },
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: nowFn,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    await runFor({ slideshow, gate });

    expect(timers.sleep).toHaveBeenCalled();
  });

  it('refresh timer swaps assets when manifest content changes', async () => {
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(manifestResponse([{ name: 'a.jpg', type: 'file' }]))
      .mockResolvedValue(manifestResponse([{ name: 'z.jpg', type: 'file' }]));
    const gate = makeGate(1);
    const preloadPhotoImpl = gatedPreload(gate, basicPhoto());

    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: () => 0,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    const startPromise = slideshow.start();
    await gate.promise;
    const [intervalId] = [...timers._intervals.keys()];
    await timers._fireInterval(intervalId);
    slideshow.stop();
    await startPromise;

    expect(slideshow._state.assets.map(a => a.name)).toEqual(['z.jpg']);
  });

  it('refresh timer no-ops when manifest is unchanged', async () => {
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(manifestResponse([{ name: 'a.jpg', type: 'file' }]));
    const gate = makeGate(1);
    const preloadPhotoImpl = gatedPreload(gate, basicPhoto());

    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: () => 0,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    const startPromise = slideshow.start();
    await gate.promise;
    const before = slideshow._state.assets.map(a => a.name);
    const [intervalId] = [...timers._intervals.keys()];
    await timers._fireInterval(intervalId);
    const after = slideshow._state.assets.map(a => a.name);
    slideshow.stop();
    await startPromise;

    expect(after).toEqual(before);
  });

  it('refresh timer no-ops on empty manifest', async () => {
    const timers = makeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(manifestResponse([{ name: 'a.jpg', type: 'file' }]))
      .mockResolvedValue(manifestResponse([]));
    const gate = makeGate(1);
    const preloadPhotoImpl = gatedPreload(gate, basicPhoto());

    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl,
      timers,
      now: () => 0,
      preloadPhotoImpl,
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });

    const startPromise = slideshow.start();
    await gate.promise;
    const before = slideshow._state.assets.map(a => a.name);
    const [intervalId] = [...timers._intervals.keys()];
    await timers._fireInterval(intervalId);
    slideshow.stop();
    await startPromise;

    expect(slideshow._state.assets.map(a => a.name)).toEqual(before);
  });

  it('stop() is idempotent when no interval is registered', () => {
    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl: vi.fn(),
      timers: makeTimers(),
      preloadPhotoImpl: vi.fn(basicPhoto()),
      preloadVideoImpl: vi.fn(basicVideo()),
      playToEndImpl: basicPlayToEnd(),
    });
    slideshow.stop();
    expect(slideshow._state.running).toBe(false);
  });

  it('uses default timers when none provided', () => {
    const slideshow = createSlideshow({
      config: CONFIG,
      layers: [makeLayer(), makeLayer()],
      placeholder: makePlaceholder(),
      fetchImpl: vi.fn().mockResolvedValue(manifestResponse([])),
    });
    expect(typeof slideshow.start).toBe('function');
    expect(typeof slideshow.stop).toBe('function');
  });
});

describe('slideshow defaultTimers + defaultNow', () => {
  it('defaultNow returns a finite number from performance.now()', () => {
    const t = defaultNow();
    expect(Number.isFinite(t)).toBe(true);
  });

  it('defaultTimers.sleep resolves after the given delay', async () => {
    vi.useFakeTimers();
    try {
      const p = defaultTimers.sleep(50);
      vi.advanceTimersByTime(50);
      await expect(p).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('defaultTimers.setInterval + clearInterval schedule and cancel', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const id = defaultTimers.setInterval(fn, 100);
      vi.advanceTimersByTime(250);
      expect(fn).toHaveBeenCalledTimes(2);
      defaultTimers.clearInterval(id);
      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
