#!/bin/zsh
# Sauberer lokaler Installer/Updater für HBO Max Controls (Safari).
# Nutzung: ./install.sh
set -euo pipefail

cd "${0:A:h}"
APP_NAME="HBO Max Controls"
APP_DEST="/Applications/$APP_NAME.app"
BUILD_DIR="$(mktemp -d /tmp/hbo-build.XXXXXX)"
trap 'rm -rf "$BUILD_DIR"' EXIT

echo "▶︎ Alte App beenden und Registrierung entfernen …"
pkill -x "$APP_NAME" 2>/dev/null || true
if [[ -d "$APP_DEST" ]]; then
  pluginkit -r "$APP_DEST/Contents/PlugIns/$APP_NAME Extension.appex" 2>/dev/null || true
  rm -rf "$APP_DEST"
fi
# Alte Xcode-Build-Kopien (sonst registriert Safari evtl. mehrere Versionen)
for d in ~/Library/Developer/Xcode/DerivedData/HBO_Max_Controls-*(N); do
  rm -rf "$d"
done

# Team-ID: aus Umgebung oder automatisch aus dem ersten "Apple Development"-Zertifikat im Schlüsselbund
if [[ -z "${DEVELOPMENT_TEAM:-}" ]]; then
  DEVELOPMENT_TEAM="$(security find-certificate -c "Apple Development" -p 2>/dev/null \
    | openssl x509 -noout -subject 2>/dev/null | sed -n 's|.*OU=\([A-Z0-9]*\).*|\1|p')"
fi
[[ -n "$DEVELOPMENT_TEAM" ]] || { echo "Keine Team-ID gefunden. Bitte DEVELOPMENT_TEAM=<ID> ./install.sh ausführen."; exit 1; }

echo "▶︎ Bauen (Release) …"
xcodebuild -project "$APP_NAME.xcodeproj" -scheme "$APP_NAME" \
  -configuration Release -derivedDataPath "$BUILD_DIR" \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" CODE_SIGN_STYLE=Automatic CODE_SIGN_IDENTITY="Apple Development" \
  -allowProvisioningUpdates build -quiet

BUILT="$BUILD_DIR/Build/Products/Release/$APP_NAME.app"
[[ -d "$BUILT" ]] || { echo "Build-Ergebnis nicht gefunden"; exit 1; }

echo "▶︎ Nach /Applications installieren …"
cp -R "$BUILT" "$APP_DEST"
xattr -dr com.apple.quarantine "$APP_DEST" 2>/dev/null || true
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP_DEST"
pluginkit -a "$APP_DEST/Contents/PlugIns/$APP_NAME Extension.appex"

echo "▶︎ App einmal starten (registriert die Extension) …"
open "$APP_DEST"
sleep 2
pkill -x "$APP_NAME" 2>/dev/null || true

echo "✅ Fertig. Safari neu starten und ggf. unter Einstellungen › Erweiterungen aktivieren"
echo "   (Berechtigung für Websites auf „Alle Websites“ setzen)."
