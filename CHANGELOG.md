# Changelog

Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [1.4.0] – 2026-11-12

### Hinzugefügt
- App- und Extension-Icon (lila Verlauf mit Pause/Play-Symbol).
- Statuszeile im Panel (Verbunden / Video gefunden / Nicht verbunden).
- `install.sh`: sauberer lokaler Installer/Updater (bereinigt alte Builds, signiert, registriert die Extension).
- README, Changelog, Lizenz.

### Geändert
- Sleep Timer und Wach-Check komplett neu implementiert (`content.js`):
  - Zeitstempel-basierter Timer, unabhängig von verpassten Panel-Nachrichten.
  - Pausiert alle spielenden Videos; Video-Suche auch im Shadow-DOM.
  - Nach Ablauf bleibt die Wiedergabe gesperrt, falls HBO selbst weiterspielt (z. B. nächste Folge); Auto-Next ist dann ebenfalls gesperrt.
  - Toast und „Bist du noch wach?“-Dialog funktionieren auch im Vollbild.
  - Der Dialog schließt nur per Button bzw. Enter/Leertaste/Esc; nur echte Benutzereingaben zählen als Aktivität.

### Behoben
- Content-Script lief nur auf `play.hbomax.com`, jetzt auf `*.hbomax.com` und `*.max.com`.
- Panel öffnete auf `www.hbomax.com` einen zusätzlichen HBO-Tab (zu enge Host-Erkennung).

## [1.3.0]
- Sleep Timer, Wach-Check und Auto-Next im Panel.

## [1.0.0]
- Erste Version: Tastenkürzel für ±0,5 s und „Nächste Folge“.
