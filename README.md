# CLACK playtest

A minimal installable web app (PWA) of the CLACK prototype, for friends to playtest.

Drag a piece onto the plate: cubes of its colour in its rows and columns fly in. Catch 3 to blast. Cubes touching a blast become magnets and can set off a chain. Rust creeps in from the edges; blasts polish it away. When you jam, use the paint bomb once per run.

This build: empty start, Block Blast-style pieces (including 1×1 and 3×3), rust on, director on auto with no kill point (it never ends a run on purpose).

Look and feel: enamel cubes on a brushed-steel plate, synthesised sound, haptics on Android, a title screen, a results screen, and save and resume (a run survives closing the app). Chains are readable: after every blast, the groups touching it light up; the ones that can't catch 3 of their colour show their count ("1/3 · no chain"), in the drag preview and in the animation. Chains escalate per level (hit-stop, zoom, ladder ×2…×5, rising notes, an end total).

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

`RULESETS` in `index.html` names the rule sets being compared in the Clank repo's rules workshop: `SC` (Stable C exactly as in the fixtures), `S` (Stable C with the crater fix), `C1`, `C2`, `C4`, `C5` (this app's default, "4 together"), `C5C6` and `C7`. A link like `https://manubolgia.github.io/Clack/?rules=C7` plays that set and the app remembers it, so an installed copy keeps it; `?rules=default` goes back. While a link sets the rules, Settings hides "Rules for testing" so blind testers can't see the variant; add `&debug` to show it. A saved run only resumes under the rule set it was played with.

## Play data (opt-in)

The app can send anonymous play data (each drop, its board and tray, what the player hovered over, and run results) to a Cloudflare Worker for tuning the director; see `telemetry/README.md` in the Clank repo. It stays off while `TLM_URL` is empty, and once it is set the title screen asks first. `?telemetry=local` sends to a Worker running on the same machine, for testing.

## Tests

`node tests/chains.js` runs 20,000 random drops under both chain rules and checks that the animation replay, the near-miss display, the blasts and the score all agree with the rules (no browser needed). `node tests/variants.js` checks every rule-set switch; `node tests/line4.js` prints the line-of-4 cases; `node tests/careless_play.js` measures how often blasts chain in random play.

## Files

- `index.html`: the whole game (no dependencies)
- `tests/`: rule tests that load the game's own rule code out of `index.html`
- `manifest.webmanifest`, `sw.js`, `icons/`: what makes it installable and offline
