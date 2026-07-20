<!--
Short template — no forms, just enough to help the review.
-->

## What

<!-- One or two sentences. -->

## Why

<!-- Link the issue or motivate the change. -->

## Testing

- [ ] `pnpm test:coverage` passes locally
- [ ] Coverage remains at 100%
- [ ] `pnpm lint` and `pnpm format` pass
- [ ] Docker build succeeds (`docker build .`) if you changed anything in `src/`, `nginx.conf`, `Dockerfile`, or `docker-entrypoint.d/`
- [ ] Verified in a real browser (e.g. via `pnpm dev`) if you changed slideshow behavior

## Checklist

- [ ] This PR does one thing
- [ ] No new runtime dependencies (the production image is vanilla HTML/CSS/JS + nginx — see AGENTS.md)
- [ ] Tests added or updated for the change
- [ ] README updated if user-visible behavior changed
- [ ] CHANGELOG's `[Unreleased]` section updated
- [ ] Event listeners paired with cleanup (no leaks on preload / crossfade cycles)

## Anything reviewers should watch for

<!-- Optional. Call out subtle risks, breaking changes, or things you're unsure about. -->
