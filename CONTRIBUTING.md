# Mitwirken

Danke fürs Interesse! Das Projekt gibt es bisher nur für **Safari auf macOS**. Hilfe ist besonders willkommen bei:

## Gesuchte Ports

| Ziel | Hinweise |
| --- | --- |
| Chrome / Edge / Brave (MV3) | `content.js` und `popup.*` sind fast unverändert nutzbar; `browser.*` durch `chrome.*` bzw. Polyfill ersetzen, `manifest.json` anpassen |
| Firefox | `browser.*` ist nativ vorhanden; Manifest anpassen (`browser_specific_settings`) |
| Windows / Linux | Installer/Updater als Ersatz für `install.sh` (z. B. Skript oder Paket); Extension selbst ist plattformunabhängig |
| iOS / iPadOS Safari | Xcode-Ziel für iOS ergänzen, Panel für Touch anpassen (Tastenkürzel entfallen) |

## Wie beitragen?

1. Issue eröffnen oder kommentieren, damit nicht doppelt gearbeitet wird.
2. Fork erstellen, Branch anlegen (z. B. `port/firefox`).
3. Plattformspezifisches in eigene Ordner/Dateien legen (z. B. `firefox/`), gemeinsame Logik möglichst nicht duplizieren.
4. Pull Request mit kurzer Beschreibung und Testhinweisen (Browser, Version, Betriebssystem).

## Hinweise

- Keine persönlichen Daten (Team-IDs, Pfade, E-Mail-Adressen) committen.
- Änderungen bitte im [CHANGELOG](CHANGELOG.md) vermerken.
- Mit dem Beitrag stimmst du der [MIT-Lizenz](LICENSE) zu.
