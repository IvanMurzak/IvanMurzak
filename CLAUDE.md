# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Ivan Murzak's GitHub profile repository (pushed to `IvanMurzak/IvanMurzak`, so `README.md` renders on his GitHub profile page). It contains the profile README, a resume (`Resume.md`), and a self-contained Node.js pipeline that generates the animated SVG cards embedded in the README.

There is no `package.json` — the scripts use only Node.js built-ins (`https`, `fs`). No dependencies, no build step, no test suite.

## Commands

Generate all stat SVGs (requires `GH_TOKEN` env var with a GitHub token):

```powershell
node scripts/generate-stats.js
```

Or use the wrapper, which resolves the token automatically (env var → `.secrets` file → `gh auth token`):

```powershell
./commands/run-update-stats.ps1            # generate only
./commands/run-update-stats.ps1 -Commit    # also commit locally (never pushes)
```

`.secrets` holds local secrets and is gitignored — never commit it. A full run takes a few minutes (npm downloads API is heavily throttled).

## Architecture

Every visual element of the README is a generated SVG committed to the repo, produced in **two variants** (`*-dark.svg` / `*-light.svg`) and referenced via `<picture><source media="(prefers-color-scheme: dark)">` so the profile looks native in both GitHub themes. All animation is pure CSS/SMIL inside the SVGs — GitHub plays it inside `<img>`; every generator includes a `prefers-reduced-motion` fallback.

- `scripts/generate-stats.js` — orchestrator. Holds `REPOS_TO_PIN` (display selection only — which repos get a pin card) and writes everything under `images/stats/` and `images/pins/`.
- `scripts/api.js` — all data fetching:
  - GitHub GraphQL (username hardcoded `IvanMurzak`): user/repo info plus year-by-year contribution calendar aggregation (the API returns max one year per query); helpers derive monthly (36 mo) and daily (40 d) series.
  - **Package download counts are enumerated automatically — never hardcode package lists.** OpenUPM: `/-/all` registry listing filtered by author, plus author-less candidates verified through the package's `repository.url`; the same URL maps packages to repos for the pin cards. NuGet: v3 Search API filtered by the `owners` field. npm: registry search `maintainer:baizor`, downloads summed in 540-day windows from each package's creation date (the API caps ranges at ~18 months).
  - `httpJSONRetry` throttles and backs off hard — npm's API answers bursts with Cloudflare 1015.
- `scripts/theme.js` — shared dark/light tokens (accent colors are contrast-validated), formatters, octicon paths, shared keyframes.
- `scripts/generators/` — one module per README element: `hero.js` (gradient-shimmer name, cycling typing line, metric chips), `commits-monthly.js` (3-year bar chart), `combined-stats.js` (stats card with log-scaled metric bars + rank ring, streak card with 14-month contribution sparkline), `flagship.js` (wide Unity-MCP card with rotating gradient border), `repo-card.js` (pin cards), `tech-stack.js`, `activity-pulse.js` (brightness wave over real daily data), `waves.js` (section divider).
- `scripts/utils.js` — rank (S+/S/A++/…) percentile calculation.

Automation: `.github/workflows/update-stats.yml` runs the generator daily at midnight UTC (and on manual dispatch) with Node 20, then commits `images/stats` and `images/pins` with the message "Update stats images".

Adding a pinned repo requires two edits: add the repo name to `REPOS_TO_PIN` in `scripts/generate-stats.js`, and add the `<a><picture>` block in `README.md` (copy an existing pin block — dark `source` + light `img`).

## Conventions

- SVG output is parsed as strict XML by browsers — escape `&`, `<`, `>` in any text or attribute that carries dynamic strings (see `escapeXML` in the generators).
- The README relies on inline HTML; `.markdownlint.json` whitelists the allowed elements (`picture`, `source`, `details`, `summary` included).
- Generated SVGs under `images/stats/` and `images/pins/` are build artifacts — regenerate them with the script rather than editing them by hand.
- Element IDs and keyframe names inside SVGs are prefixed per generator (`h-`, `m-`, `f-`, `p-`, `st-`, `pu-`, `w-`) so multiple inline SVGs can coexist on one page during previews.
