#!/usr/bin/env bash
#
# Wire up App Store Connect API key authentication, for sourcing by the build
# and submit scripts.
#
# Why the key and not an Apple ID login: Apple's Spaceship auth path fails with
# "iTunes service key is empty" and needs a 2FA code when it does work. The key
# needs neither, and the same one already ships other apps from this machine.
#
# Sourced, not executed, so it sets no -e of its own and returns instead of
# exiting on failure.
#
ASC_ENV="$HOME/.private_keys/asc.env"
APPLE_TEAM_ID="67PVL34QP4"
# ZOKE.GG LTD, an organization enrollment. The App Store Connect API does not
# expose the team type, so without this eas-cli asks on every single run.
APPLE_TEAM_TYPE="COMPANY_OR_ORGANIZATION"

if [ ! -r "$ASC_ENV" ]; then
  echo "error: $ASC_ENV not found." >&2
  echo "It must export ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_PATH." >&2
  return 1
fi

# shellcheck source=/dev/null
source "$ASC_ENV"

for var in ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH; do
  if [ -z "${!var:-}" ]; then
    echo "error: $var is not set by $ASC_ENV" >&2
    return 1
  fi
done

if [ ! -r "$ASC_KEY_PATH" ]; then
  echo "error: cannot read the private key at $ASC_KEY_PATH" >&2
  return 1
fi

# The names eas-cli actually reads, for `eas build`. They are not the same as
# the ASC_* names above, which is why this maps rather than exporting the file
# directly. `eas submit` ignores them and wants an Apple ID login instead,
# which is why submit-ios.sh uses altool and reads ASC_* straight from here.
export EXPO_ASC_API_KEY_PATH="$ASC_KEY_PATH"
export EXPO_ASC_KEY_ID="$ASC_KEY_ID"
export EXPO_ASC_ISSUER_ID="$ASC_ISSUER_ID"
export EXPO_APPLE_TEAM_ID="$APPLE_TEAM_ID"
export EXPO_APPLE_TEAM_TYPE="$APPLE_TEAM_TYPE"
