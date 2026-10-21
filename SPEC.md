# Catan Board Randomizer — Product Specification

Status: approved requirements baseline; first local v1 implementation is available for review.

This specification records the decisions made in the project conversation through October 20, 2026. The user subsequently authorized building the first local working version and approved installing its project dependencies. On October 21, 2026, the user authorized committing, pushing, and publishing an initial beta using GitHub Pages. Publication uses a manual GitHub Actions workflow, separately from ordinary pushes. Provisional parameters and outstanding release gates below remain in effect for a fully validated release.

## 1. Product goal

Help new and casual Catan groups generate a varied base-game board and accurately reproduce it using their physical pieces. Prioritize clear terrain, number, desert, port, and frame identification over decorative detail.

### Confirmed scope

- Standard base game for 3–4 players, referenced to the attached 2025 sixth-edition CN3081 rulebook.
- Phone-first design; usable phone and desktop layouts at launch.
- Top-down, two-dimensional board.
- Terrain and number generation inside a fixed six-piece sea frame with fixed ports.
- One five-position balance slider; optional, initially collapsed Advanced settings.
- Image download, shareable board links, and restoration of the last board in the same browser.
- Full board with short assembly help, plus an enlarged board view with zoom.
- Internet is required to open the site. Once loaded, generation and image export operate locally. Offline reopening is not required.

### Deferred ideas

- 5–6 player extension and expansion scenarios.
- Manual editing, individual tile locks, and separate terrain/number reshuffling.
- Frame or port shuffling.
- Accounts, cross-device saved collections, and named saved boards.
- Step-by-step guided assembly and offline reopening.
- Port balance scoring and simulation of player setup or winning chances.

## 2. Official components and product-specific rules

| Terrain | Resource | Count |
| --- | --- | ---: |
| Forest | Wood | 4 |
| Fields | Wheat | 4 |
| Pasture | Wool | 4 |
| Hills | Brick | 3 |
| Mountains | Ore | 3 |
| Desert | None | 1 |

Number inventory: one each of 2 and 12; two each of 3, 4, 5, 6, 8, 9, 10, and 11. No 7 token. Every productive tile has one number; the desert has none. The robber starts on the desert.

There are nine ports: four generic 3:1 ports and one 2:1 port for each resource. Positions, coastal endpoints, frame-piece boundaries, and connector numbers must match the verified fixed sixth-edition physical arrangement.

The rulebook-checked piece/port mapping is: 1–2 carries generic 3:1; 2–3 carries generic 3:1 and brick 2:1; 3–4 carries wood 2:1; 4–5 carries generic 3:1 and wheat 2:1; 5–6 carries ore 2:1; 6–1 carries generic 3:1 and wool 2:1. These are connector pairs, not single piece IDs. Follow the matching connector cycle 1–2–3–4–5–6–1.

Each piece spans five coastal edges. In clockwise traversal from connector 1, the 30-edge coastal loop has ports on zero-based edges 2, 5, 8, 12, 15, 18, 22, 25, and 28, respectively: generic, generic, brick, wood, generic, wheat, ore, generic, wool. Each port serves the two endpoints of its edge. The static reference stores this mapping, vertex coordinates, provenance, and orientation in `design/frame-mapping.json`; see `design/FRAME_VERIFICATION.md`. Rotation of the whole assembled frame is permitted; do not reflect it or reorder its ports.

The rulebook describes arranging number discs in letter order counterclockwise, skipping the desert, for its variable setup. This product's balanced generation is a custom arrangement method. Do not describe the slider, restrictions, resource ranges, or scoring model as official Catan rules. A separate letter-order mode is not included in the current launch scope.

## 3. Board and settings state

