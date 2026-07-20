#!/usr/bin/env bash
# Seed tests/photos/ with a handful of sample JPEGs from picsum.photos so
# `pnpm dev` and manual smoke tests have real assets to render. Gitignored —
# each developer hydrates locally after clone.
set -euo pipefail

cd "$(dirname "$0")/.."
target="tests/photos"
mkdir -p "$target"

count=${1:-5}
width=${WIDTH:-2048}
height=${HEIGHT:-1536}

echo "Seeding ${count} sample JPEGs into ${target}/ (${width}x${height})"

for i in $(seq 1 "$count"); do
  url="https://picsum.photos/${width}/${height}?random=${i}"
  out="${target}/sample-${i}.jpg"
  curl -sSL --fail --max-time 30 -o "$out" "$url"
  printf '  %s (%s bytes)\n' "$out" "$(wc -c <"$out" | tr -d ' ')"
done

echo "Done. To include a video, drop an .mp4 or .m4v file into ${target}/ manually."
