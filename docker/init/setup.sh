#!/bin/sh

# function defn
graphql() {
  query=$1
  curl \
    --silent \
    --show-error \
    --insecure \
    -X POST "http://localhost:9999/graphql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\"}"
}

/app/stash --nobrowser &
# wait for stash to be up
sleep 2
graphql "query { version { version }}" >/dev/null 2>&1 || {
  echo "Waiting for Stash to start..."
  sleep 2
}

STASH_SETUP='mutation { setup( input: { configLocation: \"/config/config.yml\" databaseFile: \"\" generatedLocation: \"\" cacheLocation: \"\" blobsLocation: \"\" storeBlobsInDatabase: true stashes: { path: \"/dev/null\" excludeVideo: true excludeImage: true } })}'

graphql "$STASH_SETUP"
pkill -f stash