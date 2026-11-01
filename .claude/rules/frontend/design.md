---
paths:
  - "src/components/**/*.astro"
  - "src/styles/**/*.css"
  - "src/scripts/art-effect/**/*"
  - "src/scripts/select-screen.ts"
  - "src/scripts/door-light.ts"
  - "src/pages/prototype/**/*"
---

# Art Direction

- Design work goes through the `aubaine-design` skill; its description says when to load it.
  `DESIGN.md` at the repository root documents the look; keep it true after a change.
- The approved pieces, such as the character sheet (`CharacterHero.astro`), are listed with their routes
  and guard tests in `.claude/skills/aubaine-design/references/approved-pieces.md`. Read it before
  touching a page that uses one, and never change an approved piece without the owner's request.
- A page's layout is read from `src/components/views/View.astro`, never assumed from the kind of page.
- Build a new sheet from `CharacterSheet` in `src/lib/game/character-sheet.ts` and the pieces
  `CharacterHero.astro` composes, such as `SheetHead.astro`; read them for the set. Do not render a field
  of `CharacterSheet` a second way; a smaller place takes a piece at its `preview` size.
