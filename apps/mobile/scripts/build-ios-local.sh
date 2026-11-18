#!/usr/bin/env bash
#
# Build the iOS app on this Mac and upload it to TestFlight, for when the EAS
# cloud builds for the month are used up.
#
# Usage:  ./scripts/build-ios-local.sh
#
# The Sentry auth token lives on EAS as a secret only its builders can read,
# so a local build reads it from 1Password (item "Sentry", field "token") for
# the length of the build. Without it the archive still builds but uploads no
# debug symbols, and crash reports lose their file and line numbers.
#
set -euo pipefail

# shellcheck source=scripts/asc-env.sh
source "$(dirname "$0")/asc-env.sh"
cd "$(dirname "$0")/.."

SENTRY_AUTH_TOKEN="$(op read "op://Private/Sentry/token")"
export SENTRY_AUTH_TOKEN

OUT="$(mktemp -d)"
IPA="$OUT/WedgieTracker.ipa"
eas build --platform ios --profile production --local --non-interactive --output "$IPA"

xcrun altool --validate-app -f "$IPA" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
xcrun altool --upload-app -f "$IPA" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

rm -rf "$OUT"
echo
echo "Uploaded. Apple takes 5-15 minutes to process before it appears in TestFlight."
