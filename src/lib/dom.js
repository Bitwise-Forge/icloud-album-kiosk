export const makeLayer = (stage, id, { doc = document } = {}) => {
  const el = doc.createElement('div');
  el.className = 'layer';
  el.dataset.layer = id;
  stage.appendChild(el);
  return {
    element: el,
    mount: child => el.replaceChildren(child),
    fadeIn: () => el.classList.add('active'),
    fadeOut: () => el.classList.remove('active'),
  };
};

export const makePlaceholder = el => ({
  element: el,
  hide: () => el.classList.add('hidden'),
  show: () => el.classList.remove('hidden'),
});
