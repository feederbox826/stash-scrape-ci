# syntax=docker/dockerfile:1
FROM ghcr.io/feederbox826/stash-s6:develop AS init
COPY init/ /app/init
RUN sh /app/init/setup.sh
RUN sh /app/init/init.sh

FROM ghcr.io/feederbox826/stash-s6:develop AS final
# copy from stash
COPY --from=init /config/config.yml /config/config.yml
COPY --from=init /config/stash-go.sqlite /config/stash-go.sqlite
COPY plugins/ /config/plugins/
ENV STASH_S6_VARIANT="stash-scrape-ci"
LABEL org.opencontainers.image.source=https://github.com/feederbox826/stash-scrape-ci