# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-20

Initial public release. A folder of photos and videos, shown as a
full-screen slideshow.

### Added

- Vanilla HTML/CSS/JS slideshow shell (`src/`). Native ES modules in the
  browser, no framework, no bundler, no build step. Three separated
  concerns (`index.html`, `styles.css`, `app.js`) plus a `src/lib/` of
  pure + dependency-injected modules: `shuffle` (Fisher-Yates via
  `crypto.getRandomValues`), `classify` (extension whitelist + manifest
  diff), `videoCeiling` (duration-aware safety timeout), `config`
  (defaults + normalization), `dom` (layer + placeholder factories),
  `manifestClient` (fetch `/list/` and `/config.json`), `preloader`
  (off-DOM decode with `AbortController` cleanup), `videoPlayback`
  (`ended` / `error` / `stalled` / timeout race with cleanup), `boot`
  (wires DOM + slideshow), `slideshow` (orchestrator loop).
- Two-layer crossfade with off-DOM preload — photo via
  `HTMLImageElement.decode()`, video via `loadeddata` — eliminating
  black-frame flashes at transition boundaries.
- Photo/video handling per Apple shared-album derivatives: photos
  advance on `PHOTO_DWELL_SECONDS` (default `20`); videos play to
  their natural `ended`, with a duration-aware safety ceiling
  (`min(2 × duration, 10 min)`) and immediate advance on `stalled` or
  `error`. Fisher-Yates shuffle with `crypto.getRandomValues`; no
  repeats within a cycle; reshuffles on exhaustion or manifest change.
- Extension whitelist as the security boundary:
  `.jpg | .jpeg | .mp4 | .m4v`. Anything else in the mounted folder is
  silently skipped.
- `nginx.conf` on `nginx:alpine` — `autoindex_format json` on `/list/`
  as the live manifest (no sidecar, no cron); static `/photos/` with
  aggressive caching; `/config.json` aliased from `/var/cache/kiosk/`
  so the html root stays static in dev bind mounts.
- `docker-entrypoint.d/10-write-config.sh` writes `/config.json` from
  `PHOTO_DWELL_SECONDS` and `REFRESH_INTERVAL_MINUTES` env vars at
  container start. `index.html` is never mutated.
- BF-branded boot placeholder — Bitwise Forge logo (SVG, viewBox
  tightened for symmetric visual whitespace) on a white background,
  visible for at least `bootMinimumMs` before the slideshow reveals.
  Placeholder stays up indefinitely if the mounted folder is empty or
  the manifest fetch keeps failing — only hides once assets are
  available.
- Multi-arch (`linux/amd64` + `linux/arm64`) image published to
  `ghcr.io/bitwise-forge/icloud-album-kiosk`, ~62 MB. Each release
  ships with SLSA build provenance and an SPDX SBOM attached.
- `docker-compose.dev.yml` local dev harness. Bind-mounts `src/`,
  `nginx.conf`, the entrypoint, and `tests/photos/`. `pnpm test:seed`
  hydrates `tests/photos/` with sample JPEGs from `picsum.photos`.
- Vitest suite with **100% line + branch coverage** across all of
  `src/` (90 tests). Test environment is `happy-dom` so `Image`,
  `HTMLVideoElement`, `document`, `fetch`, and
  `crypto.getRandomValues` are available without a real browser.
- Dev DX stack: pnpm 11 + Node 26 pinned via `.nvmrc` +
  `packageManager`, `oxlint` + `oxfmt` (single tool covering JS, HTML,
  CSS, Markdown, JSON, YAML, TOML — no Prettier),
  `cspell` for spell-check, `husky` + `lint-staged` for pre-commit
  hooks, `pnpm-workspace.yaml` with a 7-day `minimumReleaseAge` guard.
  VS Code settings explicitly disable ESLint + Prettier and configure
  the oxc extension as the default formatter.
- Two GitHub Actions workflows: `ci.yml` (lint + format + spell +
  vitest with 100% coverage gate + PR-only multi-arch docker build)
  and `release.yml` (quality gate → multi-arch buildx to GHCR with
  SLSA provenance + SPDX SBOM → GitHub Release with CHANGELOG
  excerpt) on `v*.*.*` tag push. Pre-release tags (`v0.1.0-rc.1`,
  `v0.0.1-test`) publish under their versioned tag only; stable tags
  also update `:latest`.
- Contribution scaffolding: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
  (Contributor Covenant v2.1), `SECURITY.md`, `AGENTS.md` (AI
  coding-agent onboarding), PR template, bug and feature-request
  issue templates, Dependabot config (grouped DX tooling PRs weekly +
  docker + github-actions ecosystems).

### Known limitations

- No admin overlay, on-screen controls, keyboard/touch input, or
  settings panel. Configuration is env-var-only at container start.
- No pan/zoom (Ken Burns), no transition variety beyond a single
  crossfade.
- No transcoding or HEIC/HEVC fallback. Non-whitelisted extensions are
  silently skipped.

[Unreleased]: https://github.com/Bitwise-Forge/icloud-album-kiosk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Bitwise-Forge/icloud-album-kiosk/releases/tag/v0.1.0
