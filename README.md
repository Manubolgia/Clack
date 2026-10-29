# CLACK playtest

A minimal installable web app (PWA) of the CLACK prototype, for friends to playtest.

Drag a piece onto the plate: cubes of its colour in its rows and columns fly in. Catch 4 to blast. Cubes touching a blast blast too when 4 of a colour end up together, which is a chain. Rust creeps in from the edges; blasts polish it away. When you jam, use the paint bomb once per run.

This build plays the locked rules v1.0 (Clank `CLAUDE.md` §3–4): "Everything 4" on an empty start with Block Blast-style pieces (including 1×1 and 3×3) and rust, dealt by director v2 (`director.js`, bundled from the Clank lab), which crowds the plate, gives room, and ends each run gradually.

Look and feel: enamel cubes on a brushed-steel plate, synthesised sound, haptics on Android, a title screen, a results screen, and save and resume (a run survives closing the app). Chains are readable: after every blast, the groups touching it light up; the ones that fall short of 4 together show their count ("3/4 · no chain"), in the drag preview and in the animation. Chains escalate per level (hit-stop, zoom, ladder ×2…×5, rising notes, an end total).

The settings button (top right) has sound, haptics, "sound in silent mode" (iPhone) and colour-symbol toggles, sliders for every juice timing (saved on the device), and the rule switches for testing.

## Put it online (GitHub Pages)

1. In this repo on GitHub: Settings → Pages.
2. Under "Build and deployment", choose Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`, then Save.
3. After a minute the game is at `https://manubolgia.github.io/Clack/ (capital C, it must match the repo name)`.

## Install on a phone

- iPhone (Safari): open the link, tap Share → "Add to Home Screen".
- Android (Chrome): open the link, tap the menu → "Install app" (or "Add to Home screen").

It works offline after the first visit. When you change the game, bump `VERSION` in `sw.js` and `APP_VERSION` in `index.html` (keep them equal) and add an entry to `CHANGES` in `index.html`, which players see once as "What's new" (the full history is in Settings). Installed copies check for updates whenever the app is opened or brought back to the front, and reload themselves at the next calm moment (the run resumes where it was).

## Chain rule

Touching cubes chain when the clump they would blast has 4+ cubes ("4 together", like the paint bomb). The original rule (they must pull 3; their own cubes don't count, so a line of 4 chains when 1 cube touches the blast but not when 2 do) is under Settings → Rules for testing → "Touching cubes chain when".

## Rule sets for testing

`RULESETS` in `index.html` names the rule sets being compared in the Clank repo's rules workshop: `SC` (Stable C exactly as in the fixtures), `S` (Stable C with the crater fix), `C1`, `C2`, `C4`, `C5` ("4 together", the code's default switches), `C5C6` and `C7` (Everything 4, the normal game). A link like `https://manubolgia.github.io/Clack/?rules=C7` plays that set and the app remembers it, so an installed copy keeps it; `?rules=default` goes back. While a link sets the rules, Settings hides "Rules for testing" so blind testers can't see the variant; add `&debug` to show it. A saved run only resumes under the rule set it was played with.

## Play data (opt-in)

The app can send anonymous play data (each drop, its board and tray, what the player hovered over, and run results) to a Cloudflare Worker for tuning the director; see `telemetry/README.md` in the Clank repo. The title screen asks first, and Settings → "Share play data" changes the answer (switching it off also deletes anything not yet sent). `?telemetry=local` sends to a Worker running on the same machine, for testing.

## Tests

`node tests/chains.js` runs 20,000 random drops under both chain rules and checks that the animation replay, the near-miss display, the blasts and the score all agree with the rules (no browser needed). `node tests/variants.js` checks every rule-set switch; `node tests/line4.js` prints the line-of-4 cases; `node tests/careless_play.js` measures how often blasts chain in random play.

## Files

- `index.html`: the whole game (no dependencies)
- `tests/`: rule tests that load the game's own rule code out of `index.html`
- `manifest.webmanifest`, `sw.js`, `icons/`: what makes it installable and offline
