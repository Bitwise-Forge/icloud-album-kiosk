export const assetUrl = name => `/photos/${encodeURIComponent(name)}`;

export const preloadPhoto = async (name, { ImageCtor = Image } = {}) => {
  const img = new ImageCtor();
  img.decoding = 'async';
  img.src = assetUrl(name);
  await img.decode();
  return {
    element: img,
    cleanup: () => {
      img.src = '';
    },
  };
};

export const preloadVideo = async (name, { doc = document } = {}) => {
  const video = doc.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.poster = '';

  const controller = new AbortController();

  const ready = new Promise((resolve, reject) => {
    video.addEventListener('loadeddata', () => resolve(), {
      once: true,
      signal: controller.signal,
    });
    video.addEventListener('error', () => reject(new Error(`Failed to preload video: ${name}`)), {
      once: true,
      signal: controller.signal,
    });
  });

  video.src = assetUrl(name);
  video.load();

  try {
    await ready;
  } finally {
    controller.abort();
  }

  return {
    element: video,
    cleanup: () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    },
  };
};
