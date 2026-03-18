# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TimeHere is a Chrome extension that detects time mentions on web pages and converts them to the user's configured timezones. It supports single times, time ranges, day-labeled ranges, and timezone abbreviation detection.

## Repository Structure

Monorepo under `apps/`. Only `apps/chrome-extension` is actively developed. Planned apps (`electron-mac`, `ios`, `android`) do not exist yet.

## Development Setup

```bash
cd apps/chrome-extension
npm install
```

Load as unpacked extension: Chrome → `chrome://extensions` → Developer mode → Load unpacked → select `apps/chrome-extension`.

After code changes, click **Reload** on the extension card in `chrome://extensions` to pick up changes. There is no build step — all files are plain JS loaded directly by Chrome.

## Architecture

The extension is vanilla JS (no framework, no bundler) using Chrome Extension Manifest V3.

**Content scripts** (injected into every page via `manifest.json`):
- `timezones.js` — runs first; defines the timezone catalog (`TIMEHERE_TIMEZONES`), a lookup map (`TIMEHERE_TZ_BY_ID`), and an offset label helper on `window`. This is the shared data layer for both content script and popup.
- `content.js` — runs second; self-contained IIFE that walks the DOM, regex-matches time patterns (`TIME_RX`), wraps them in annotated `<span class="timehere-span">` elements, and manages hover tooltips (rendered in a Shadow DOM host `<timehere-root>`) and an inline flip toggle. Uses `MutationObserver` to handle dynamically added content.
- `styles.css` — injected styles for the dashed-underline spans.

**Popup** (`popup.html` + `popup.js`):
- Settings UI for managing the timezone list (up to 4 timezones). First timezone is the "source" (what times on the page are assumed to be in), remaining are targets. Uses `chrome.storage.sync` so settings follow the user across devices.
- Includes a live preview of how a sample time range converts.

**Key conventions:**
- Timezone list is ordered: index 0 = source, indices 1–3 = targets. Stored in `chrome.storage.sync` under key `timezones`.
- `normalizeTzs()` / `normalizeList()` enforce: min 2, max 4, deduplicated, all valid IANA IDs from the catalog.
- Time conversion uses `Intl.DateTimeFormat` for DST-correct conversions — no timezone library dependency.
- The content script detects page-level source timezone from contextual cues like "(in PT)" or "times are EST" via `detectTzInContext()`.

## Code Style

- Naming: `sourceTz`, `targetTzs`, `srcTz`, `dstTz` for timezone variables.
- Small, focused functions. No heavy dependencies for small features (puppeteer/sharp in package.json are for screenshot generation only, not runtime).
- No TypeScript, no linting configured, no test framework.

## Edge Cases to Be Aware Of

- DST transitions: conversions use `Intl.DateTimeFormat` with iterative date alignment in `toUTC()`.
- Day rollover: the tooltip shows a `+1d` badge when a converted range crosses midnight.
- Ambiguous timezone abbreviations (e.g., IST = India or Ireland): disambiguated by country in tooltip labels.
- Skipped elements: `<code>`, `<pre>`, `<script>`, `<style>`, `contenteditable`, `aria-hidden`, and `<input>`/`<textarea>` are excluded from scanning.
