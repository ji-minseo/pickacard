# Pick a Card artwork — v0.2

## Production assets

Built-in imagegen was used, not Higgsfield. No generation API exists in the deployed website. Five original illustrations are in `public/artwork/`: fool, lovers, tower, moon, sun, each in 192×288 and 384×576 WebP.

Shared prompt: portrait 2:3 illustration only; contemporary editorial fine-line engraving; warm ivory paper, charcoal hatching, burgundy, dusty rose, restrained ochre; negative space; no typography, numbers, frames, glossy fantasy, realism, anime, horror.

Subjects: traveler with bundle and small dog; two figures joining hands beside branching garden path; lightning-struck tower; crescent moon and path between two towers; radiant sun over flowering garden.

## Prototype decision

Inspected five together and in the production card components, including flip, summary and detail. Color and line language are coherent. The Moon and Sun have greater landscape density than Fool and Tower. At mobile selection size fine hatching loses definition. Do not extrapolate these five to 73 more without simplifying the illustration specification first.

Five selected illustrations are integrated. The other 73 cards use the shared framed typographic/suit design, not generated illustration. All 78 are implemented as data and drawable cards; this is not a 78-illustration deck. Court rank labels distinguish Page/Knight/Queen/King.

## Next illustration specification

Keep the five-ink palette; use one dominant recognizable symbol; reduce lower-half landscape detail and hatching; maintain 15% internal negative space. Names, ranks, position and direction remain HTML. Evaluate at 50px flip, 109px summary and 90px detail before extending.
