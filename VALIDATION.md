# Local v1 validation

Development validation, October 20, 2026. This is a local prototype review, not a completed cross-browser or physical-phone release certification.

## Automated checks

- TypeScript and Vite production build.
- Fourteen core tests: terrain/token inventories, desert handling, frame/port topology, manual overrides, all five levels, every one of the 32 Advanced combinations at every level, score rotation/reflection symmetry, exact link round trips, malformed/future/inconsistent links, blocked/corrupt storage, and zero-budget failure without substitution.
- Reproducible fixed reference sample: 100,000 boards; seed 20261020; exact histogram normalization. See `docs/BALANCE_MODEL.md`.

## Generation sample

`scripts/validate.ts` generated 1,000 boards per default level, using distinct deterministic seeds. All 5,000 requests produced valid boards, with no rule/range violations and 1,000 distinct layouts within each level. Raw results are in `generation-validation.json`.

| Level | Median weighted penalty (lower preferred) | Median generation time | p95 generation time |
| --- | ---: | ---: | ---: |
| Random | 0.475 | 0.05 ms | 0.13 ms |
| Light balance | 0.356 | 0.12 ms | 0.18 ms |
| Balanced | 0.227 | 1.26 ms | 1.82 ms |
| Strong balance | 0.150 | 5.52 ms | 6.73 ms |
| Very balanced | 0.029 | 63.96 ms | 75.91 ms |

These are Node measurements on this development Mac, not browser or physical-phone timings. The penalty is an internal model measure, not a probability of fairness or winning. Higher levels' score distributions improved in this sample; no pairwise superiority guarantee is made.

## Browser flow checks

Checked in the Codex in-app browser against the running local application:

- Automatic Balanced generation and fixed frame rendering.
- Draft slider changes preserve exact displayed terrain/numbers and show the apply notice.
- Manual on/off choices persist after slider movement; reset restores slider defaults.
- Generation applies custom settings, including a centered desert.
- Reload restores exact layout/settings.
- Shared link reopens the exact layout/settings, with a selectable copy field available.
- Invalid links show recovery rather than a substituted board; restoring the last board works.
- Enlarged board zooms; Escape closes it and focus returns to Enlarge.
- PNG download succeeds at 2,400 × 2,980 pixels, includes full board, legend, applied settings, and port/frame hints; image visually inspected.
- No page-level horizontal overflow at 360-pixel phone width (including expanded Advanced settings) and 1,280-pixel desktop width.
- Working phone and desktop/pending screenshots retained locally in ignored `artifacts/`.
- Production build smoke-tested separately: initial Balanced generation and Very balanced generation work using the compiled worker.

## Remaining release gates

- Actual iPhone Safari and Android Chrome testing, including pinch zoom, download behavior, lower-end-device generation latency, and accessibility.
- Desktop Safari, Firefox, and Edge checks.
- Formal contrast/screen-reader review and the planned three-person physical setup test.
- User acceptance of the implemented calibration and provisional parameters.
- Hosting selected: GitHub Pages. The user authorized committing, pushing, and publishing an initial beta on October 21, 2026. The manual Pages workflow runs tests and a production build before deployment.

The initial beta is authorized for commit/push and publication. The remaining checks above apply before treating it as a fully validated release.
