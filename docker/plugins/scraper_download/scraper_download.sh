#!/bin/sh

# take first argument as scraper zip address
if [ -z "$1" ]; then
  echo "No scraper URL provided."
  exit 1
fi

# only allow gist
if ! echo "$1" | grep -qE "https:\/\/gist.github\.com\/.+\/[a-f0-9]{32}\/archive\/[a-f0-9]{40}\.zip"; then
  echo "Invalid scraper URL. Only GitHub Gist URLs are allowed."
  exit 1
fi

# check that scrapers is empty
rm -r /config/scrapers/*
curl -sL "$1" | unzip -d /tmp/scrapers -