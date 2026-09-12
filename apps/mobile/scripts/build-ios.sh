#!/usr/bin/env bash
#
# Build the iOS app on EAS.
#
# Usage:  ./scripts/build-ios.sh [profile]     (default: production)
#
set -euo pipefail

PROFILE="${1:-production}"

# shellcheck source=scripts/asc-env.sh
source "$(dirname "$0")/asc-env.sh"

# The app is the Expo project, not the workspace root. Running eas from the
# repo root makes it scaffold a second, wrong project.
cd "$(dirname "$0")/.."

echo "Building profile '$PROFILE' for team $EXPO_APPLE_TEAM_ID using ASC key $EXPO_ASC_KEY_ID"
exec eas build --platform ios --profile "$PROFILE"