1. On an ordinary first visit, show a generated board at Balanced unless a valid saved board or explicit board link is present.
2. A supported board link takes precedence over browser restoration.
3. Otherwise restore the last successful board and its applied settings when available.
4. Users change draft settings while the displayed board remains unchanged.
5. If draft settings differ from applied settings, show “Settings changed—generate to apply.” Keep “Board generated: [applied level]” associated with the board.
6. Generate board applies the draft settings only after generation succeeds.
7. During generation, prevent another Generate request and show a working state without freezing scrolling or other controls. Use a snapshot of the requested settings; do not mislabel the result if draft settings subsequently change.
8. Copy link, PNG download, and the displayed board's balance details refer to the displayed board and its applied settings, never ungenerated edits.
9. Save the last successful board and applied settings. Ungenerated draft changes do not survive refresh.

A valid shared board becomes the last successful displayed board. A failed link load or failed generation must not overwrite that saved board.

## 4. Balance controls

Every level remains random. Balance describes selected layout properties, not equal chances of winning. Preserve natural resource scarcity: brick and ore have fewer tiles and should have proportionally less total production potential.

### Slider defaults

| Level | Name | Keep red numbers apart | Separate matching numbers | Separate 2 and 12 | Separate matching resources | Desert centered |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Random | On | Off | Off | Off | Off |
| 2 | Light balance | On | Off | Off | Off | Off |
| 3 | Balanced | On | On | Off | Off | Off |
| 4 | Strong balance | On | On | On | Off | Off |
| 5 | Very balanced | On | On | On | On | Off |

Random does not select for a balance score. Light balance gently favors better scores. Higher levels become more selective and, from Balanced upward, apply resource-strength ranges.

### Advanced settings

- Adjacent means two tiles share an edge.
- Keep red numbers apart prohibits adjacent 6–6, 6–8, and 8–8 pairs.
- Separate matching numbers prohibits adjacent equal numbered tokens.
- Separate 2 and 12 prohibits those two tokens sharing an edge.
- Separate matching resources prohibits edge-adjacent terrain producing the same resource.
- Desert centered places the desert in the center; off allows it anywhere, including the center.
- Track each restriction as following the slider or explicitly overridden on/off.
- A manual selection persists across slider changes. Untouched restrictions follow the new level.
- Reset to slider defaults clears all overrides and restores defaults for the selected level.
- Expose the effective restrictions and which are customized in Advanced settings.
- Enforce every effective restriction. Overlapping controls are cumulative: disabling the red-number restriction does not permit 6–6 if Separate matching numbers remains enabled.
- Turning a restriction off permits an arrangement; it does not require the generator to create that arrangement.
- Desert placement is a preference, not an inherent balance improvement.

## 5. Production strength and scoring

Number strength is the number of probability dots: 2/12 = 1; 3/11 = 2; 4/10 = 3; 5/9 = 4; 6/8 = 5. The board contains 58 total dots. This measures production potential, not actual resources collected, which depend on buildings, dice, the robber, and supply.

Resource target = 58 × resource tile count / 18: approximately 12.889 dots for each four-tile resource and 9.667 for each three-tile resource.

### Provisional resource-strength ranges

| Level | Each four-tile resource | Each three-tile resource |
| --- | --- | --- |
| Random | No range enforced | No range enforced |
| Light balance | No range enforced | No range enforced |
| Balanced | 9–17 dots | 7–13 dots |
| Strong balance | 10–16 dots | 8–12 dots |
| Very balanced | 11–14 dots | 9–11 dots |

Bounds are inclusive. Balanced and above limit both weak and strong resources. These ranges follow the level and are not an additional Advanced toggle in v1.

### Approved scoring approach; calibration remains provisional

| Measure | Weight | Raw score |
| --- | ---: | --- |
| Resource production | 50% | Sum the squared differences between each resource's dot total and its proportional target. |
| Geographic production | 25% | Across three symmetrical dividing axes, sum squared differences in production potential accessible from settlement locations on opposite halves. |
| Geographic resources | 25% | Across the same axes, sum squared differences in access to each resource from settlement locations on opposite halves. |

Evaluate all 54 potential settlement intersections without simulating occupancy or player placement order. A location's production potential sums the dots of adjacent productive tiles. Resource access counts adjacent tiles of that resource. A location on a dividing axis contributes half to each side.

