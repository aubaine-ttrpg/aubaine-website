---
paths:
  - "src/components/**/*.astro"
  - "src/styles/**/*.css"
  - "src/scripts/art-effect/**/*"
  - "src/scripts/select-screen.ts"
---

# Art Direction

- `DESIGN.md` at the repository root owns the art direction. Read it before designing or restyling a
  page, a card or a stage, and follow it rather than a copy of it.
- A page that opens one entry uses the character sheet (`CharacterHero.astro`). The Arbres and Espèces
  indexes use the select screen (`SelectScreen.astro`); the Codex and Livres hubs keep their card grid
  (`Cards.astro`). Do not invent a third header for any of them.
- Build a new sheet from `src/lib/game/character-sheet.ts` and its pieces (`SheetHead.astro`,
  `SheetBody.astro`, `RankProfile.astro`, `TraitPlates.astro`). Do not render an entry's kind, name,
  stickers, profile or traits a second way; a smaller place takes a piece at its `preview` size.
- A header never repeats what the list below it already shows.
- Never add a picture or a video made only for one page. Pictures come from the game's own covers,
  emblems, heraldry and icons.
