#!/usr/bin/env bash
#
# Upload the latest finished EAS iOS build to App Store Connect.
#
# Why altool and not `eas submit`: every path through eas submit ends at an
# Apple ID login. It needs one to create the app record, and it needs one to
# register an ASC API key against the project ("Only user authentication is
# supported. Reauthenticating as user..."). On this machine that login fails
# with "iTunes service key is empty", so the key can never get used.
#
# altool takes the key directly and never touches the Developer Portal.
#
# Usage:  ./scripts/submit-ios.sh [build-id]
#         With no argument, takes the most recent finished iOS build.
#
set -euo pipefail

BUILD_ID="${1:-}"

# shellcheck source=scripts/asc-env.sh
source "$(dirname "$0")/asc-env.sh"

cd "$(dirname "$0")/.."

if [ -n "$BUILD_ID" ]; then
  LIST=$(eas build:view "$BUILD_ID" --json --non-interactive)
  BUILD_JSON="$LIST"
else
  BUILD_JSON=$(eas build:list --platform ios --status finished --limit 1 \
    --json --non-interactive | node -e \
    'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.stringify(JSON.parse(s)[0])))')
fi

read -r ID NUMBER URL <<<"$(node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const b=JSON.parse(s);
  const url=(b.artifacts||{}).applicationArchiveUrl;
  if(!url){console.error("error: that build has no application archive");process.exit(1);}
  console.log(b.id, b.appBuildVersion, url);
});' <<<"$BUILD_JSON")"

echo "Uploading build $NUMBER ($ID)"
echo "  $URL"

IPA="$(mktemp -d)/WedgieTracker.ipa"
curl -sSL -o "$IPA" "$URL"

# Validate first. It catches what Apple would reject after the upload, when the
# failure arrives as an email an hour later instead of on the terminal.
xcrun altool --validate-app -f "$IPA" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

xcrun altool --upload-app -f "$IPA" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

rm -rf "$(dirname "$IPA")"
echo
echo "Uploaded. Apple takes 5-15 minutes to process before it appears in TestFlight."
