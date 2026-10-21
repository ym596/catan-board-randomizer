# Sixth-edition sea-frame verification

Verified October 20, 2026. The user subsequently authorized applying this mapping to the static artwork and recording the verified reference in SPEC.md.

## Official sources

- User-supplied CN3081 CATAN–The Game Rulebook secure (1).pdf, ©2025: components diagram on page 3; fixed setup across pages 4–5; variable setup on page 11.
- [Official rulebook download](https://www.catan.com/sites/default/files/2025-03/CN3081%20CATAN%E2%80%93The%20Game%20Rulebook%20secure%20%281%29.pdf), linked through the [official rules directory](https://www.catan.com/understand-catan/game-rules).
- [Official English-edition compatibility information](https://www.catan.com/compatibility): the current base game no longer includes separate port markers; those markers are included in Seafarers.

The attached PDF was rendered at high resolution for visual inspection. Its component diagram provides readable connector digits, printed port resources and ratios, and piece silhouettes. No fan diagrams were used as evidence.

## Confirmed connector and port grouping

Each physical frame piece connects two different numbered ends. At a joint, the matching number appears on both adjoining pieces. The fixed ring can be followed as 1–2–3–4–5–6–1, up to rotation.

| Frame-piece end numbers | Printed ports on that piece |
| --- | --- |
| 1–2 | One generic 3:1 |
| 2–3 | One generic 3:1 and one brick 2:1 |
| 3–4 | One wood 2:1 |
| 4–5 | One generic 3:1 and one wheat 2:1 |
| 5–6 | One ore 2:1 |
| 6–1 | One generic 3:1 and one wool 2:1 |

Cross-check against page 3's left-to-right component illustration: the pieces are drawn with end pairs 2→1, 4→3, 1→6, 3→2, 6→5, and 5→4. Their printed ports are, respectively: generic; wood; wool plus generic; brick plus generic; ore; wheat plus generic.

This accounts for all six pieces and all nine ports: four generic ports and one for each of the five resources. Three pieces carry one port each; three carry two ports each.

## Assembly and port access

- Page 4 instructs matching the numbers at the puzzle-piece ends for the fixed setup.
- The fixed setup diagram on pages 4–5 shows the corresponding assembled frame and port access at coastal intersections.
- Page 11 permits shuffled frame-piece arrangements for variable setup. That does not change this product's decision to use the fixed frame in v1.
- Ports are printed on the frame; their assignment to physical pieces must be preserved. UI port badges represent those printed locations, not independently movable physical pieces.

## Applied schematic and coastal endpoints

The artwork now preserves the approved visual style while using the verified six physical piece groupings. Each piece follows five consecutive coastal edges, starting and ending on coastal vertices. Seams no longer divide a coastal edge at an arbitrary angular intersection.

Traverse clockwise from connector 1. There are 30 coastal edges, numbered 0–29 for the reference data. A single-port piece uses its middle edge (local edge 2). Traversing the double-port pieces in this direction, the generic port uses local edge 0 and the specific-resource port uses local edge 3. This follows the printed pier positions in the page-3 component diagram; the assembled arrangement is cross-checked against pages 4–5.

| Frame | Coastal section | Port edges and resources |
| --- | --- | --- |
| 1–2 | Edges 0–4 | Edge 2: generic |
| 2–3 | Edges 5–9 | Edge 5: generic; edge 8: brick |
| 3–4 | Edges 10–14 | Edge 12: wood |
| 4–5 | Edges 15–19 | Edge 15: generic; edge 18: wheat |
| 5–6 | Edges 20–24 | Edge 22: ore |
| 6–1 | Edges 25–29 | Edge 25: generic; edge 28: wool |

Each port uses the two endpoints of its listed edge. The nine ports use 18 distinct boundary vertices. Successive port-edge offsets follow 3, 3, 4, repeated around the loop. The mapping preserves all port/piece relationships and rotates the entire reference arrangement without reflection.

`frame-mapping.json` records the full vertex loop, per-piece coastal sections, each port's endpoint coordinates, and the display orientation. Connector 1 appears on the right side slightly above center in this point-up display. Matching connector labels are offset just outside the frame with leaders for readability; their exact screen positions are presentation choices, not physical measurements.

The official diagrams establish the assembly topology and printed port grouping. A simplified vector outline is appropriate for the website; exact manufactured die-cut dimensions are not established by this review and are not required for a readable schematic.

## Checks and remaining release gates

- Six pieces, each with five contiguous coastal edges and the correct end pair.
- Nine ports with the correct per-piece grouping and inventory.
- Eighteen distinct coastal endpoints; no port endpoint is shared with another port.
- Correct ordered coastal-edge offsets and connector cycle.
- Same terrain and number arrangement in generated/pending views.
- Phone and desktop image/layout checks, including 360-pixel page-width overflow checks.

The provisional physical-mapping notice has been replaced with a narrower schematic-outline explanation. The artwork does not reproduce exact puzzle tabs, manufactured dimensions, or proprietary illustrations. User review of the corrected design, real-device legibility, accessibility, and physical setup testing remain outstanding. SPEC.md records the verified mapping and these remaining gates.
