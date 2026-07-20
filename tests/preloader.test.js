import { describe, expect, it, vi } from 'vitest';

import { assetUrl, preloadPhoto, preloadVideo } from '../src/lib/preloader.js';

describe('assetUrl', () => {
  it('percent-encodes the filename', () => {
    expect(assetUrl('a b.jpg')).toBe('/photos/a%20b.jpg');
    expect(assetUrl('ordinary.jpg')).toBe('/photos/ordinary.jpg');
  });
});

describe('preloadPhoto', () => {
  it('sets src, awaits decode, and returns cleanup', async () => {
    const decode = vi.fn().mockResolvedValue();
    class FakeImage {
      constructor() {
        this.src = '';
        this.decoding = '';
        this.decode = decode;
      }
    }

    const { element, cleanup } = await preloadPhoto('a.jpg', { ImageCtor: FakeImage });
    expect(element.decoding).toBe('async');
    expect(element.src).toBe('/photos/a.jpg');
    expect(decode).toHaveBeenCalledOnce();

    cleanup();
    expect(element.src).toBe('');
  });
});

describe('preloadVideo', () => {
  const fakeDocument = () => ({
    createElement: () => {
      const listeners = new Map();
      return {
        muted: false,
        playsInline: false,
        preload: '',
        poster: 'x',
        src: '',
        _listeners: listeners,
        addEventListener(type, handler, options) {
          listeners.set(type, { handler, options });
          if (options?.signal) {
            options.signal.addEventListener('abort', () => listeners.delete(type));
          }
        },
        load: vi.fn(),
        pause: vi.fn(),
        removeAttribute(attr) {
          if (attr === 'src') this.src = '';
        },
      };
    },
  });

  it('waits for loadeddata then returns cleanup', async () => {
    const doc = fakeDocument();
    const created = [];
    const orig = doc.createElement;
    doc.createElement = () => {
      const el = orig();
      created.push(el);
      return el;
    };

    const pending = preloadVideo('clip.mp4', { doc });
    const el = created[0];

    // Simulate loadeddata firing after src is set
    queueMicrotask(() => el._listeners.get('loadeddata').handler());

    const { element, cleanup } = await pending;
    expect(element.muted).toBe(true);
    expect(element.playsInline).toBe(true);
    expect(element.preload).toBe('auto');
    expect(element.poster).toBe('');
    expect(element.src).toBe('/photos/clip.mp4');
    expect(element.load).toHaveBeenCalled();

    cleanup();
    expect(element.pause).toHaveBeenCalled();
    expect(element.src).toBe('');
    expect(element.load).toHaveBeenCalledTimes(2);
  });

  it('rejects on error event', async () => {
    const doc = fakeDocument();
    const created = [];
    const orig = doc.createElement;
    doc.createElement = () => {
      const el = orig();
      created.push(el);
      return el;
    };

    const pending = preloadVideo('bad.mp4', { doc });
    const el = created[0];
    queueMicrotask(() => el._listeners.get('error').handler());

    await expect(pending).rejects.toThrow(/bad\.mp4/);
  });
});
