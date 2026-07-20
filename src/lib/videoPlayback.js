import { videoCeilingMs } from './videoCeiling.js';

export const defaultTimers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: id => clearTimeout(id),
};

export const playToEnd = (video, { timers = defaultTimers } = {}) => {
  const ceilingMs = videoCeilingMs(video.duration);
  const controller = new AbortController();
  let timerId = null;

  const done = new Promise(resolve => {
    const finish = reason => {
      if (timerId !== null) {
        timers.clear(timerId);
        timerId = null;
      }
      controller.abort();
      resolve(reason);
    };

    video.addEventListener('ended', () => finish('ended'), {
      once: true,
      signal: controller.signal,
    });
    video.addEventListener('error', () => finish('error'), {
      once: true,
      signal: controller.signal,
    });
    video.addEventListener('stalled', () => finish('stalled'), {
      once: true,
      signal: controller.signal,
    });

    timerId = timers.set(() => finish('timeout'), ceilingMs);

    Promise.resolve(video.play()).catch(() => finish('error'));
  });

  return {
    done,
    cleanup: () => {
      if (timerId !== null) {
        timers.clear(timerId);
        timerId = null;
      }
      controller.abort();
    },
  };
};
