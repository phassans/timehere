# TimeHere Monorepo

Hover a time. Know it in yours.

## **[Download & Install on Chrome — Available on the Chrome Web Store](https://chromewebstore.google.com/detail/kobpodmjbeheahbgfdjefkphgfabjppn?utm_source=item-share-cb)**

> **Free to download.** Click the link above to install TimeHere directly from the Chrome Web Store — no build step required.

TimeHere is organized as a multi-app repository. The active implementation today is the Chrome extension.

## Apps

- `apps/chrome-extension` - current production app (Chrome extension)
- `apps/electron-mac` - planned desktop app for macOS (Electron)
- `apps/ios` - planned iOS app
- `apps/android` - planned Android app

## Chrome Extension Features

- Detects common time formats and ranges on pages (for example: `8am`, `1:30-3`, `10:00 AM - 12:00 PM`)
- Converts detected times into your selected timezone list
- Tooltip and inline toggle workflows for quick comparisons
- Simple popup to manage source + target timezones

## Getting Started (Chrome Extension)

1. Install dependencies:
   - `cd apps/chrome-extension`
   - `npm install`
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select `apps/chrome-extension`

After loading, pin the extension and open any page with time text to test.

## Chrome Extension Structure

- `apps/chrome-extension/manifest.json` - Chrome extension manifest (MV3)
- `apps/chrome-extension/content.js` - time detection, tooltip rendering, inline conversion logic
- `apps/chrome-extension/popup.html` + `apps/chrome-extension/popup.js` - settings UI for timezone list management
- `apps/chrome-extension/timezones.js` - timezone metadata and helper mappings
- `apps/chrome-extension/styles.css` - injected styles
- `apps/chrome-extension/icons/` - extension icon assets
- `apps/chrome-extension/screenshots/` - mock HTML scenes and generated PNG screenshots

## Create Chrome Web Store Upload ZIP

From the repo root, run:

`cd apps/chrome-extension && zip -r ../../timehere-extension.zip manifest.json content.js popup.html popup.js styles.css timezones.js icons`

This creates an extension-only upload package with `manifest.json` at the archive root (required by Chrome Web Store).

## Reporting Bugs / Edge Cases

Use GitHub Issues to report:

- false positives/false negatives in time detection
- timezone context detection bugs
- DST-related conversion issues
- UI regressions (tooltip, toggle, popup)

If you are setting up the GitHub repo now, make sure **Issues** are enabled in repository settings.

## Privacy Policy

- [TimeHere Privacy Policy](https://gist.github.com/phassans/e9afc62e1e70c664bfcd9da3ee4f7940)

## Contributing

See `CONTRIBUTING.md` for contribution workflow and PR guidelines.

## License

MIT - see `LICENSE`.
