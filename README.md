# icloud-album-kiosk

[![CI](https://github.com/Bitwise-Forge/icloud-album-kiosk/actions/workflows/ci.yml/badge.svg)](https://github.com/Bitwise-Forge/icloud-album-kiosk/actions/workflows/ci.yml)
[![Coverage: 100%](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/Bitwise-Forge/icloud-album-kiosk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

A folder of photos and videos, shown as a full-screen slideshow — a tiny Docker image on top of nginx, ready to point Chromium `--kiosk` at.

Pairs cleanly with [icloud-shared-album-sync](https://github.com/Bitwise-Forge/icloud-shared-album-sync) to build a self-contained digital picture frame backed by an iCloud Shared Album, but nothing about this image is iCloud-specific — any process that lands `.jpg` / `.mp4` files in the mounted folder works.

## Quickstart

```bash
docker run --rm \
  -v "$PWD/photos:/usr/share/nginx/html/photos:ro" \
  -p 127.0.0.1:8080:80 \
  ghcr.io/bitwise-forge/icloud-album-kiosk:latest
```

Drop JPEGs and MP4s in `./photos/`, then open `http://localhost:8080/` in a browser and watch the slideshow.

## Docker Compose (recommended: pair with the scraper)

Run the scraper and the kiosk side-by-side, sharing a folder:

```yaml
services:
  scraper:
    image: ghcr.io/bitwise-forge/icloud-shared-album-sync:latest
    environment:
      SHARED_ALBUM_URL: 'https://www.icloud.com/sharedalbum/#TOKEN'
      SYNC_INTERVAL_HOURS: '12'
      STORAGE_BUFFER_PERCENT: '15'
      AUTOPRUNE_ON_LOW_STORAGE: 'true'
    volumes:
      - ./photos:/photos
    restart: unless-stopped

  kiosk:
    image: ghcr.io/bitwise-forge/icloud-album-kiosk:latest
    environment:
      PHOTO_DWELL_SECONDS: '20'
    volumes:
      - ./photos:/usr/share/nginx/html/photos:ro
    ports:
      - '127.0.0.1:80:80'
    restart: unless-stopped
```

Then launch Chromium in kiosk mode against the running container:

```bash
chromium --kiosk http://localhost/ \
  --autoplay-policy=no-user-gesture-required \
  --noerrdialogs --disable-infobars --disable-session-crashed-bubble \
  --check-for-update-interval=31536000
```

## Environment variables

| Variable                   | Default | Description                                                                                                                            |
| -------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `PHOTO_DWELL_SECONDS`      | `20`    | Seconds each photo displays before the next transition. Videos ignore this — they always play to their natural end.                    |
| `REFRESH_INTERVAL_MINUTES` | `15`    | How often to poll `/list/` for manifest changes. When the folder content changes, the current playlist is reshuffled from the new set. |

Env vars are read at container start and written into `/config.json`, which the app fetches at boot. Restart the container to pick up new values.

## How it works

nginx serves three routes:

- `/` — the slideshow shell (`index.html`, `styles.css`, `app.js`, `assets/`)
- `/list/` — a JSON directory listing of `/photos/`, via `autoindex_format json`
- `/photos/` — the raw photo/video files

On boot, the app:

1. Displays a placeholder (Bitwise Forge logo + "Loading your photos") for at least 5 seconds.
2. Fetches `/list/` and `/config.json`.
3. Filters the listing by extension whitelist (`.jpg`, `.jpeg`, `.mp4`, `.m4v`).
4. Fisher-Yates shuffles the filtered manifest into a playlist.
5. Crossfades between two DOM layers: preload the next asset into the hidden layer, decode/`loadeddata`, then swap opacity.
6. Photos display for `PHOTO_DWELL_SECONDS`. Videos play to `ended` with a duration-aware safety timeout (2× duration, capped at 10 min) plus immediate advance on `stalled` or `error`.
7. Reshuffles when the playlist is exhausted. Re-polls `/list/` every `REFRESH_INTERVAL_MINUTES`; if the file set changes, replaces the playlist.

## Non-goals

- No admin overlay, on-screen controls, keyboard/touch input, or settings panel. Configuration is env-var-only.
- No captions, contributor names, timestamps, or metadata display.
- No pan/zoom / Ken Burns, no transition variety beyond a single crossfade.
- No framework, no build step, no bundler. The production image ships vanilla HTML/CSS/JS.
- No transcoding, no HEIC/HEVC fallback. Non-whitelisted extensions are silently skipped.

## Building the image

```bash
git clone https://github.com/Bitwise-Forge/icloud-album-kiosk
cd icloud-album-kiosk
docker build -t icloud-album-kiosk:local .
```

For multi-arch (both `linux/amd64` and `linux/arm64`), see [CONTRIBUTING.md](./CONTRIBUTING.md#common-commands).

## Development

Install [Node](https://nodejs.org/) (version pinned in `.nvmrc`) and [pnpm](https://pnpm.io/) (pinned via `packageManager` in `package.json`), then:

```bash
pnpm install
pnpm test            # vitest suite
pnpm test:coverage   # 100% coverage gate on src/
pnpm test:seed       # hydrate tests/photos/ with 5 sample JPEGs (gitignored)
pnpm dev             # local docker-compose harness at http://localhost:8080/
```

`pnpm dev` bind-mounts `tests/photos/` into the container. Hydrate it via `pnpm test:seed` for random JPEGs from [picsum.photos](https://picsum.photos), or drop your own `.jpg` / `.jpeg` / `.mp4` / `.m4v` files there. Custom counts and dimensions: `pnpm test:seed 10` or `WIDTH=4096 HEIGHT=3072 pnpm test:seed 3`.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor guide.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, expectations, and the scope guide. Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues should be reported privately per [SECURITY.md](./SECURITY.md).

Changes per release are tracked in [CHANGELOG.md](./CHANGELOG.md).

## License

MIT — see [LICENSE](./LICENSE).

## Support

This is a community-supported open source project. Issues and pull requests are welcome; there is no SLA and no obligation to fix. If you find a bug, open an issue with your image tag, host, and any relevant `docker logs` output plus Chromium DevTools console messages if you can capture them.

Built and maintained by [Bitwise Forge](https://bitwiseforge.com).

---

<sub>iCloud and Apple are trademarks of Apple Inc., registered in the U.S. and other countries. This project is not affiliated with, endorsed by, or sponsored by Apple Inc.</sub>
