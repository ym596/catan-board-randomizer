# Catan Board Randomizer

A project for generating randomized board layouts for the Catan board game.

## Project goal

Make setting up a game easier by generating a layout for terrain tiles and number tokens.

## Status

The first beta supports the 2025 sixth-edition base game for 3–4 players, with the approved phone-first design and desktop layout.

Website: https://ym596.github.io/catan-board-randomizer/

- Five balance levels with persistent manual restriction overrides.
- Fixed, rulebook-checked frame and port mapping.
- Exact-layout share links and last-board restoration in the same browser.
- Enlarged board with zoom, a text alternative, and PNG download.
- Local generation in a browser worker; no accounts or backend.

Balance means selected layout properties, not equal player winning chances. Production ranges and search parameters remain provisional pending physical-phone and group setup testing.

## Getting started

Clone this repository:

```sh
git clone https://github.com/ym596/catan-board-randomizer.git
cd catan-board-randomizer
```

With Node 22.12+ (24 recommended) and pnpm 11.25:

```sh
pnpm install
pnpm dev
```

On the original development Mac, the default Node is older. This launcher uses a supported Node from PATH or the existing Codex runtime without changing system settings:

```sh
bash scripts/dev.sh
```

Open the Local URL printed in Terminal, normally `http://127.0.0.1:5173/`.

```sh
pnpm test              # Rule, topology, codec, scoring, and generation tests
pnpm build             # TypeScript check and production build into dist/
pnpm preview           # Serve the production build locally
pnpm calibrate         # Reproduce the fixed 100,000-board reference sample
node --experimental-strip-types scripts/validate.ts  # 1,000 generated boards per level
```

Use the supported Node version for these commands. Dependencies and lockfile are project-local; no global tooling is installed by this repository.

## Working with a board

The first visit generates Balanced; later visits restore the last successful board. Moving the slider changes pending settings only. Generate applies them. Explicit Advanced choices stay fixed across slider changes until Reset to slider defaults.

Copy link and Download image always use the displayed board and its applied settings. Links encode the layout itself, so a scoring update does not reroll it. A link is shareable with others once the app is hosted at a reachable address; loopback development links work on this Mac.

Last-board storage is browser-local and can be cleared. Opening the site requires internet; the loaded page retains its calculation worker and uses local computation/export. Offline reopening is outside v1 scope.

## Project references

- [Product specification](SPEC.md): confirmed requirements, provisional values, and release gates.
- [Balance model](docs/BALANCE_MODEL.md): exact axes, calibration, versioning, and search behavior.
- [Validation report](VALIDATION.md): completed checks and remaining verification.
- [Frame verification](design/FRAME_VERIFICATION.md): source-backed physical mapping.
- `design/`: preserved static design studies; application source is in `src/`.

## Publishing the beta

GitHub Pages serves the static `dist/` build without a backend. The Vite base path is `/catan-board-randomizer/`; use that path after the local preview server address too.

Saving and pushing a commit does not publish it automatically. To publish an update, open this repository's **Actions** tab, select **Publish beta to GitHub Pages**, choose **Run workflow**, and select **main**. The workflow uses Node 24 and the pinned pnpm version, installs the lockfile, runs tests, builds, and deploys only after those checks pass. The Actions run shows progress and the deployed address.

Repository **Settings → Pages → Source** must be **GitHub Actions**. Only generated website files are deployed; dependencies and build output remain excluded from Git commits. Real-device, accessibility, and physical setup checks remain documented beta limitations in `VALIDATION.md`.
