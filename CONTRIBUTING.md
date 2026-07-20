# Contributing

Thanks for wanting to help. This is a small, single-purpose tool with a narrow scope: it's the display half of a two-container digital picture frame pipeline. Bug reports, small focused PRs, and documentation improvements are all welcome.

## Ways to contribute

- **File a bug report** — open an issue using the "Bug report" template. Include the image tag, host, and any relevant `docker logs` output plus Chromium DevTools console messages if you can capture them.
- **Propose a feature** — open an issue using the "Feature request" template. Check the _Scope_ section below first.
- **Send a pull request** — for bug fixes, small features, doc improvements, or compatibility patches.
- **Improve the tests** — if you find a slideshow scenario the suite doesn't cover, a test that exposes the gap is one of the highest-leverage contributions.

## Scope

This tool exists to display a folder of photos and videos as a full-screen slideshow, packaged as a Docker container for Raspberry Pi digital picture frames. In scope:

- Reliability and correctness of the slideshow loop (no memory leaks, no stalled transitions, no black frames on crossfade)
- Chromium / kiosk-mode ergonomics on Raspberry Pi hardware
- Broader photo/video format handling within the "web-safe derivatives Apple ships" reality
- Docker image improvements (size, layer structure, boot time)
- Documentation

Out of scope:

- **Framework or bundler adoption.** The production payload is vanilla HTML/CSS/JS. Development-time dependencies (oxlint, oxfmt, vitest, etc.) are declared in `package.json` and never ship in the image.
- **Admin UI, overlays, keyboard/touch input, settings panel.** The frame is an appliance; configuration is env-var-only at container start.
- **Transcoding or HEIC/HEVC fallback.** The extension whitelist (`.jpg | .jpeg | .mp4 | .m4v`) is intentional and defensive. If Apple ships a new format in shared-album derivatives, we'll extend the whitelist — we won't add a transcoder.
- **Content sourcing.** This container displays whatever is in `/photos/`. The [icloud-shared-album-sync](https://github.com/Bitwise-Forge/icloud-shared-album-sync) sibling image is one way to populate that folder, but any process that lands JPEGs or MP4s there works.

## Development setup

Install [Node](https://nodejs.org/) (version pinned in `.nvmrc`) and [pnpm](https://pnpm.io/) (pinned via `packageManager` in `package.json`), then:

```bash
git clone https://github.com/Bitwise-Forge/icloud-album-kiosk
cd icloud-album-kiosk
pnpm install
```

`pnpm install` triggers husky's install script (`prepare`), which arms the pre-commit hook that runs oxlint, oxfmt, and cspell against staged files. Skip it and your first PR will bounce off CI for issues you could have caught locally.

## Common commands

```bash
# Full quality gate (same checks pre-commit runs)
pnpm lint            # oxlint
pnpm format          # oxfmt --check
pnpm spell           # cspell

# Auto-fix
pnpm lint:fix
pnpm format:fix

# Run tests
pnpm test

# With coverage (100% gate)
pnpm test:coverage

# Seed sample photos for local dev / manual verification (gitignored)
pnpm test:seed          # 5 JPEGs from picsum.photos into tests/photos/

# Local dev harness — nginx:alpine + bind-mounted src/, config, and tests/photos/
# Open http://localhost:8080/ after tests/photos/ is populated
pnpm dev
pnpm dev:down

# Build the Docker image (host arch)
docker build -t icloud-album-kiosk:local .

# Multi-arch build (both amd64 + arm64). Requires the docker-container driver.
docker buildx create --name iak-multi --driver docker-container --bootstrap
docker buildx build --builder iak-multi \
  --platform linux/amd64,linux/arm64 \
  -t icloud-album-kiosk:multi .
docker buildx rm iak-multi
```

## Quality gate

Four checks run automatically on every commit (via husky + lint-staged) and on every push (via CI):

| Tool                          | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| [oxlint](https://oxc.rs/)     | Lint. Catches unused imports, dead code, common bug patterns. |
| [oxfmt](https://oxc.rs/)      | Format. Formatter output is authoritative.                    |
| [cspell](https://cspell.org/) | Spell check across code, docs, config.                        |
| [vitest](https://vitest.dev/) | Tests with 100% line + branch coverage gate on `src/lib/`.    |

To run them manually before pushing:

```bash
pnpm lint && pnpm format && pnpm spell && pnpm test:coverage
```

**Do not bypass with `git commit --no-verify`.** The same checks gate merges — you'll just discover the failure on GitHub instead of locally.

## Style expectations

- **Separation of concerns.** HTML, CSS, and JS live in separate files. No inline `<style>` or `<script>` blocks in `index.html`.
- **Vanilla, no framework.** The production image ships HTML/CSS/JS as-is with no build step. Dev-time TypeScript, JSX, SCSS, template DSLs, etc. are out.
- **Event listeners always paired with cleanup.** Every `addEventListener` uses an `AbortController` signal or has an explicit `removeEventListener`. Preload cycles and crossfade transitions run continuously — leaks compound.
- **Pure functions in `src/lib/` are testable in isolation.** DOM-touching modules accept their dependencies (fetch, document, timers) as parameters so tests can inject fakes.
- **Comments explain _why_, not _what_.** If a comment restates what the code does, delete it.
- **Formatter output is authoritative.** `oxfmt` decides spacing, quotes, line breaks. Don't fight it.

## Pull request expectations

- **Do one thing.** A refactor + a bug fix in the same PR is harder to review than two small PRs.
- **Add or update tests** for every behavior change. Coverage stays at 100% on `src/lib/`.
- **Update the README** for user-visible changes (new env vars, new behavior, changed defaults).
- **Verify in a real browser** if you touched the slideshow loop. `pnpm dev` + a folder of test assets is the minimum.
- **Verify the Docker build** if you changed the `Dockerfile` or entrypoint. Ideally for both `linux/amd64` and `linux/arm64` via `docker buildx`.
- **Small commits, meaningful messages.**

The PR template auto-loads when you open a pull request and walks through the above as checkboxes.

## Reporting security issues

Please don't file security issues as public GitHub issues. See [SECURITY.md](./SECURITY.md) for the private reporting channel.

## Licensing

By submitting a pull request, you agree that your contribution is licensed under the MIT License (see [LICENSE](./LICENSE)).

## Code of conduct

Participation in this project is governed by the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md).

## Questions

Not sure whether an idea is in scope, or whether a bug is worth reporting? Open a draft issue and we'll figure it out together. Better to check first than to spend hours on a PR that gets closed.

Thanks again.
