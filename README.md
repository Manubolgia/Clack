# CLACK playtest

A minimal installable web app (PWA) of the CLACK prototype, for friends to playtest.

Drag a piece onto the plate: cubes of its colour in its rows and columns fly in. Catch 3 to blast. Cubes touching a blast become magnets and can set off a chain. Rust creeps in from the edges; blasts polish it away. When you jam, use the paint bomb once per run.

This build: empty start, Block Blast-style pieces (including 1×1 and 3×3), rust on, director on auto with no kill point (it never ends a run on purpose). Tuning switches are under "Settings for testing".

## Put it online (GitHub Pages)

1. In this repo on GitHub: Settings → Pages.
2. Under "Build and deployment", choose Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`, then Save.
3. After a minute the game is at `https://manubolgia.github.io/Clack/ (capital C, it must match the repo name)`.

## Install on a phone

- iPhone (Safari): open the link, tap Share → "Add to Home Screen".
- Android (Chrome): open the link, tap the menu → "Install app" (or "Add to Home screen").

It works offline after the first visit. When you change the game, bump `VERSION` in `sw.js` so installed copies pick up the update.

## Files

- `index.html`: the whole game (no dependencies)
- `manifest.webmanifest`, `sw.js`, `icons/`: what makes it installable and offline
