# Verification — Leonida Trophy Guide (gta6-trophy-guide-01)

Built 2026-11-19. Recording 01a1f3d7-6a64-7656-9516-daf9b7708cb4 (still running;
do not submit from this session — the parent handles the GitHub repo, the push
and the submit).

## What was built

- `app/data/trophies.json` — the 55 official trophies with their names,
  descriptions and grades exactly as PlayStation publishes them (1 platinum,
  2 gold, 6 silver, 46 bronze; 28 hidden), each with a guide written in our
  own words, named sources, a kind (story/side/collectible/activity/robbery/
  exploration), a roadmap phase (1-6), a hidden flag, a missable flag (only
  Positive Mental Attitude) and the count PlayStation tracks where it tracks
  one (21 trophies carry a count, e.g. 42 Shooting Range challenges, 18
  meditation spots, 52 areas, 500 Criminal Profile actions).
- `app/data/roadmap.json` — six roadmap phases to the platinum, in order.
- `app/index.html`, `app/style.css`, `app/app.js` — the guide and tracker:
  checklist with localStorage progress, export/import of progress as JSON,
  filters (grade, kind, status, missable only, hidden only), search box,
  spoiler setting (hides story and hidden trophies until earned), progress
  bar with percent and per-grade counts, roadmap with per-phase counts and
  click-to-jump to a trophy's guide. Vanilla JS, system font stack only,
  no external requests: the only fetches are its own two data files.
- `main.ts` — rewritten in our own words: copies app/ and screenshots/ to
  the output dir and writes dossier.json with buildDossier from the kit's
  vendor/makefun-frontend.ts (unchanged).
- `README.md` — the 3 live make.fun badges for gta6-trophy-guide-01 and repo
  bayujahida2/make-fun-gta6-trophy-guide, a link to the bounty page and the
  referral link https://make.fun/r/0q7mm1bq.
- `tools/smoke.py`, `tools/take-shots.py` — Playwright (venv Python) smoke
  test and screenshot taker; both start their own server on :8080.
- `shots.json` — rewritten for the 4 new screenshots.

Research sources (read 2026-11-19): Exophase and PSNProfiles trophy lists
via Output Lag, EGamers, GTAVibes, KeenGamer, OfZenAndComputing and u7buy.
Key facts used: 28 hidden (12 story + 5 side finales + 11 others), only
Positive Mental Attitude possibly missable (Chapter 1 balcony meditation),
no mission replay, no online trophies, ~200 h to platinum, 5 trophies with
no confirmed trigger at launch (In The Beginning…, Capital Offense, Bad Luck,
I Guess, The Truth Is Out There — plus Ten Pin's exact trigger, stated as
a melee drive-by per OfZenAndComputing). Guides for the unconfirmed ones say
so plainly instead of guessing.

## Smoke test (tools/smoke.py, 2026-11-19 12:50 WIB)

15/15 checks passed:

- zero external network requests (5 requests, 0 external, all to 127.0.0.1:8080)
- no console/page errors
- 55 trophies render (55 cards)
- toggle saves to localStorage (["Vice Got a Price!"])
- progress bar updates ("1 of 55 earned")
- earned state survives reload
- export writes earned list
- reset clears progress
- import restores progress
- grade filter silver shows 6
- search 'meditate at every spot' shows 1
- missable filter shows 1
- spoiler setting masks story trophies (second card shows 'Hidden trophy')
- spoiler off shows names again
- progress bar reaches 2 of 55

One fix during the run: the first search test expected 1 hit for 'meditation',
but Master of None's guide also mentions meditation, so the test now searches
for the exact description 'meditate at every spot'.

## Screenshots (tools/take-shots.py, 1280x800 JPEG, all within the gate)

- 1-cover.jpg: 1280x800, 87,762 bytes — main view, 12 trophies earned,
  platinum card guide open with sources.
- 2-roadmap.jpg: 1280x800, 153,894 bytes — roadmap phases 1-4 with
  per-phase earned counts.
- 3-filters.jpg: 1280x800, 91,282 bytes — grade filter on silver,
  "showing 6 of 55", all 6 silver cards with target counts.
- 4-missable.jpg: 1280x800, 91,738 bytes — missable filter with the
  Positive Mental Attitude guide open (missable flag, Target: 18, sources).

All four were read back visually and show the app as built. The starter's
three screenshots were replaced.

## main.ts double run (2026-11-19 12:51 WIB)

`mkdir -p out out2 && MAKEFUN_OUTPUT_DIR=out node main.ts &&
MAKEFUN_OUTPUT_DIR=out2 node main.ts && diff -r out out2` — clean,
BYTE-IDENTICAL. Output totals: out/ 1,098,943 bytes; dossier.json 622,442
bytes (cap 1.5 MiB); app/ 5 files, 51,825 bytes (cap 993 files / 48 MiB).
A rebuild of the dossier from a clean copy of out/app + out/screenshots with
the same buildDossier call matched out/dossier.json byte for byte.
The out/ and out2/ dirs were removed after the check; they are build output,
not part of the entry.

## makefun check (kit CLI, --worktree, no --transcripts, 2026-11-19 12:52 WIB)

`node <kit>/cli/makefun.mjs check --kit <kit> --repo . --worktree`

Result: 4 passed, 0 failed, 17 skipped, 5 checked at submission.
Passed: competition_open, snapshot, license_osi, entrypoint.
Skipped: prerequisites, strategy_note, committed_secret, and all 14
transcript checks (the site runs those on the sealed recordings; this
competition takes no transcript upload).
Checked at submission (the parent's step, after the GitHub repo exists):
repo_public, repo_owner, repo_created_after_open, commit_in_repo,
duplicate_snapshot.

Note: this kit's check does not run the gate rows (app_files, references,
screenshots, dossier_matches, trophies, js_parses) locally; the server runs
them. They were verified by hand here:

- app_files: app/ is 5 plain files, 51,825 bytes; index.html 4,079 bytes.
- references: `grep -rInE "https?://|wss?://"` over app/ finds nothing; no
  `data:` URLs either. index.html links only style.css and app.js (relative);
  app.js fetches only data/trophies.json and data/roadmap.json (relative).
- screenshots: 4 JPEGs, each ≤ 256 KiB, 1280x800 (long side 1280, short 800).
- dossier_matches: rebuilt from a clean copy, byte-identical (see above).
- trophies: trophies.json parses, 55 items, grades 46/6/2/1, 28 hidden,
  every item has a non-blank guide and named sources; names match the
  starter's official list.
- js_parses: app.js runs in the browser (smoke test) and main.ts runs under
  Node 24 (the double run above).

## Remaining for the parent (do NOT do here)

- Create the public GitHub repo bayujahida2/make-fun-gta6-trophy-guide
  (after the 2026-11-19 18:00 WIB opening), push this commit, set the repo
  About (website https://make.fun/bounty/gta6-trophy-guide-01, topic
  makefun) — the README already carries the 3 badges.
- Stop the recording 01a1f3d7-6a64-7656-9516-daf9b7708cb4, then submit with
  it after showing BAYU the full result and getting his explicit approval.
  Bounty closes Sat 21 Nov 2026 18:00 WIB.
