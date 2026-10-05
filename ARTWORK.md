# Pick a Card artwork — release polish

Built-in ImageGen; no Higgsfield or runtime generation. All 78 cards now have original artwork. The five approved anchors (Fool, Lovers, Tower, Moon, Sun) were simplified for mobile: larger dominant subjects, reduced flowers, folds, distant scenery and hatching; ivory/burgundy/rose/ochre direction preserved.

Prototype gate passed in actual production components at mobile selection/flip, 109px summary and 90px detail (artwork interiors 93/74px). The specification was frozen in CARD_ART_SPECIFICATION.md before making the remaining 73. Names, Roman numerals, ranks and orientation are HTML; no generated typography.

Full 78-card contact sheets: docs/artwork/deck-contact-100.jpg and deck-contact-50.jpg. Reviewed palette, style, line density, primary symbols, court identities, anatomy, artifacts and typography. One additional QC correction: King of Swords weapon geometry. No other final deck outlier required regeneration.

156 optimized files in public/artwork: 192×288 and 384×576 WebP, quality 83. Total 3,563,974 bytes; small set 769,190 bytes; largest file 52,012 bytes. Lazy responsive images with explicit dimensions; no whole-deck preload. Broken artwork reveals the existing suit/number fallback. Originals are outside deployed assets. Optimization writes atomically and all 156 files were decoded before release.
