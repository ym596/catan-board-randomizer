# Balance model v1

This documents the first implementation of the approved model. Weights, production ranges, and search targets remain provisional product parameters; this model does not predict winning chances.

## Geometry and raw measures

Use radius-two axial hex coordinates `(q,r)`. A tile center has integer coordinates `(2q+r, 3r)`. Its six corners add `(0,-2), (1,-1), (1,1), (0,2), (-1,1), (-1,-1)`. Deduplication gives 54 settlement intersections; there are 42 land-to-land shared edges.

Physical coordinates are proportional to `(sqrt(3) × x, y)`. For the three center-crossing dividing axes, assign each intersection a side by the sign of `x`, `x+y`, and `y-x`, respectively. On-axis intersections contribute equally to both halves (zero signed difference). These three axes permute under 60-degree rotation and reflection.

For each tile and axis, precompute the sum of signs at its six corners. This exactly implements counting that tile's production/access at each potential settlement location; it does not assume actual settlement occupancy.

1. **Resource production:** for each resource with count `c` and dot total `P`, target `58c/18`. Sum squared errors. The implementation stores the equivalent integer `sum((9P − 29c)²)`, 81 times the raw score, to avoid fractional histogram keys. Scaling does not change percentile ranks.
2. **Geographic production:** sum dot strengths times each tile's corner-sign weight for each axis; square each axis difference and sum.
3. **Geographic resource access:** separately sum corner-sign weights for each resource and axis; square and sum all 15 differences.

## Reference normalization

`scripts/calibrate.ts` generates `src/calibration.json` using:

- Exactly 100,000 unrestricted boards with correct terrain/token inventories.
- Seed `20261020`, Mulberry32 with unsigned 32-bit state and arithmetic.
- Descending Fisher–Yates shuffle with `floor(random × (i+1))`.
- For each board, shuffle the canonical terrain inventory, then the canonical token inventory; assign tokens in tile-array order, skipping desert.
- Canonical resource order: Wood, Wheat, Wool, Brick, Ore, Desert; counts 4,4,4,3,3,1.
- Canonical tokens: 2,12,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11.

For each metric, keep an exact sorted frequency histogram. Normalize a value with `(count strictly below + half count exactly equal) / 100000`. Values between observed bins use the cumulative count below; values beyond the maximum map to 1. The reference is fixed across slider levels and custom choices.

Weighted penalty = resource percentile × 0.5 + geographic production percentile × 0.25 + geographic resource access percentile × 0.25. Lower is preferred. The product UI explains production and restrictions, not internal percentiles or a fairness percentage.

## Candidate search

- A seeded terrain shuffle is used when matching resources may touch.
- When they may not touch, randomized backtracking places terrain while respecting adjacency. Prioritize constrained positions; cap a terrain attempt at 2,500 placement visits. Restart unsuccessful attempts within the overall deadline.
- A centered-desert request fixes that position before terrain placement. Otherwise the desert can occupy any location.
- Try up to 1,000 shuffled token assignments per terrain candidate, rejecting active number restrictions and the level's inclusive resource ranges. Restart terrain when necessary.
- Count distinct qualifying layouts only. Score them after hard checks.
- Candidate targets are 1/8/32/64/128; select randomly among the best 1/4/8/8/8 available, respectively. Use randomized tie breaking.
- Overall search deadline is three seconds. Check it in placement and token loops; loop granularity permits minor scheduling overhead. If qualifying candidates exist, use them; otherwise report failure without relaxation.
- The browser worker is retained between requests, avoiding repeated script downloads after the page and worker have loaded. No network is used for calculation.

Sampling is varied, not claimed uniform. Stronger settings improve distributions, not every pairwise comparison.

## Versioning

Current board format is 1, physical frame `sixth-edition-fixed-v1`, scoring `balance-v1`. Links contain actual terrain, numbers, level, and explicit rule overrides. Validate these versions, inventories, restrictions, and ranges before displaying. Unsupported formats fail visibly; do not reroll or reinterpret them.

Future algorithm changes must preserve reading existing format-1 layouts and their settings. A change to range interpretation, frame mapping, or calibration needs explicit version handling and tests; never silently regenerate an old shared board.
