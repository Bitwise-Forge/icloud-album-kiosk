# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Initial scaffold — nothing shipped yet.

### Added

- Repo scaffolding with the JS DX stack: pnpm 10.33.0, Node 25.9.0, oxlint,
  oxfmt, cspell, husky, lint-staged, vitest with 100% coverage gate.
- Vanilla HTML/CSS/JS slideshow shell (`src/`), factored so pure functions
  (`shuffle`, `classify`, `videoCeiling`, `config`) and the orchestrator
  (`slideshow`) are testable via vitest + happy-dom.
- `Dockerfile` on `nginx:alpine` copying `src/` only. `docker-entrypoint.d/`
  script writes `/config.json` from `PHOTO_DWELL_SECONDS` and
  `REFRESH_INTERVAL_MINUTES` env vars at container start.
- `nginx.conf` with `autoindex_format json` on `/list/`, aggressive caching
  on `/photos/`, and no-cache on `/config.json`.
- `docker-compose.dev.yml` for local iteration with bind mounts and a photos
  folder.
- Two GitHub Actions workflows: `ci.yml` (lint + format + spell + coverage +
  PR-only multi-arch docker build) and `release.yml` (tag-triggered multi-arch
  buildx to GHCR with SLSA provenance and SPDX SBOM, plus a GitHub Release
  with CHANGELOG excerpt).
- Contribution documentation: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
  (Contributor Covenant v2.1), `SECURITY.md`, `AGENTS.md`, PR template, bug and
  feature-request issue templates, Dependabot config.

[Unreleased]: https://github.com/Bitwise-Forge/icloud-album-kiosk/compare/main...HEAD
