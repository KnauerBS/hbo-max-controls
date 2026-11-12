# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.4.1] – 2026-11-12

### Changed
- Entire project (README, docs, UI strings, code comments, installer) is now in English.

## [1.4.0] – 2026-11-12

### Added
- App and extension icon (purple gradient with pause/play symbol).
- Status line in the panel (Connected / Video found / Not connected).
- `install.sh`: clean local installer/updater (removes old builds, signs, registers the extension).
- README, changelog, license, CONTRIBUTING.

### Changed
- Sleep timer and awake check completely reimplemented (`content.js`):
  - Timestamp-based timer, independent of missed panel messages.
  - Pauses all playing videos; video lookup also covers the shadow DOM.
  - After expiry, playback stays locked if HBO resumes on its own (e.g. next episode); auto-next is locked as well.
  - Toast and "Are you still awake?" dialog also work in fullscreen.
  - The dialog only closes via button or Enter/Space/Esc; only genuine user input counts as activity.

### Fixed
- Content script only ran on `play.hbomax.com`, now runs on `*.hbomax.com` and `*.max.com`.
- Panel opened an extra HBO tab on `www.hbomax.com` (host detection too narrow).

## [1.3.0]
- Sleep timer, awake check and auto-next in the panel.

## [1.0.0]
- First version: keyboard shortcuts for ±0.5 s and "next episode".
