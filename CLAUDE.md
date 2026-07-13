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
  - **Package download counts are enumerated automatically — never hardcode package lists.** OpenUPM: `/-/all` registry listing filtered by author, plus author-less candidates verified through the package's `repository.url`; the same URL maps packages to repos for the pin cards. NuGet: v3 Search API filtered by the `owners` field; each package's `projectUrl` maps it to its GitHub repo. npm: registry search `maintainer:baizor`, downloads summed in 540-day windows from each package's creation date (the API caps ranges at ~18 months). A repo shipping on both OpenUPM and NuGet shows the combined per-repo total on its pin/flagship card.
  - `httpJSONRetry` throttles and backs off hard — npm's API answers bursts with Cloudflare 1015.
- `scripts/theme.js` — shared dark/light tokens (accent colors are contrast-validated), formatters, octicon paths, shared keyframes.
- `scripts/generators/` — one module per README element: `hero.js` (gradient-shimmer name, cycling typing line, metric chips), `commits-monthly.js` (3-year bar chart), `combined-stats.js` (stats card with log-scaled metric bars + rank ring, streak card with 14-month contribution sparkline), `flagship.js` (wide Unity-MCP card with rotating gradient border), `repo-card.js` (pin cards), `tech-stack.js`, `activity-pulse.js` (brightness wave over real daily data), `waves.js` (section divider).
- `scripts/utils.js` — rank (S+/S/A++/…) percentile calculation.

Automation: `.github/workflows/update-stats.yml` runs the generator daily at midnight UTC (and on manual dispatch: `gh workflow run update-stats.yml`) with Node 20, then commits `images/stats` and `images/pins` with the message "Update stats images". It uses `secrets.GH_PAT || secrets.GITHUB_TOKEN` — the default `GITHUB_TOKEN` cannot see private data, which visibly undercounts Total PRs and Total Issues, so keep the `GH_PAT` secret (classic PAT, `repo` + `read:user`) alive. The generator aborts (no commit) if any registry API returns zero packages, so a rate-limited CI run never overwrites good numbers with zeros.

Adding a pinned repo requires two edits: add the repo name to `REPOS_TO_PIN` in `scripts/generate-stats.js`, and add the `<a><picture>` block in `README.md` (copy an existing pin block — dark `source` + light `img`).

## Conventions

- SVG output is parsed as strict XML by browsers — escape `&`, `<`, `>` in any text or attribute that carries dynamic strings (see `escapeXML` in the generators).
- The README relies on inline HTML; `.markdownlint.json` whitelists the allowed elements (`picture`, `source`, `details`, `summary` included).
- Generated SVGs under `images/stats/` and `images/pins/` are build artifacts — regenerate them with the script rather than editing them by hand.
- Element IDs and keyframe names inside SVGs are prefixed per generator (`h-`, `m-`, `f-`, `p-`, `st-`, `cs-`, `pu-`, `w-`) so multiple inline SVGs can coexist on one page during previews.

## SVG animation rules (hard-won — follow them)

- **Idle loops animate opacity only; geometry stays static.** A `steps()` translate whose step didn't match the grid pitch caused visible drift/overlap (the removed snake). Accepted exceptions: SMIL `gradientTransform` rotation (flagship border) and the one-shot entrance animations below.
- **Entrance animations play once when the image document loads** (not on scroll-into-view). Patterns that work inside GitHub's `<img>`: staggered `opacity`/`translateY` rises, `scaleX`/`scaleY` grows, `stroke-dashoffset` ring draws.
- **A CSS `transform` animation overrides the element's `transform` attribute.** Never put a transform-animating class on a group positioned via `transform="translate(...)"` — the group snaps to (0,0). Wrap it: outer `<g transform>` for position, inner `<g class>` for the animation.
- Scale animations need `transform-box: fill-box` (plus `transform-origin`) or they scale around the viewBox origin.
- Every SVG ships a `@media (prefers-reduced-motion: reduce)` block that reveals everything instantly (opacity 1, final dashoffset, animations off).
- **Verifying animations via automated-browser screenshots does not work**: Chromium suspends all animations (CSS and SMIL) inside SVG-as-`<img>` when the tab is hidden/background, so screenshots show frame 0 — entrance content looks permanently invisible. That is a measurement artifact, not a bug; verify in a visible foreground tab. GitHub's camo proxy also caches images for a few minutes after a push (hard reload helps).

## GitHub README rendering gotchas

- GitHub CSS gives `img[align=left]`/`img[align=right]` 20px padding, which breaks two-column 49% layouts (the second card wraps). Pin rows therefore use centered inline pairs — `<div align="center"><a>…</a>&nbsp;&nbsp;&nbsp;<a>…</a></div>` with `width="49%"` and **no** `align` attribute.
- Vertical gaps between card rows are baked into the SVGs as transparent bottom strips (`GAP` in `repo-card.js` / `flagship.js`), so they scale with the cards; don't add `<br/>` spacing between pin rows.
- Inline `style` attributes in README HTML are stripped by GitHub's sanitizer.
