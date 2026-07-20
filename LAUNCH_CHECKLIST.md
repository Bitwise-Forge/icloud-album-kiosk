# Launch Checklist

Actions deferred until the repo is flipped to public. This file exists so nothing is forgotten between "the code is ready" and "the world can see it."

## Before flipping to public

- [ ] Drop the final `bitwise-forge-logo.svg` into `src/assets/` (rename the `.PLACEHOLDER` file)
- [ ] Verify the slideshow end-to-end on a real Raspberry Pi 4B against `ghcr.io/bitwise-forge/icloud-shared-album-sync`
- [ ] Publish `v0.1.0` from a private release run (release workflow works on private repos; the resulting GHCR image will be private too)
- [ ] Confirm the multi-arch image manifest inspects clean on both `linux/amd64` and `linux/arm64`
- [ ] Verify `PHOTO_DWELL_SECONDS` and `REFRESH_INTERVAL_MINUTES` env-var overrides land in `/config.json`
- [ ] `pnpm test:coverage` at 100% on `src/lib/`
- [ ] README quickstart works copy-paste against a public image (once flipped)
- [ ] BF-vault strategic README updated to "Status: Shipped"

## Flip to public

```bash
gh repo edit Bitwise-Forge/icloud-album-kiosk --visibility public
```

## After flipping to public

- [ ] Update repo description + topics: `raspberry-pi`, `digital-picture-frame`, `docker`, `kiosk`, `nginx`, `icloud`, `slideshow`
- [ ] Add repo social preview image
- [ ] Change GHCR package visibility from private to public (packages default to private inheritance)
- [ ] Enable [Private Vulnerability Reporting](https://github.com/Bitwise-Forge/icloud-album-kiosk/settings/security_analysis)
- [ ] Apply branch protection ruleset on `main`:
  - Require pull request before merging
  - Require CI status checks (`Lint, format, spell, test`) to pass
  - Allow admin bypass for solo-dev velocity
- [ ] Cross-link from sibling repo's README (add "sibling repo" reference in the `icloud-shared-album-sync` README)
- [ ] Update BF-vault strategic README's status
- [ ] Update personal-vault `digital-picture-frame/software-inventory.md` to pin the kiosk image tag
- [ ] Delete `personal-vault/projects/digital-picture-frame/handoff/` — its purpose is served
- [ ] Draft the blog article (deferred to a separate deliverable)

## Reference: what release workflow does when triggered by a git tag

1. **quality-gate** — lint, format, spell, test (100% coverage)
2. **docker-publish** — multi-arch buildx build, push to GHCR with SLSA provenance + SPDX SBOM. Pre-release tags (`v0.1.0-rc1`) publish under their versioned tag only; stable tags also update `:latest`.
3. **create-release** — GitHub Release with CHANGELOG excerpt for the version

Publish a pre-release before v0.1.0 to smoke-test the workflow:

```bash
git tag v0.0.1-test
git push origin v0.0.1-test
# Delete the tag + release + GHCR image after verifying
```