Use three center-crossing symmetry axes separated by 60 degrees and shared by both geographic measures. Score must be invariant under board rotation and reflection; pin the coordinate definition in the implementation's scoring documentation and tests.

Normalize each raw measure to its percentile in a fixed, reproducible reference distribution of 100,000 unrestricted random arrangements with correct inventories. Use the same reference distributions across levels and overrides; do not recalibrate per visit or level. Lower normalized scores are preferred. Record the sampling algorithm, seed, percentile/tie method, distributions, and model version when calibration is implemented. These details require review before the scoring implementation is accepted.

Combine normalized scores using the weights above. Ports are excluded. Do not optimize all settlement locations to be equally strong or claim equal player win chances.

## 6. Generation approach and provisional search budgets

- Build terrain while enforcing applicable terrain restrictions; do not rely only on blind full-board shuffles.
- Assign number tokens while enforcing applicable number restrictions and resource-strength ranges.
- Reject invalid candidates before scoring.
- Prefer stronger scores while preserving variety; no claim of uniform sampling over all valid boards.

| Level | Target qualifying candidates | Select randomly from |
| --- | ---: | --- |
| Random | 1 | That candidate |
| Light balance | 8 | Best 4 |
| Balanced | 32 | Best 8 |
| Strong balance | 64 | Best 8 |
| Very balanced | 128 | Best 8 |

The target candidates, selection-pool sizes, weights, and resource ranges are provisional. Resolve ties without fixed positional preference. If fewer candidates are found, the selection pool contains at most the available candidates.

Run generation in a Web Worker. Limit searching to three seconds, including unsuccessful placement attempts. The page must remain responsive. Validate timing and success rates on representative phones before finalizing the budget.

If qualifying candidates exist at the deadline, select from those found. If none exist, retain the current board and show that no suitable board was found within the search limit, with Try again and Adjust settings. Never silently relax restrictions or ranges, and never describe a timeout as proof of impossibility. If no board exists yet, show a recovery state instead of a misleading board; disable share/export until there is a valid board.

Higher levels should improve score distributions over many generations. They do not guarantee that every individual board beats every board generated at a lower level, especially when custom restrictions differ.

### Exploratory evidence from planning

An in-memory Python feasibility check sampled 200,000 random layouts and found examples meeting all levels' default restrictions/ranges. Only one sampled layout met the strictest default restrictions, demonstrating the limitations of blind shuffling. A second check constructed 100 no-adjacent-resource terrain layouts with the desert centered; all 100 found token arrangements satisfying all five toggles and the Very balanced ranges within the trial allowance. These checks support sampled feasibility, not completeness, uniformity, browser/mobile performance, or player fairness. The exploratory scripts were not added as application code or a permanent test suite.

## 7. Presentation and assembly

- Warm off-white background, dark readable text, restrained controls.
- Original simplified resource symbols and distinct terrain colors. Keep resource names outside the hexes in a shared, always-visible legend below the board to reduce clutter. The legend pairs each symbol/color with Wood, Wheat, Wool, Brick, Ore, or Desert. Do not rely on color alone or reuse proprietary rulebook art as website assets.
- Large, high-contrast circular number tokens, red 6/8 styling, and probability dots.
- Distinct desert symbol and sandy appearance, identified by name in the shared legend; no token. Include a small robber starting-position indicator without obscuring the desert symbol.
- Each resource-specific port repeats its terrain's symbol and color with a clear 2:1 ratio. Generic 3:1 ports use a distinct dark badge and exchange symbol. Keep the ratio legible; do not repeat resource names inside port badges.
- Identify each port's two coastal settlement intersections using high-contrast corner markers, a highlighted coastal edge, and short wooden piers. Include the help text “Use either marked corner for that port” and explain that 2:1 uses the shown resource while 3:1 uses any one resource.
- Render all six sea-frame pieces as individually outlined silhouettes, with continuous solid boundaries from the coastline to the outer edge, rather than a single uninterrupted sea band or short dashed seam hints. Subtle differences in sea fill may reinforce separation but must not be the only cue.
- Place matching numbered ends on opposite sides of each frame join so users can identify which physical pieces connect. Use square labels visually distinct from circular number tokens and port ratios. Labels may sit just outside the outline with leaders to avoid overlapping port badges. Use the rulebook-checked connector/port topology; physical puzzle tabs may be simplified as schematic seams.
- Keep frame and orientation consistent across generations.
- Hint: “Match the numbered ends to assemble the frame.”
- Phone: board first, then controls; board uses available width. Desktop: board left, controls right.
- Show the applied level with the board. Show pending selection and the apply notice beside the controls.
- Include the five-position slider, initially collapsed Advanced settings, Generate board, Copy link, Download image, optional Balance details, and short assembly help.
- Balance details describe production potential by resource and the applied restrictions. Do not show a fairness percentage or player-win predictions.
- Enlarged board supports touch zoom, explicit zoom controls, keyboard access, and Escape to close; preserve setup and orientation.

