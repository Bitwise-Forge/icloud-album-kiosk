# syntax=docker/dockerfile:1.7
FROM nginx:alpine

LABEL org.opencontainers.image.title="icloud-album-kiosk"
LABEL org.opencontainers.image.description="A folder of photos and videos, shown as a full-screen slideshow."
LABEL org.opencontainers.image.source="https://github.com/Bitwise-Forge/icloud-album-kiosk"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="Bitwise Forge"

# App source only — .dockerignore excludes node_modules, tests, DX config, .git, docs.
COPY src/ /usr/share/nginx/html/

# nginx server block
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint script that writes /config.json from env vars before nginx starts.
# The upstream nginx:alpine image auto-runs anything executable in /docker-entrypoint.d/.
COPY docker-entrypoint.d/10-write-config.sh /docker-entrypoint.d/10-write-config.sh
RUN chmod +x /docker-entrypoint.d/10-write-config.sh

# Defaults — override at container run via `-e PHOTO_DWELL_SECONDS=30`.
ENV PHOTO_DWELL_SECONDS=45
ENV REFRESH_INTERVAL_MINUTES=15

EXPOSE 80
