import { describe, expect, it } from 'vitest';

import { shuffle } from '../src/lib/shuffle.js';

describe('shuffle', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffle(input);
    expect(output).toHaveLength(input.length);
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = input.slice();
    shuffle(input);
    expect(input).toEqual(snapshot);
  });

  it('contains the same elements as the input', () => {
    const input = ['a', 'b', 'c', 'd'];
    const output = shuffle(input);
    expect(output.slice().sort()).toEqual(input.slice().sort());
  });

  it('applies a deterministic random source correctly', () => {
    // Reverses the array: j always == 0 → each swap moves position 0 to i.
    const randomSource = () => 0;
    const output = shuffle([1, 2, 3, 4], randomSource);
    expect(output).toEqual([2, 3, 4, 1]);
  });

  it('returns an empty array when input is empty', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it('uses crypto.getRandomValues by default', () => {
    const output = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(output).toHaveLength(10);
    expect(new Set(output)).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });
});
