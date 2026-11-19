# Leonida Trophy Guide — GTA 6 Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/bayujahida2/make-fun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/bayujahida2/make-fun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01): build the best offline guide and tracker for the 55 trophies of Grand Theft Auto VI on PlayStation 5. $250 over 50 places, free entry. New to make.fun? Join with my referral link: https://make.fun/r/0q7mm1bq

## What this is

An offline guide and tracker for all 55 GTA VI trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation until earned). Every trophy shows its official name, description and grade as PlayStation publishes them, plus a guide written in our own words that cites its sources by name, and the facts that matter for planning: whether it is hidden, whether it can be missed, the count PlayStation tracks for it, and which roadmap phase it belongs to.

The one trophy you can miss is flagged loud and clear: **Positive Mental Attitude** (meditate at every spot) may need Lucia's balcony meditation in Chapter 1, which disappears once that chapter ends. Everything else can be earned in one playthrough, in free roam after the credits.

## Use it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `app/` with any static file server. The app works with the network off: it loads only its own files.

- **Tracker** — tick a trophy off when you earn it. Progress is saved in the browser (localStorage) and survives reloads. Export it to a JSON file and import it back on another machine.
- **Filters** — by grade, by kind (story, side content, collectibles, activities, robberies, exploration), by hidden, by missable, by earned/unearned, plus a search box.
- **Spoiler setting** — "Hide spoilers" masks the names and descriptions of story and hidden trophies until you earn them.
- **Roadmap** — six phases to the platinum, in order: story, side content, collectibles and exploration, activities and skill, robberies and money, then cleanup and 100% completion. Click any trophy in a phase to jump to its guide.
- **Guides** — each trophy's guide says what to do, where and how, when it can be missed, and names its sources (PlayStation, Exophase, PSNProfiles, PowerPyx, GTABase, Output Lag and others). Five trophies had no confirmed trigger at launch (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, plus the exact meditation count for Positive Mental Attitude); their guides say so plainly instead of guessing.

## What is in this repo

- `app/index.html`, `app/style.css` — the guide page.
- `app/app.js` — tracker wiring: filters, search, spoiler setting, export/import, roadmap jumps.
- `app/data/trophies.json` — the 55 official trophies with guides, sources, hidden/missable flags, counts and roadmap phases.
- `app/data/roadmap.json` — the six roadmap phases.
- `main.ts` — hands `app/` and `screenshots/` in and writes `dossier.json`.
- `serve.ts` — tiny static server for local tries.
- `screenshots/` — the cover and the guide, taken with Playwright (`tools/take-shots.py`, re-runnable).
- `tools/smoke.py` — the offline + tracker smoke test (see below).

## Originality

All guides are written in our own words for this entry, under the MIT license in `LICENSE`. Official trophy names and descriptions are shown as PlayStation publishes them; every other word is ours, with sources named beside each guide. No Rockstar Games logo, official artwork, box art or screenshot of the game is used anywhere; the look is our own.

## Verification (what was checked before this entry was handed in)

- Served with `node serve.ts --port 8080` and driven with Playwright: all 55 trophies render, toggling a trophy saves to localStorage and survives a reload, export/import round-trips progress, the grade/kind/status filters, search, missable filter and spoiler setting all work, and the progress bar updates. Every request during the run went to `127.0.0.1` only — zero external network requests.
- `node main.ts` run twice into different output dirs produces byte-identical output (`diff -r` clean).
- Gate limits checked: `app/` file count and bytes, screenshot sizes and dimensions, dossier size.
- `makefun check` run from the kit CLI; see `notes/verification.md` for the outputs.
