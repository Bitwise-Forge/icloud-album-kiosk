#!/bin/sh
# Emit /config.json from env vars before nginx starts.
# The app fetches this at boot alongside /list/.
set -eu

: "${PHOTO_DWELL_SECONDS:=45}"
: "${REFRESH_INTERVAL_MINUTES:=15}"

mkdir -p /var/cache/kiosk
cat >/var/cache/kiosk/config.json <<EOF
{
  "photoDwellSeconds": ${PHOTO_DWELL_SECONDS},
  "refreshIntervalMinutes": ${REFRESH_INTERVAL_MINUTES}
}
EOF

echo "kiosk: wrote /config.json (photoDwellSeconds=${PHOTO_DWELL_SECONDS}, refreshIntervalMinutes=${REFRESH_INTERVAL_MINUTES})"
