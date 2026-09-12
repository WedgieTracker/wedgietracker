#!/usr/bin/env bash
#
# Upload a finished EAS build to App Store Connect.
#
# `eas submit` reads the same EXPO_ASC_* variables as `eas build`, but without
# them it silently falls back to an Apple ID login and dies with "iTunes
# service key is empty" - which is what happens if you call eas submit
# directly rather than through here.
#
# Usage:  ./scripts/submit-ios.sh [profile]    (default: production)
#
set -euo pipefail

PROFILE="${1:-production}"

# shellcheck source=scripts/asc-env.sh
source "$(dirname "$0")/asc-env.sh"

cd "$(dirname "$0")/.."

echo "Submitting profile '$PROFILE' for team $EXPO_APPLE_TEAM_ID using ASC key $EXPO_ASC_KEY_ID"
exec eas submit --platform ios --profile "$PROFILE"
