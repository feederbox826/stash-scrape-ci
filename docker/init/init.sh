#!/bin/sh

# env
# shellcheck source=/dev/null
. /app/init/env.sh

# set user-agent
USER_AGENT=$(curl "https://jnrbsn.github.io/user-agents/user-agents.json" | yq '.[3]')
yq -i ".scraper_user_agent = \"$USER_AGENT\"" "$STASH_CONFIG_FILE"
# set python_path
yq -i ".python_path = \"/usr/bin/uv-py\"" "$STASH_CONFIG_FILE"
# set cdp_path
yq -i ".scraper_cdp_path = \"http://cdp:922/json/version\"" "$STASH_CONFIG_FILE"
# disable http logs
yq -i ".logaccess = false" "$STASH_CONFIG_FILE"
# set secrets
yq -i ".api_key = \"$STASH_API_KEY\"" "$STASH_CONFIG_FILE"
yq -i ".username = \"$STASH_USERNAME\"" "$STASH_CONFIG_FILE"
yq -i ".jwt_secret_key = \"$STASH_JWT_SECRET_KEY\"" "$STASH_CONFIG_FILE"
yq -i ".password = \"$STASH_PASSWORD\"" "$STASH_CONFIG_FILE"
yq -i ".scrapers_path = \"/tmp/scrapers\"" "$STASH_CONFIG_FILE"