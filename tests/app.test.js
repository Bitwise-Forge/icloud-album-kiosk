import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the boot module BEFORE app.js imports it — vitest hoists vi.mock().
vi.mock('../src/lib/boot.js', () => ({
  boot: vi.fn().mockResolvedValue(),
}));

const importFresh = async () => {
  vi.resetModules();
  await import('../src/app.js');
};

describe('app.js entry point', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="stage"></main><div id="placeholder"></div>';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('registers a DOMContentLoaded listener that calls boot()', async () => {
    const { boot } = await import('../src/lib/boot.js');
    await importFresh();

    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(boot).toHaveBeenCalledOnce();
  });
});
