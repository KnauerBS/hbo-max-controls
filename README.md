<p align="center"><img src="docs/icon.png" width="128" alt="HBO Max Controls"></p>

# HBO Max Controls

A local Safari web extension (macOS) for HBO Max: fine-grained seeking, next episode, sleep timer and an "Are you still awake?" check. Everything runs locally in the browser; no data is sent anywhere.

> [!TIP]
> **Contributions welcome!** Currently only the Safari version for macOS exists. I'd love contributions for **other browsers** (Chrome, Firefox, Edge …) and **other operating systems** (Windows, Linux, iOS/iPadOS …). The logic in `content.js` and the panel (`popup.*`) is plain WebExtension tech and largely reusable. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Features

| Feature | Description |
| --- | --- |
| Seeking | ±0.5 s via `⌥⌘,` / `⌥⌘.` |
| Skip intro | Highlights the "Skip Intro" button and lets you trigger it with `Space` or `Enter` |
| Next episode | `⌥N`, or start automatically (toggle in the panel) |
| Sleep timer | Pauses after 15–120 min; prevents the next episode from continuing |
| Awake check | Pauses after a configurable period of inactivity and asks "Are you still awake?" (also in fullscreen) |
| Panel | Toolbar button with controls and connection status |

## Installation

Requirements: macOS, Safari, Xcode (with Command Line Tools) and an Apple developer certificate (a free "Apple Development" one is enough).

```sh
git clone https://github.com/KnauerBS/hbo-max-controls.git
cd hbo-max-controls
./install.sh   # team ID is detected automatically; otherwise: DEVELOPMENT_TEAM=<ID> ./install.sh
```

Alternatively, download the minimal `hbo-max-controls-v*.zip` archive from the [Releases](https://github.com/KnauerBS/hbo-max-controls/releases) page (contains only the Xcode project, extension files, `install.sh` and `LICENSE`), unzip it, and run `./install.sh`.

Then in Safari: enable **Settings › Extensions › HBO Max Controls** and allow access to `hbomax.com` / "All Websites".

> Without a valid signature (ad hoc), Safari only loads the extension with *Develop › Allow Unsigned Extensions* – and only until the next Safari restart.

### Update
Simply run `./install.sh` again. The script removes the old app and old build copies, rebuilds and registers the extension.

## Project structure

```
HBO Max Controls/                 Container app (instructions for enabling)
HBO Max Controls Extension/
  Resources/content.js            On-page logic (timer, awake check, seeking)
  Resources/popup.*               Panel
  Resources/manifest.json
tools/make-icons.swift            Icon generator (swift tools/make-icons.swift)
install.sh                        Local installer/updater
```

## Troubleshooting

- **Panel shows "Not connected"** – reload the page, check website access.
- **Extension missing in Safari** – check the signature (`codesign -dvv`), restart Safari.
- **No video found** – open an issue with the page URL.

## Disclaimer

Unofficial project, not affiliated with HBO Max / Warner Bros. Discovery. Trademarks belong to their respective owners.

## Contributing

Pull requests and issues are welcome – especially for ports to other browsers and operating systems. Details in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
