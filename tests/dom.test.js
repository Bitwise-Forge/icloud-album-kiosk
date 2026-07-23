import { beforeEach, describe, expect, it } from 'vitest';

import { makeLayer, makePlaceholder } from '../src/lib/dom.js';

describe('makeLayer', () => {
  let stage;
  beforeEach(() => {
    document.body.innerHTML = '<main id="stage"></main>';
    stage = document.getElementById('stage');
  });

  it('creates a div with class="layer" and dataset.layer=id, appended to stage', () => {
    const layer = makeLayer(stage, 'a');
    expect(layer.element.tagName).toBe('DIV');
    expect(layer.element.className).toBe('layer');
    expect(layer.element.dataset.layer).toBe('a');
    expect(stage.children).toHaveLength(1);
    expect(stage.firstChild).toBe(layer.element);
  });

  it('mount() replaces layer children with the given node', () => {
    const layer = makeLayer(stage, 'a');
    const img = document.createElement('img');
    layer.mount(img);
    expect(layer.element.children).toHaveLength(1);
    expect(layer.element.firstChild).toBe(img);

    const video = document.createElement('video');
    layer.mount(video);
    expect(layer.element.children).toHaveLength(1);
    expect(layer.element.firstChild).toBe(video);
  });

  it('fadeIn() adds "active" class', () => {
    const layer = makeLayer(stage, 'a');
    expect(layer.element.classList.contains('active')).toBe(false);
    layer.fadeIn();
    expect(layer.element.classList.contains('active')).toBe(true);
  });

  it('fadeOut() removes "active" class', () => {
    const layer = makeLayer(stage, 'a');
    layer.fadeIn();
    layer.fadeOut();
    expect(layer.element.classList.contains('active')).toBe(false);
  });

  it('accepts an injected document', () => {
    const doc = document;
    const layer = makeLayer(stage, 'b', { doc });
    expect(layer.element.dataset.layer).toBe('b');
  });
});

describe('makePlaceholder', () => {
  it('hide() adds "hidden" class', () => {
    document.body.innerHTML = '<div id="placeholder"></div>';
    const el = document.getElementById('placeholder');
    const placeholder = makePlaceholder(el);
    expect(el.classList.contains('hidden')).toBe(false);
    placeholder.hide();
    expect(el.classList.contains('hidden')).toBe(true);
  });

  it('show() removes "hidden" class', () => {
    document.body.innerHTML = '<div id="placeholder" class="hidden"></div>';
    const el = document.getElementById('placeholder');
    const placeholder = makePlaceholder(el);
    expect(el.classList.contains('hidden')).toBe(true);
    placeholder.show();
    expect(el.classList.contains('hidden')).toBe(false);
  });

  it('exposes the element for testing', () => {
    document.body.innerHTML = '<div id="placeholder"></div>';
    const el = document.getElementById('placeholder');
    const placeholder = makePlaceholder(el);
    expect(placeholder.element).toBe(el);
  });
});
