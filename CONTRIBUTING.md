# Contributing

Thanks for your interest! So far the project only exists for **Safari on macOS**. Help is especially welcome with:

## Ports wanted

| Target | Notes |
| --- | --- |
| Chrome / Edge / Brave (MV3) | `content.js` and `popup.*` are usable almost unchanged; replace `browser.*` with `chrome.*` or use a polyfill, adapt `manifest.json` |
| Firefox | `browser.*` is available natively; adapt the manifest (`browser_specific_settings`) |
| Windows / Linux | An installer/updater replacing `install.sh` (e.g. script or package); the extension itself is platform-independent |
| iOS / iPadOS Safari | Add an iOS Xcode target, adapt the panel for touch (keyboard shortcuts don't apply) |

## How to contribute

1. Open or comment on an issue so work isn't duplicated.
2. Fork the repo and create a branch (e.g. `port/firefox`).
3. Put platform-specific code in its own folders/files (e.g. `firefox/`) and avoid duplicating shared logic where possible.
4. Open a pull request with a short description and test notes (browser, version, operating system).

## Notes

- Do not commit personal data (team IDs, paths, email addresses).
- Please record changes in the [CHANGELOG](CHANGELOG.md).
- All code, comments, docs and UI strings are written in English.
- By contributing you agree to the [MIT License](LICENSE).