## 8. Sharing, persistence, and export

### Share links

No account required. Encode the actual terrain and numbers, applied level, manual overrides, fixed-frame version, scoring version, and data-format version in the URL fragment after `#`. Do not regenerate linked layouts from a seed. Do not put pending edits into the link.

Validate input structure, supported versions, inventories, settings consistency, and active restrictions/ranges before displaying a shared setup. Support version-one layouts after future generator changes by preserving their saved arrangement and interpreting them using their supported version. Unsupported versions must show recovery rather than reinterpretation.

For malformed/unsupported links, show “This board link couldn't be loaded” with Open my last board if available and Generate a new board. Do not silently substitute a board. Provide selectable link text if clipboard access fails.

### Restoration

Persist the last successful layout and applied settings in the same browser. Explain that storage may be cleared and does not sync across devices. Corrupt/unavailable storage must not prevent generation; show a concise restoration-unavailable message where applicable.

### PNG export

Export a complete opaque white-background image at 2,400 pixels wide, containing terrain, numbers/dots, desert, ports, frame connectors, a small legend, and applied settings. The entire board must fit without cropping. Use a stable filename such as `catan-board-balanced.png`. Export the applied setup even if settings have pending edits. Export errors retain the board and offer retry.

## 9. Technical architecture proposal approved for v1

- React, TypeScript, Vite; no backend, database, accounts, or server-side generation.
- SVG board renderer shared by normal view, enlarged view, and image export.
- Browser Web Worker for bounded generation.
- Local browser storage for last-board restoration.
- Versioned self-contained layout links, independent of generator seeds and server storage.
- Local implementation uses React, TypeScript, Vite, and Vitest with exact resolved versions in `pnpm-lock.yaml`. Hosting and deployment remain unchosen and unauthorized.

## 10. Accessibility and acceptance criteria

Target WCAG 2.2 AA. Support keyboard operation, visible focus, screen-reader status/error announcements, and non-color identifiers. Target 44 × 44 CSS-pixel controls.

### Functional acceptance

- Exact terrain/token inventories; no number on desert; correct fixed frame/ports.
- Each restriction, override persistence, cumulative overlapping restrictions, and Reset to slider defaults behaves as specified.
- Inclusive resource-range boundaries are tested; random/light levels have no enforced range.
- Draft edits preserve the displayed layout; sharing/exporting always uses applied state.
- Failure never silently loosens settings or overwrites a valid saved board.
- Share links round-trip exact arrangements/settings; malformed, unsupported, and older links behave correctly.
- Refresh restores the last successful setup; missing/corrupt storage is recoverable.
- PNG output is legible and complete; export/clipboard failure is recoverable.

### Visual and accessibility acceptance

