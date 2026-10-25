# ADR: A Compétence may spend Déplacement, and a recipe may require Types

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-25
**Deciders:** Kori
**Scope:** The `movement` cost on a skill and its pill; the new base skills Se relever and Sauter
that first use it; the crafting coverage rule and the `craft.required` field on a recipe; the three
loot rule terms and their shared colour. Amends 0038 Decision 3 (addendum there). Defers again the
move of recipes to Type keys that 0032 Decision 1 reopens with this change. Builds on 0052 (a stat
of a skill is a field, never a sentence) and 0057 (a Compétence pays by its Rang).

---

## Context

The base skills predated the d20, the formulary and the keyword rulings, and the owner reworked them
on 2026-10-25. Standing up was a rule in prose in three places (`data/states/a-terre.json`,
`10-le-combat.md` § Se relever, `11-degats-et-soins.md` § Relever quelqu'un), each restating its cost
as half the Vitesse. The owner asked for a Se relever action and a jump that spend Déplacement, shown
as a cost of its own. The same rework found the crafting rule too strict. It demanded a material for
each Type a recipe lists, and it counted a material for one Type only. Recipes also had no way to say
that a Type is obligatory.

---

## Decision 1: Déplacement is a cost field, printed as a blue boot pill

### Decision

- A skill may carry `movement` (`src/lib/game/schema.ts`), after `life`:
  - `"half"`: the creature spends half its Vitesse, printed « ½ Vitesse » / « ½ Speed », so it cannot read as half of the Déplacement left;
  - `{ "atLeast": 1.5 }`: it spends at least that distance, in steps of 1,5 m, printed « 1,5 m+ ».
- It is a machine value, so no overlay translates it.
- The pill uses the icon of the Déplacement rule term (`game-icons/walking-boot`, `src/lib/game/build.ts`) and its label as the icon's accessible name.
- It is printed in blue, `#1b5a9e` with `#eef5fd` text, hard coded in `src/styles/entries.css` beside the karma and life pills. The metre unit escapes the pills' uppercase.
- The cost facet of the skills index gains a `movement` value (`src/lib/game/browse-entries.ts`).
- The balance report prints it (`tools/balance/report.ts`).
- Rule text never restates it (`formulary.md` § movement-cost).
- First users:
  - **Se relever** (`RELEVE-001`): no activation, `"half"`. The À terre state now points at it instead of restating the cost.
  - **Sauter** (`SAUTER-001`): 1 Action Bonus and `{ "atLeast": 1.5 }`. The jump spends as much Déplacement as its length, up to 1,5 m per point of Force and at least 1,5 m, with a height of up to half the length.

### Rationale

- A cost the player pays to play a Compétence belongs on the stat line with the others. A field is how 0052 handled `limit`, and keyword-logic.md § What the writer does not control lists the costs as fields.
- The two values are the ones the rules need today. Standing costs half the Vitesse in all three texts that state it. The jump spends its own length, which the SRD also does: « la distance couverte par le saut est décomptée normalement de votre déplacement », SRD 5.2.1 FR p.199, `tmp/srd/FR_SRD_CC_v5.2.1.pdf`.
- The owner chose the SRD's model over a flat cost at the plan checkpoint. Bond sauvage (`data/skills/BONSAU-001.json`) charges 2 Énergie for a 6 m leap that does not count against Déplacement. A free base jump that spent less than its length would take that job for nothing.
- Pill colours are already independent of keyword colours. The Énergie keyword is `--term-res` purple while its pill is gold (`src/styles/entries.css`, `src/styles/tokens.css`). So the pill can be blue as the owner asked, while the Déplacement keyword keeps `--term-move`.
- The text on the pill reaches 6.4:1 against its background, computed with the WCAG relative luminance formula.

### Alternatives considered

- **A flat cost, as in Baldur's Gate 3**: per bg3.wiki, a secondary source not checked against the game, the game charges a flat 3 m for a jump. Rejected by the owner, for the overlap with Bond sauvage above. Reopens if Sauter proves too weak at the table.
- **Recolour `--term-move` blue**: rejected. It also recolours Vitesse and Terrain difficile, and no pill matches its keyword today. Reopens if pills move to keyword colours.
- **A free string for the cost, translated in the overlay**: rejected. A machine value cannot drift between locales and needs no overlay key.

### Caveats

- `movement` does not count as the payment an active skill owes: the balance tool's zero-resource flag ignores it, and `docs/runbooks/add-a-skill.md` says so. The approved plan said it would count. The owner ruled it does not, on 2026-10-25 (« Yes it doesn't »): it spends the turn's Déplacement the way an activation spends the Action, while the payments of `balance.md` are pools, limits and long activations.
- The printed booklets show neither the pill nor the two new skills until `pnpm pdf` runs again.

