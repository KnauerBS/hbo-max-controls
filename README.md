<p align="center"><img src="docs/icon.png" width="128" alt="HBO Max Controls"></p>

# HBO Max Controls

Lokale Safari Web Extension (macOS) für HBO Max: feines Spulen, nächste Folge, Sleep Timer und „Bist du noch wach?“-Check. Alles läuft lokal im Browser, es werden keine Daten gesendet.

## Funktionen

| Funktion | Beschreibung |
| --- | --- |
| Spulen | ±0,5 s per `⌥⌘,` / `⌥⌘.` |
| Nächste Folge | `⌥N` oder automatisch starten (Schalter im Panel) |
| Sleep Timer | Pausiert nach 15–120 Min.; verhindert, dass die nächste Folge weiterläuft |
| Wach-Check | Pausiert nach einstellbarer Inaktivität und fragt „Bist du noch wach?“ (auch im Vollbild) |
| Panel | Toolbar-Button mit Bedienung und Verbindungsstatus |

## Installation

Voraussetzungen: macOS, Safari, Xcode (mit Command Line Tools) und ein Apple-Developer-Zertifikat (kostenloses „Apple Development“ genügt).

```sh
git clone https://github.com/KnauerBS/hbo-max-controls.git
cd hbo-max-controls
./install.sh   # Team-ID wird automatisch erkannt; sonst: DEVELOPMENT_TEAM=<ID> ./install.sh
```

Danach in Safari: **Einstellungen › Erweiterungen › HBO Max Controls** aktivieren und den Zugriff auf `hbomax.com` / „Alle Websites“ erlauben.

> Ohne gültige Signatur (ad hoc) lädt Safari die Extension nur mit *Entwickler › Nicht signierte Erweiterungen erlauben* – und nur bis zum nächsten Safari-Neustart.

### Update
Einfach `./install.sh` erneut ausführen. Das Skript entfernt die alte App und alte Build-Kopien, baut neu und registriert die Extension.

## Projektstruktur

```
HBO Max Controls/                 Container-App (Anleitung zum Aktivieren)
HBO Max Controls Extension/
  Resources/content.js            Logik auf der Seite (Timer, Wach-Check, Spulen)
  Resources/popup.*               Panel
  Resources/manifest.json
tools/make-icons.swift            Icon-Generator (swift tools/make-icons.swift)
install.sh                        Lokaler Installer/Updater
```

## Fehlersuche

- **Panel zeigt „Nicht verbunden“** – Seite neu laden, Website-Zugriff prüfen.
- **Extension fehlt in Safari** – Signatur prüfen (`codesign -dvv`), Safari neu starten.
- **Kein Video gefunden** – Issue mit der URL der Seite öffnen.

## Hinweis

Inoffizielles Projekt, nicht mit HBO Max / Warner Bros. Discovery verbunden. Markennamen gehören ihren Inhabern.

## Lizenz

[MIT](LICENSE)
