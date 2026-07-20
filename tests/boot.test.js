import { beforeEach, describe, expect, it, vi } from 'vitest';

import { boot } from '../src/lib/boot.js';

const configResponse = body => ({ ok: true, status: 200, json: async () => body });
const errResponse = status => ({ ok: false, status, json: async () => ({}) });

const setupDom = () => {
  document.body.innerHTML =
    '<main id="stage"></main><div id="placeholder"><img alt="" /><p>Loading</p></div>';
};

const stubSlideshow = () => {
  const start = vi.fn().mockResolvedValue();
  const stop = vi.fn();
  const factory = vi.fn(() => ({ start, stop, _state: {} }));
  return { factory, start, stop };
};

describe('boot', () => {
  beforeEach(() => {
    setupDom();
  });

  it('fetches config, builds layers + placeholder, and starts the slideshow', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(configResponse({ photoDwellSeconds: 30 }));
    const { factory, start } = stubSlideshow();

    const slideshow = await boot({ fetchImpl, createSlideshowImpl: factory });

    expect(fetchImpl).toHaveBeenCalledWith('/config.json');
    expect(factory).toHaveBeenCalledOnce();

    const args = factory.mock.calls[0][0];
    expect(args.config.photoDwellSeconds).toBe(30);
    expect(args.layers).toHaveLength(2);
    expect(args.layers[0].element.dataset.layer).toBe('a');
    expect(args.layers[1].element.dataset.layer).toBe('b');
    expect(args.placeholder.element.id).toBe('placeholder');
    expect(start).toHaveBeenCalledOnce();
    expect(slideshow).toEqual(expect.objectContaining({ start, stop: expect.any(Function) }));
  });

  it('falls back to defaults when config fetch fails', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(errResponse(404));
    const { factory } = stubSlideshow();

    await boot({ fetchImpl, createSlideshowImpl: factory });

    const args = factory.mock.calls[0][0];
    expect(args.config.photoDwellSeconds).toBe(45);
    expect(args.config.refreshIntervalMinutes).toBe(15);
  });

  it('falls back to defaults when fetch itself rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'));
    const { factory } = stubSlideshow();

    await boot({ fetchImpl, createSlideshowImpl: factory });

    const args = factory.mock.calls[0][0];
    expect(args.config.photoDwellSeconds).toBe(45);
  });

  it('appends both layers to the stage element', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(configResponse({}));
    const { factory } = stubSlideshow();

    await boot({ fetchImpl, createSlideshowImpl: factory });

    const stage = document.getElementById('stage');
    expect(stage.children).toHaveLength(2);
  });

  it('uses the injected configUrl', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(configResponse({}));
    const { factory } = stubSlideshow();

    await boot({ fetchImpl, createSlideshowImpl: factory, configUrl: '/alt-config.json' });

    expect(fetchImpl).toHaveBeenCalledWith('/alt-config.json');
  });
});
