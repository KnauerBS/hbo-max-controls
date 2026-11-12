#!/bin/zsh
# Clean local installer/updater for HBO Max Controls (Safari).
# Usage: ./install.sh
set -euo pipefail

cd "${0:A:h}"
APP_NAME="HBO Max Controls"
APP_DEST="/Applications/$APP_NAME.app"
BUILD_DIR="$(mktemp -d /tmp/hbo-build.XXXXXX)"
trap 'rm -rf "$BUILD_DIR"' EXIT

echo "▶︎ Quit old app and remove registration …"
pkill -x "$APP_NAME" 2>/dev/null || true
if [[ -d "$APP_DEST" ]]; then
  pluginkit -r "$APP_DEST/Contents/PlugIns/$APP_NAME Extension.appex" 2>/dev/null || true
  rm -rf "$APP_DEST"
fi
# Old Xcode build copies (otherwise Safari may register multiple versions)
for d in ~/Library/Developer/Xcode/DerivedData/HBO_Max_Controls-*(N); do
  rm -rf "$d"
done

# Team ID: from environment, or automatically from the first "Apple Development" certificate in the keychain
if [[ -z "${DEVELOPMENT_TEAM:-}" ]]; then
  DEVELOPMENT_TEAM="$(security find-certificate -c "Apple Development" -p 2>/dev/null \
    | openssl x509 -noout -subject 2>/dev/null | sed -n 's|.*OU=\([A-Z0-9]*\).*|\1|p')"
fi
[[ -n "$DEVELOPMENT_TEAM" ]] || { echo "No team ID found. Please run DEVELOPMENT_TEAM=<ID> ./install.sh."; exit 1; }

echo "▶︎ Building (Release) …"
xcodebuild -project "$APP_NAME.xcodeproj" -scheme "$APP_NAME" \
  -configuration Release -derivedDataPath "$BUILD_DIR" \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" CODE_SIGN_STYLE=Automatic CODE_SIGN_IDENTITY="Apple Development" \
  -allowProvisioningUpdates build -quiet

BUILT="$BUILD_DIR/Build/Products/Release/$APP_NAME.app"
[[ -d "$BUILT" ]] || { echo "Build output not found"; exit 1; }

echo "▶︎ Installing to /Applications …"
cp -R "$BUILT" "$APP_DEST"
xattr -dr com.apple.quarantine "$APP_DEST" 2>/dev/null || true
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP_DEST"
pluginkit -a "$APP_DEST/Contents/PlugIns/$APP_NAME Extension.appex"

echo "▶︎ Launching the app once (registers the extension) …"
open "$APP_DEST"
sleep 2
pkill -x "$APP_NAME" 2>/dev/null || true

echo "✅ Done. Restart Safari and, if needed, enable it under Settings › Extensions"
echo "   (set website access to "All Websites")."
