---
paths:
  - "src/**"
  - "DESIGN.md"
---

# Kind Marks

- `KIND_MARKS` in `src/lib/game/kind-marks.ts` gives each kind of content its one colour and one pictogram, as Compétences takes `game-icons:spell-book`. Read it for the current set; never copy it.
- The same file marks each book category in `CATEGORY_MARKS` and the archives in `ARCHIVES_MARK`, inked with `categoryInk` and `archivesInk`. Every rule below holds for them.
- Wherever the interface marks a kind of content with a colour or a pictogram (a menu, a source button, a keyword, a filter), take both from `KIND_MARKS`. Never draw another pictogram or colour for the same kind.
- Ink a mark on night with `kindInk(kind)`, which lifts the colour until it reads.
- A kind mark marks the kind. An entry keeps its own colour, as a tree keeps its domains and a state its ink.
- Colour never carries the meaning alone: the kind's name stays beside its mark.
- A new kind of content gets its mark in the same change. The colour and the pictogram are the owner's pick from rendered previews, and changing one is a product decision.
