# v0.2 verification — 2026-10-05 KST

- Production build: 20 static pages plus 404, sitemap, robots. `npm run build` passes.
- `npm test`: 11 tests pass. 78 unique cards (22 major + four suits ×14), every position and orientation, 200 complete shuffles, unbiased random rejection, daily persistence/corruption/date expiry, same-topic position variation, middle-card synthesis variation, unique SEO, every internal static link and all five artwork mappings.
- Browser: home → reunion → five picks → result → related feelings → four picks → result.
- Browser direct routes: love (5), breakup (5), contact (3), reunion timing (3), YES/NO (1,2,3), today (1) completed. Today remained Cups Page upright after reload.
- Guide hub → reunion guide → reunion reading navigated successfully. Missing URL displayed custom 404 page.
- Desktop home, deck and report visually inspected.
- 390px iframe production-component fixture tested all five prototype images, flip, summary, and detail. 320px home also inspected. Document scrollWidth = clientWidth (375 and 305 after scrollbar). Card summaries intentionally scroll horizontally inside their own region.
- Local deterministic artwork fixture changes only shuffled order for QA; removed by final clean build, never part of production source.
- Final engine changes rechecked in browser reunion result. App-origin error logs empty. Browser-extension metadata errors excluded.
- Shell HTTP probing was unavailable from execution workspace; browser direct navigation and generated route/link validation were used. Custom 404 UI verified, production HTTP status not independently measured.
- Five-asset contact sheet inspected: consistent palette, denser Moon/Sun detail at small size. 73 further generated illustrations intentionally not produced; see ARTWORK.md.
- WebP assets have explicit dimensions, responsive 192/384 variants, lazy loading. No images in initial home download or unrevealed deck. No third-party fonts/framework/runtime AI scripts.

## Limits

No physical-device or screen-reader testing, no Lighthouse/CWV field data, and no 78-illustration completeness claim. Semantic summaries are deterministic templates; ongoing human editorial review can improve variation. Optional existing WebMCP hook is feature-detected; browser did not expose it.
