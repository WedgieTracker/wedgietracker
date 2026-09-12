#!/usr/bin/env bash
#
# Build the iOS app on EAS, authenticating with the App Store Connect API key
# rather than an Apple ID.
#
# Why the key and not a login: Apple's Spaceship auth path fails intermittently
# ("iTunes service key is empty") and needs a 2FA code every time it does work.
# The key needs neither, and the same one already ships other apps from this
# machine.
#
# Usage:  ./scripts/build-ios.sh [profile]     (default: production)
#
set -euo pipefail

PROFILE="${1:-production}"
ASC_ENV="$HOME/.private_keys/asc.env"
APPLE_TEAM_ID="67PVL34QP4"
# ZOKE.GG LTD, an organization enrollment. The App Store Connect API does not
# expose the team type, so without this eas-cli asks on every single build.
APPLE_TEAM_TYPE="COMPANY_OR_ORGANIZATION"

if [ ! -r "$ASC_ENV" ]; then
  echo "error: $ASC_ENV not found." >&2
  echo "It must export ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_PATH." >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$ASC_ENV"

for var in ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH; do
  if [ -z "${!var:-}" ]; then
    echo "error: $var is not set by $ASC_ENV" >&2
    exit 1
  fi
done

if [ ! -r "$ASC_KEY_PATH" ]; then
  echo "error: cannot read the private key at $ASC_KEY_PATH" >&2
  exit 1
fi

# The names eas-cli actually reads. They are not the same as the ASC_* names
# above, which is why this maps rather than exporting the file directly.
export EXPO_ASC_API_KEY_PATH="$ASC_KEY_PATH"
export EXPO_ASC_KEY_ID="$ASC_KEY_ID"
export EXPO_ASC_ISSUER_ID="$ASC_ISSUER_ID"
export EXPO_APPLE_TEAM_ID="$APPLE_TEAM_ID"
export EXPO_APPLE_TEAM_TYPE="$APPLE_TEAM_TYPE"

# The app is the Expo project, not the workspace root. Running eas from the
# repo root makes it scaffold a second, wrong project.
cd "$(dirname "$0")/.."

echo "Building profile '$PROFILE' for team $APPLE_TEAM_ID using ASC key $ASC_KEY_ID"
exec eas build --platform ios --profile "$PROFILE"
