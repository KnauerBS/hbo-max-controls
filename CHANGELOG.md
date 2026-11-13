# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.6.0] – 2026-11-12

### Added
- Highlights and focuses the "Skip Intro" button with a purple outline/glow when visible, allowing it to be triggered directly with `Space` or `Enter`.

## [1.5.0] – 2026-11-12

### Changed
- Replaced timer dropdowns in the panel with mutually exclusive option buttons (`Off` and preset minutes, without debug values) plus a custom minute input field.

### Fixed
- Opening HBO Max from the Safari Start Page or another website no longer flashes "Not connected – reload the page" in the panel; the status now shows "Opening HBO Max …" and retries connection if Safari keeps the popover open while loading.

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
