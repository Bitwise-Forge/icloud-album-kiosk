import { describe, expect, it, vi } from 'vitest';

import { defaultTimers, playToEnd } from '../src/lib/videoPlayback.js';

const makeVideo = (duration = 30) => {
  const listeners = new Map();
  return {
    duration,
    play: vi.fn().mockResolvedValue(),
    addEventListener(type, handler, options) {
      listeners.set(type, handler);
      if (options?.signal) {
        options.signal.addEventListener('abort', () => listeners.delete(type));
      }
    },
    _fire: type => {
      const handler = listeners.get(type);
      if (handler) handler();
    },
    _has: type => listeners.has(type),
  };
};

const fakeTimers = () => {
  let nextId = 1;
  const active = new Map();
  return {
    set: vi.fn((fn, ms) => {
      const id = nextId++;
      active.set(id, { fn, ms });
      return id;
    }),
    clear: vi.fn(id => active.delete(id)),
    _fire: id => {
      const entry = active.get(id);
      if (entry) entry.fn();
    },
    _active: active,
  };
};

describe('playToEnd', () => {
  it('resolves with "ended" when the video ends naturally', async () => {
    const video = makeVideo(15);
    const timers = fakeTimers();

    const { done } = playToEnd(video, { timers });
    video._fire('ended');
    await expect(done).resolves.toBe('ended');
    expect(timers.clear).toHaveBeenCalled();
    expect(video.play).toHaveBeenCalled();
  });

  it('resolves with "error" on the error event', async () => {
    const video = makeVideo(15);
    const timers = fakeTimers();
    const { done } = playToEnd(video, { timers });
    video._fire('error');
    await expect(done).resolves.toBe('error');
  });

  it('resolves with "stalled" on the stalled event', async () => {
    const video = makeVideo(15);
    const timers = fakeTimers();
    const { done } = playToEnd(video, { timers });
    video._fire('stalled');
    await expect(done).resolves.toBe('stalled');
  });

  it('resolves with "timeout" when the safety timer fires', async () => {
    const video = makeVideo(15);
    const timers = fakeTimers();
    const { done } = playToEnd(video, { timers });
    const [timerId] = timers.set.mock.results.map(r => r.value);
    timers._fire(timerId);
    await expect(done).resolves.toBe('timeout');
  });

  it('resolves with "error" if play() rejects', async () => {
    const video = makeVideo(15);
    video.play = vi.fn().mockRejectedValue(new Error('play failed'));
    const timers = fakeTimers();
    const { done } = playToEnd(video, { timers });
    await expect(done).resolves.toBe('error');
  });

  it('cleanup clears the timer and removes listeners', () => {
    const video = makeVideo(15);
    const timers = fakeTimers();
    const { cleanup } = playToEnd(video, { timers });
    expect(video._has('ended')).toBe(true);
    cleanup();
    expect(video._has('ended')).toBe(false);
    expect(timers.clear).toHaveBeenCalled();
  });

  it('cleanup called twice does not re-clear', () => {
    const video = makeVideo(15);
    const timers = fakeTimers();
    const { cleanup } = playToEnd(video, { timers });
    cleanup();
    const first = timers.clear.mock.calls.length;
    cleanup();
    expect(timers.clear.mock.calls.length).toBe(first);
  });

  it('uses default timers when none provided', () => {
    const video = makeVideo(30);
    const { done, cleanup } = playToEnd(video);
    cleanup();
    expect(done).toBeInstanceOf(Promise);
  });

  it('handles a safety-timer callback that fires after an event already resolved', async () => {
    const video = makeVideo(15);
    const timers = fakeTimers();
    const { done } = playToEnd(video, { timers });

    // Grab the raw timer callback so we can invoke it after the event has already
    // triggered finish() and nulled timerId. This exercises the `timerId !== null`
    // false branch inside finish — the defensive check against a racing timer.
    const [rawTimerCallback] = timers.set.mock.calls[0];

    video._fire('ended');
    await expect(done).resolves.toBe('ended');
    rawTimerCallback();
  });
});

describe('videoPlayback defaultTimers', () => {
  it('set schedules via real setTimeout and returns an id that clear removes', async () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const id = defaultTimers.set(fn, 100);
      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
      defaultTimers.clear(id);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clear cancels a pending timer', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const id = defaultTimers.set(fn, 100);
      defaultTimers.clear(id);
      vi.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