---

## Decision 2: A recipe accepts any material that carries one of its Types, and may require some

### Decision

- **Fabriquer**: commit as many materials as you want. Each must carry at least one of the Types the recipe lists, and their Valeurs de matière must add up to the cost or more.
- **Réparer**: the same, against half the cost, rounded up, as 0038 decided.
- A recipe may list `craft.required`, Types taken from `craft.materials`. Each must be carried by at least one committed material, and one material may carry several. The schema refuses a required Type that the recipe does not accept, and refuses a repeat.
- `tests/data/integrity.test.ts` checks both locales, because an overlay may translate `materials`.
- « A material counts for only one of its Types » is removed from the skills, the material schema, the runbooks, chapter 07 and the equipment guide.
- The recipe box prints a required Type in bold, followed by « (obligatoire) » / « (required) » (`src/components/primitives/ItemEntry.astro`, through `craftMaterials` in `src/lib/game/derive.ts`).
- No item uses `required` yet.

### Rationale

- The owner's ruling, 2026-10-25: « you must add as much materials as you want as long as they have at least one type indicated from the recipe and adds up to at least the value of craft. that's it [...] mandatory materials MUST be used ».
- The owner kept Réparer at half the cost at the plan checkpoint, for the reason 0038 gives.
- With every listed Type optional, the one-Type clause only guarded coverage. Coverage now matters for required Types alone, and there the simplest rule is that a material carrying a Type supplies it.

### Alternatives considered

- **Move recipes to Type keys now**: 0032 reopens this with the next change to the recipe schema, which this is. Rejected again to keep the change scoped. `required` is additive, while moving to keys rewrites all 39 recipes. The label check in `tests/data/integrity.test.ts` still keeps recipe and vocabulary in step. Reopens when an item first uses `required`, or when the English recipe boxes are fixed: they print French Type names today, because no item overlay translates `materials`.
- **A required Type as a flag on each entry of `materials`**: rejected. Every existing recipe would change shape for a field no item uses yet.

---

## Decision 3: Dé de butin, Table de butin and Occasion de butin are rule terms with one colour

### Decision

- Three entries in `RULE_TERMS` (`src/lib/game/build.ts`):
  - `{{occasion-de-butin}}` « Occasion de butin » / « Loot Opportunity »: icon `game-icons/open-treasure-chest`;
  - `{{de-de-butin}}` « Dé de butin » / « Loot Die »: icon `game-icons/rolling-dice-cup`;
  - `{{table-de-butin}}` « Table de butin » / « Loot Table »: icon `game-icons/scroll-unfurled`.
- They share `--term-loot`, a walnut brown: `#b0805f` dark, `#6e4429` light and print (`src/styles/tokens.css`).
- The English names are the ones chapter 07 already printed.

### Rationale

- Each word names a rule of chapter 07 that plain prose does not resolve, which is the keyword test of keyword-logic.md.
- The owner asked for all three to share one colour, and chose the icons and the brown from rendered previews.
- The brown passes the contrast test in `tests/data/integrity.test.ts`: 5.9:1 on the dark page, 7.7:1 on the light page.

### Alternatives considered

- **Dé de butin alone**: the owner's first request. Widened by the owner to all three at the checkpoint.
- **A colour per term**: rejected by the owner.
