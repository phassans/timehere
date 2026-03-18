# TimeHere

Hover a time. Know it in yours.

TimeHere is a lightweight Chrome extension that detects time mentions on web pages and helps you view them in your own configured timezones.

## Features

- Detects common time formats and ranges on pages (for example: `8am`, `1:30-3`, `10:00 AM - 12:00 PM`)
- Converts detected times into your selected timezone list
- Tooltip and inline toggle workflows for quick comparisons
- Simple popup to manage source + target timezones

## Install (Local / Unpacked)

1. Clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked**.
5. Select this folder (`apps/chrome-extension`).

After loading, pin the extension and open any page with time text to test.

## Project Structure

- `manifest.json` - Chrome extension manifest (MV3)
- `content.js` - time detection, tooltip rendering, inline conversion logic
- `popup.html` + `popup.js` - settings UI for timezone list management
- `timezones.js` - timezone metadata and helper mappings
- `styles.css` - injected styles
- `icons/` - extension icon assets (`16`, `32`, `48`, `128`, and extras)
- `screenshots/` - mock HTML scenes and generated PNG screenshots

## Contributing

Contributions are welcome. Please read `../../CONTRIBUTING.md` before opening a pull request.

## Reporting Bugs / Edge Cases

Use GitHub Issues to report:

- false positives/false negatives in time detection
- timezone context detection bugs
- DST-related conversion issues
- UI regressions (tooltip, toggle, popup)

If you are setting up the GitHub repo now, make sure **Issues** are enabled in repository settings.

## Privacy Policy

- [TimeHere Privacy Policy](https://gist.github.com/phassans/e9afc62e1e70c664bfcd9da3ee4f7940)

## License

MIT - see `../../LICENSE`.
