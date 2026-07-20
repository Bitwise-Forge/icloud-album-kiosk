# AGENTS.md

Instructions for AI coding agents working in this repository. This is a quick-reference; [CONTRIBUTING.md](./CONTRIBUTING.md) is authoritative on process.

## What this project is

A minimal HTML/CSS/JS slideshow packaged as a Docker container image for Raspberry Pi digital picture frames. Consumes photos and videos from a mounted folder (populated by [icloud-shared-album-sync](https://github.com/Bitwise-Forge/icloud-shared-album-sync) or any equivalent process) and displays them full-screen via nginx + Chromium in `--kiosk` mode. Multi-arch image (`linux/amd64` + `linux/arm64`) targeting `ghcr.io/bitwise-forge/icloud-album-kiosk`. Owned by [Bitwise Forge](https://bitwiseforge.com), MIT-licensed.

## Repository layout

```
├── src/                            # App source — the only runtime payload
│   ├── index.html                  # Kiosk shell (loads app.js + styles.css)
│   ├── app.js                      # Thin bootstrap — wires DOM to createSlideshow()
│   ├── styles.css                  # All visuals
│   ├── lib/                        # Pure + testable modules
│   │   ├── boot.js                 # Fetches config, builds layers/placeholder, starts slideshow
│   │   ├── classify.js             # Extension whitelist + manifest diff
│   │   ├── config.js               # Config defaults + normalization
│   │   ├── dom.js                  # makeLayer + makePlaceholder factories
│   │   ├── manifestClient.js       # fetch /list/ and /config.json
│   │   ├── preloader.js            # Off-DOM image / video preload w/ cleanup
│   │   ├── shuffle.js              # Fisher-Yates with injectable RNG
│   │   ├── slideshow.js            # Orchestrator loop (deps injected)
│   │   ├── videoCeiling.js         # Duration → safety-timeout calculator
│   │   └── videoPlayback.js        # Play-to-end w/ ended/error/stalled/timeout
│   └── assets/                     # Boot placeholder logo (SVG)
├── tests/                          # vitest suite. 100% line + branch coverage on src/
│   └── photos/                     # local fixture folder — hydrate via `pnpm test:seed` (gitignored)
├── scripts/
│   └── seed-test-photos.sh         # curls sample JPEGs into tests/photos/
├── nginx.conf                      # Server block: autoindex JSON on /list/, static /photos/
├── docker-entrypoint.d/
│   └── 10-write-config.sh          # Writes /config.json from env vars before nginx starts
├── Dockerfile                      # nginx:alpine + COPY src/ only
├── docker-compose.dev.yml          # Local dev harness with bind mounts
├── .oxlintrc.json                  # oxlint config
├── .oxfmtrc.json                   # oxfmt config
├── cspell.json                     # Spell check config
├── vitest.config.js                # 100% coverage gate on src/lib/**
├── package.json                    # Node + pnpm pinned via .nvmrc + packageManager; DX deps only
├── .husky/                         # Git hooks (pre-commit → lint-staged)
├── .github/
│   ├── workflows/                  # ci.yml + release.yml
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── README.md                       # User-facing
├── CONTRIBUTING.md                 # Contributor process. Authoritative.
├── CODE_OF_CONDUCT.md              # Contributor Covenant 2.1
├── SECURITY.md
├── CHANGELOG.md                    # Keep a Changelog
└── LICENSE                         # MIT
```

## Hard rules — do not break these

1. **No production runtime dependencies.** The image ships vanilla HTML/CSS/JS on top of `nginx:alpine`. Dev-time deps in `package.json` never enter the image (the `.dockerignore` allowlist enforces this). Adding a build step, bundler, or framework is a design change — discuss it before implementing.
2. **Test coverage stays at 100%** across `src/` — line and branch, measured by `pnpm test:coverage`. Every file, including `src/app.js`, is covered. DOM interaction is tested with vitest + happy-dom.
3. **`pnpm lint`, `pnpm format`, `pnpm spell`, `pnpm test:coverage` all pass.** These are enforced by husky/lint-staged locally and by CI. Do not bypass with `git commit --no-verify`.
4. **Separation of concerns.** HTML, CSS, and JS live in `src/index.html`, `src/styles.css`, and `src/app.js` (plus `src/lib/`). No inline styles, no inline scripts.
5. **Event listeners always paired with cleanup.** Every `addEventListener` uses an `AbortController` signal or has an explicit paired remove. The slideshow loop runs indefinitely on constrained hardware — a leaked listener per transition compounds.
6. **Do not commit `photos/`, real album URLs, or the final BF logo asset if it hasn't been provided yet.** `.gitignore` covers `photos/`.
7. **The extension whitelist is load-bearing.** `IMAGE_EXTS` and `VIDEO_EXTS` in `src/lib/classify.js` are the security boundary — anything else is silently skipped. Widening the whitelist is a design change.

## Ask before doing

- Adding a build step, bundler, or framework
- Adding a runtime dependency to the shipped image
- Changing the nginx config in a way that alters what URLs are served or what caching rules apply
- Changing the extension whitelist or the JSON shape returned by `/list/`
- Changing lint / format / spell / test-runner tooling
- Changing the license, the scope statement, or the copyright holder
- Breaking backward compatibility of env vars (`PHOTO_DWELL_SECONDS`, `REFRESH_INTERVAL_MINUTES`)

## Safe to do without asking

- Add tests for uncovered branches (coverage stays at 100%)
- Fix typos or clarify wording in any Markdown file
- Update the CHANGELOG's `[Unreleased]` section as you make behavior changes
- Bump pinned dev deps via Dependabot's grouped PRs
- Improve log messages
- Refactor within a single function to improve readability without changing behavior

## Development setup

Install [Node](https://nodejs.org/) at the version pinned in `.nvmrc` and [pnpm](https://pnpm.io/) at the version pinned via `packageManager` in `package.json`.

```bash
pnpm install       # installs dev deps, arms the husky pre-commit hook
pnpm test          # run tests
pnpm dev           # local docker-compose harness at http://localhost:8080/
```

`pnpm dev` bind-mounts `src/`, `nginx.conf`, and `tests/photos/` into a stock `nginx:alpine` container. Edits to source files are visible on refresh — no rebuild required. Hydrate `tests/photos/` via `pnpm test:seed` (5 sample JPEGs from picsum.photos, gitignored), or drop your own `.jpg` / `.mp4` files in there.

## Common commands

```bash
# Quality gate (same checks pre-commit + CI run)
pnpm lint
pnpm format
pnpm spell
pnpm test:coverage

# Auto-fix
pnpm lint:fix
pnpm format:fix

# Docker (host arch)
docker build -t icloud-album-kiosk:local .

# Docker (multi-arch — needs the docker-container driver)
docker buildx create --name iak-multi --driver docker-container --bootstrap
docker buildx build --builder iak-multi \
  --platform linux/amd64,linux/arm64 \
  -t icloud-album-kiosk:multi .
docker buildx rm iak-multi
```

## Runtime env vars

| Var                        | Default | Purpose                                                                                                |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `PHOTO_DWELL_SECONDS`      | `20`    | Seconds each photo is displayed before advancing. Videos ignore this — they play to their natural end. |
| `REFRESH_INTERVAL_MINUTES` | `15`    | How often to poll `/list/` for manifest changes.                                                       |

Env vars are read at container start by `docker-entrypoint.d/10-write-config.sh` and written into `/config.json`, which the app fetches at boot alongside `/list/`.

## Coding conventions

- **Formatter output is authoritative.** `oxfmt` decides quote style, line breaks, spacing. Do not fight it.
- **Comments explain _why_, not _what_.** Delete comments that restate code. Keep comments that record an invariant, a workaround, or a non-obvious constraint.
- **Type hints are not part of this project.** No TypeScript. If a variable's shape isn't obvious from the code, refactor for clarity.
- **Pure functions in `src/lib/` take dependencies as parameters.** The orchestrator (`slideshow.js`) accepts `fetchImpl`, `timers`, `preloadPhotoImpl`, `preloadVideoImpl`, `playToEndImpl`, `now`, `layers`, `placeholder` — all injected. Tests mock them; production wires them at boot in `src/app.js`.

## Testing conventions

- Suite is split per-module (`tests/shuffle.test.js`, `tests/classify.test.js`, etc.). A test belongs in the file that matches the module it exercises.
- Vitest environment is `happy-dom`. Browser globals (`Image`, `HTMLVideoElement`, `document`, `fetch`, `crypto.getRandomValues`) are available.
- Use `vi.fn()` for mocks, `vi.spyOn()` for spying on real globals. Prefer dependency injection over module mocking.
- Never hit the network. `fetchImpl` is always injected.
- Coverage is measured against `src/**` at a 100% line + branch gate. `src/app.js` is a thin `DOMContentLoaded` → `boot()` entry and is tested via `vi.mock('../src/lib/boot.js', …)` + a synthetic `DOMContentLoaded` event.

## Docker specifics

- **Base image:** `nginx:alpine`. Stock, no build variant swap needed.
- **The image contains `src/`, `nginx.conf`, and the entrypoint script — nothing else.** No `node_modules`, no tests, no DX config, no `.git`. Enforced by `.dockerignore` allowlist.
- **Entrypoint mechanism:** the upstream `nginx:alpine` image runs anything executable in `/docker-entrypoint.d/` before starting nginx. `10-write-config.sh` writes `/config.json` from `PHOTO_DWELL_SECONDS` and `REFRESH_INTERVAL_MINUTES`.
- Multi-arch builds require the `docker-container` driver; the default `docker` driver is single-arch only.

## Scope guardrails

**In scope:** reliability of the slideshow loop, Chromium/kiosk ergonomics on Pi hardware, broader photo/video format handling within Apple's shared-album derivatives, Docker image improvements, docs.

**Out of scope:**

- Frameworks, bundlers, build steps
- Runtime JavaScript dependencies in the shipped image
- Admin UIs, overlays, on-screen controls, keyboard/touch input, settings panels
- Transcoding, HEIC/HEVC fallback
- Content sourcing (that's the sibling scraper's job)

If a task is ambiguously in or out of scope, open a draft issue and ask before writing code.

## Cross-references

- **User-facing docs:** [README.md](./README.md)
- **Contributor process:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Change log:** [CHANGELOG.md](./CHANGELOG.md)
- **Security reporting:** [SECURITY.md](./SECURITY.md)
- **Community expectations:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

If `AGENTS.md` conflicts with any linked doc above, the linked doc wins.
