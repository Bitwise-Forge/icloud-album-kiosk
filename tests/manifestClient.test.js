import { describe, expect, it, vi } from 'vitest';

import { fetchConfig, fetchManifest } from '../src/lib/manifestClient.js';

const ok = body => ({ ok: true, status: 200, json: async () => body });
const err = status => ({ ok: false, status, json: async () => ({}) });

describe('fetchManifest', () => {
  it('fetches, parses, and filters', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok([
        { name: 'a.jpg', type: 'file' },
        { name: 'b.heic', type: 'file' },
        { name: 'c.mp4', type: 'file' },
      ]),
    );
    const result = await fetchManifest('/list/', { fetchImpl });
    expect(result.map(e => e.name)).toEqual(['a.jpg', 'c.mp4']);
    expect(fetchImpl).toHaveBeenCalledWith('/list/');
  });

  it('throws on non-ok responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(err(500));
    await expect(fetchManifest('/list/', { fetchImpl })).rejects.toThrow(/500/);
  });

  it('uses the global fetch when no impl provided', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok([]));
    try {
      const result = await fetchManifest('/list/');
      expect(result).toEqual([]);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('fetchConfig', () => {
  it('returns parsed JSON on success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({ photoDwellSeconds: 30 }));
    const result = await fetchConfig('/config.json', { fetchImpl });
    expect(result).toEqual({ photoDwellSeconds: 30 });
  });

  it('throws on non-ok responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(err(404));
    await expect(fetchConfig('/config.json', { fetchImpl })).rejects.toThrow(/404/);
  });

  it('uses the global fetch when no impl provided', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ a: 1 }));
    try {
      const result = await fetchConfig('/config.json');
      expect(result).toEqual({ a: 1 });
    } finally {
      spy.mockRestore();
    }
  });
});
