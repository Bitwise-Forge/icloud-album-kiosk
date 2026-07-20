# Security Policy

## Reporting a vulnerability

If you believe you've found a security issue in this project, please report it privately. **Do not open a public GitHub issue.**

**Preferred:** use [GitHub's private vulnerability reporting](https://github.com/Bitwise-Forge/icloud-album-kiosk/security/advisories/new) — this opens a private advisory that only the Bitwise Forge team can see.

**Fallback:** email `contact@bitwiseforge.com` with:

- A description of the issue and its impact
- Steps to reproduce (a minimal recipe is more valuable than a full write-up)
- The image tag or commit SHA where you observed it

We aim to acknowledge receipt within a few business days. This is a community-supported open source project without a formal SLA, but security issues get prioritized over feature work.

## What counts as a security issue

- Anything that lets an attacker cause the container to read or serve files outside `/usr/share/nginx/html/`
- Path traversal via crafted `/list/` responses or `/photos/` URLs
- Anything that lets a malicious asset (photo or video) cause code execution in the container or the Chromium client beyond what a normal browser sandbox permits
- Container escape or privilege escalation via the Docker image
- Any way to bypass the extension whitelist and get non-image / non-video content to render

Not security issues (open a regular issue instead):

- Bugs where the slideshow fails to render or crashes on well-formed input
- Requests for features that would improve security posture (like content-hash verification of downloaded assets — those come from the sibling scraper, not this project)

## Supported versions

Security fixes land on the `main` branch and the most recent tagged release. Older tags may not receive backports.

## Third-party dependencies

The production image is `nginx:alpine` plus vanilla HTML/CSS/JS. There are no JavaScript runtime dependencies. Development-time dependencies (oxlint, oxfmt, vitest, husky, lint-staged, cspell) are declared in `package.json` and never ship in the image. Vulnerabilities in nginx or the base image are the upstreams' responsibility, but if a CVE materially affects this project's ability to run safely, please report it here so we can pin a fix or ship a new image.