- At 360 CSS pixels wide, no page-level horizontal overflow.
- Terrain symbols are identifiable through the always-visible labeled legend; hexes do not contain repeated resource names.
- Terrain and corresponding 2:1 ports use consistent symbols/colors; generic ports are visibly distinct. Port ratios and frame connector numbers remain distinguishable from terrain number tokens.
- Each port's two usable coastal corners are unambiguous; piers and markers do not obscure terrain or number tokens.
- All six frame pieces can be visually traced from their complete outlines; matching connector labels appear on either side of each join.
- All board information remains readable in the enlarged view.
- Text alternative lists terrain/numbers by row and ports clockwise.
- Enlarged-view focus/closing/zoom works with keyboard and touch; focus returns to the triggering control.
- Text and controls satisfy contrast requirements; red numbers retain number/dot information without relying on color.
- Test current iPhone Safari, Android Chrome, and desktop Safari, Chrome, Firefox, and Edge.

### Model and usability validation

- Scoring invariance under 60-degree rotation and reflection.
- Document reproducible reference calibration and scoring-version behavior.
- Generate at least 1,000 boards per default level; compare score distributions, success rate, diversity, and generation latency. Also exercise all 32 Advanced restriction combinations at each level.
- Evaluate wall-clock budgets on representative phones; document actual devices/browser versions before release.
- At least three new/casual players reproduce terrain, numbers, and frame setup from the normal/enlarged view without moderator correction. Record errors and iterate on labels/layout.

## 11. Static mockup deliverables and limitations

Current deliverable: static phone and desktop views, each showing a generated Balanced board and a pending Strong balance selection while preserving the same board. Controls are illustrative, not functional. No application implementation or installation is authorized by approving this mockup.

The later authorization to build v1 is separate from mockup approval. A working application now implements these states in `src/`; the static studies remain preserved in `design/`. See `VALIDATION.md` for completed checks and remaining release gates.

**Visual direction approved:** resource names moved from hexes to a shared symbol legend; terrain-matched resource port badges and distinct generic ports; explicit coastal corner markers and piers; six individually outlined sea-frame pieces with solid seams and matching-end labels. Completion of accessibility/usability testing and approval of the corrected artwork remain separate release gates.

The sample board may be validated against terrain/token counts, default Balanced restrictions, and resource ranges. It is not claimed to be a scored output of the future calibrated generator.

**Rulebook mapping checked and applied:** the six connector pairs, port assignment/order, and 18 distinct port-access corners have been transcribed from the official sixth-edition component and fixed-setup diagrams and applied to the mockup. Frame boundaries follow contiguous five-edge coastal sections instead of equal angular wedges. The reference diagram is rotated as a whole for the point-up board display. The vector outline is a readable schematic, not an exact manufactured die-cut template. Real-device readability and user setup validation remain outstanding.

## 12. Open questions and release gates

1. Connector/port mapping verified against the rulebook and applied to the static reference; review the corrected artwork before application implementation.
2. Visual direction approved; validate small-screen readability, pending-state clarity, and setup usability on real devices before release.
3. Finalize calibration reproducibility, normalization/tie handling, axes, generator diversity, and scoring versioning before accepting the algorithm.
4. Validate and, with approval, adjust provisional weights, ranges, candidate counts, and three-second search budget.
5. Hosting decided: GitHub Pages with a manual GitHub Actions build/test/deploy workflow. Initial beta publication is authorized; remaining validation gates still apply before a fully validated release.
6. Complete accessibility, browser, export, and user setup checks before release.

## 13. References

- User-supplied PDF: `CN3081 CATAN–The Game Rulebook secure (1).pdf`, 2025 sixth edition; components page 3, fixed setup pages 4–5, variable setup pages 11–12. Source remains in the user's Downloads folder and is not copied to the public repository.
- [What is a balanced Catan board?](https://www.boardgameanalysis.com/what-is-a-balanced-catan-board/) — analytical inspiration, not an official rule or winning-probability model.
- [Reference randomizer](https://catanboardgenerator.vercel.app/) — interaction reference, not a design/assets source to copy.
- [Vite guide](https://vite.dev/guide/), [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), and [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — implementation/accessibility references.
