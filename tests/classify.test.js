import { describe, expect, it } from 'vitest';

import { classify, filterManifest, manifestsDiffer } from '../src/lib/classify.js';

describe('classify', () => {
  it.each([
    ['photo.jpg', 'photo'],
    ['photo.JPG', 'photo'],
    ['photo.jpeg', 'photo'],
    ['photo.JPEG', 'photo'],
    ['clip.mp4', 'video'],
    ['clip.MP4', 'video'],
    ['clip.m4v', 'video'],
  ])('classifies %s as %s', (name, kind) => {
    expect(classify({ name })).toMatchObject({ name, kind });
  });

  it.each([['thing.heic'], ['thing.mov'], ['thing.png'], ['no-extension'], ['thing.txt']])(
    'returns null for unsupported %s',
    name => {
      expect(classify({ name })).toBeNull();
    },
  );

  it('preserves other entry fields', () => {
    const entry = { name: 'a.jpg', size: 1234, mtime: 'now', type: 'file' };
    expect(classify(entry)).toMatchObject({ ...entry, kind: 'photo' });
  });
});

describe('filterManifest', () => {
  it('keeps only file-type entries with supported extensions', () => {
    const entries = [
      { name: 'a.jpg', type: 'file' },
      { name: 'b.mp4', type: 'file' },
      { name: 'c.heic', type: 'file' },
      { name: 'd.txt', type: 'file' },
      { name: 'sub', type: 'directory' },
    ];
    const output = filterManifest(entries);
    expect(output.map(e => e.name)).toEqual(['a.jpg', 'b.mp4']);
  });

  it('returns an empty array for empty input', () => {
    expect(filterManifest([])).toEqual([]);
  });

  it('drops directory entries even with photo-like names', () => {
    const entries = [{ name: 'looks-like.jpg', type: 'directory' }];
    expect(filterManifest(entries)).toEqual([]);
  });
});

describe('manifestsDiffer', () => {
  it('returns false when sets are identical', () => {
    const a = [{ name: 'x.jpg' }, { name: 'y.mp4' }];
    const b = [{ name: 'y.mp4' }, { name: 'x.jpg' }];
    expect(manifestsDiffer(a, b)).toBe(false);
  });

  it('returns true when lengths differ', () => {
    const a = [{ name: 'x.jpg' }];
    const b = [{ name: 'x.jpg' }, { name: 'y.mp4' }];
    expect(manifestsDiffer(a, b)).toBe(true);
  });

  it('returns true when names differ but lengths match', () => {
    const a = [{ name: 'x.jpg' }];
    const b = [{ name: 'z.jpg' }];
    expect(manifestsDiffer(a, b)).toBe(true);
  });

  it('returns false for two empty manifests', () => {
    expect(manifestsDiffer([], [])).toBe(false);
  });
});
