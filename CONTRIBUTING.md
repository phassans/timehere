# Contributing to TimeHere

Thanks for contributing.

## Local Development

### Prerequisites

- Chrome (latest stable)
- Node.js 18+ and npm

### Setup

1. Fork and clone the repo.
2. Install dependencies:
   - `cd apps/chrome-extension`
   - `npm install`
3. Load the extension in Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked**
  - Select `apps/chrome-extension`

### Iteration Workflow

- Edit files under `apps/chrome-extension`.
- In `chrome://extensions`, click **Reload** on TimeHere after code changes.
- Re-test with realistic text samples (single times, ranges, day-labeled ranges, timezone abbreviations).

## Pull Request Guidelines

- Keep PRs focused and small when possible.
- Include:
  - What changed
  - Why it changed
  - Before/after behavior
  - Screenshots for UI changes
- Mention edge cases considered (for example DST, day-rollover, ambiguous timezone abbreviations).
- Update docs when behavior changes.

## Code Style Notes

- Prefer clear, small functions over large blocks.
- Keep naming consistent with existing files (`sourceTz`, `targetTzs`, etc.).
- Avoid adding heavy dependencies for small features.

## Bug Reports

When filing an issue, include:

- page/app where problem occurs (Gmail, Slack, docs, etc.)
- exact text snippet with times
- configured source + targets
- expected vs actual output
- browser version and OS
