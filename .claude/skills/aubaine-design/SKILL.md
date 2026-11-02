---
name: aubaine-design
author: Kori
version: 1.0.0
last_updated: 2026-10-31
license: MIT
description: Design, prototype, review and ship how Aubaine's site looks, in its art direction of Persona 5, Deadlock and the League of Legends client translated into web pages, with the owner's design rulings, the spec of the approved pieces, the reference research and the measuring tools. Use for any visual change to the site, even a small one, such as a page layout or a hub, a card, a stage, a plate, a mark or a pictogram, colour, type, motion, a hover or lit state, a layout proposal or a prototype, a crop or render check, or a screenshot review, and whenever the owner reacts to how something looks. Use it rather than a generic frontend or design skill for this site.
argument-hint: [page or piece, and what should change]
---

# Aubaine Design

## Which skill does what

| Work | Skill |
| --- | --- |
| How a page or a piece looks, moves and is laid out, and the proof that it fits | this skill |
| The words on it: interface strings, chapters, definitions, policies | `aubaine-prose` |
| An entry's data, its rule text and its English overlay | `aubaine-content` |
| A lore page | `aubaine-lore` |
| A decision record | `aubaine-adr` |
| A commit | `aubaine-commit`, only on « commit » |

## Authority

- **The code is the source of truth** for every value. `references/approved-pieces.md` records the
  approved pieces value by value; where it and the code disagree, the code is right and the reference is
  corrected.
- **`DESIGN.md`**, at the repository root, documents the look for a reader: principles, colours, type,
  layout, depth, shapes, components, motion, pictures and accessibility. Keep it true after a change. A
  design that breaks one of its principles needs a new decision from the owner, recorded in
  `references/rulings.md`.
- **`references/rulings.md`** holds the owner's rulings, each dated: a correction or a rejection in the
  owner's own words, which carry its reason; an approval as what was approved, with its values and its
  capture. They bind every design; one is reopened only for a new reason, and lost context is not one.
- A rule under `.claude/rules/` wins over this file; read the `frontend/` rules that apply, such as
  `frontend/accessibility.md`.
- Colours and pictograms of kinds and book categories have one source, `KIND_MARKS` and
  `CATEGORY_MARKS` in `src/lib/game/kind-marks.ts`; read them there, never copy them.
- Hard-to-reverse choices are recorded in `docs/adr/`; this skill's own shape is in
  `docs/adr/0064-design-work-runs-through-the-aubaine-design-skill.md`.

## Gotchas

- The gated prototype page builds only with `AUBAINE_PROTOTYPE=1 pnpm build`; a plain build drops it.
- After a plugin edit or a new data file, run `pnpm astro sync --force` before building: the content cache
  ignores plugin code.
- Serve a preview of your own (`pnpm exec astro preview --port 4322 --ignore-lock`) and never stop one
  you did not start; another session may share the working tree.
- Measure with reduced motion: an arrival scales pieces for half a second, and a box read then overlaps
  its neighbour.
- `getBoundingClientRect()` returns a transformed piece's axis-aligned box, not its corners; measure
  rotated or skewed pieces with `pnpm design:audit`, which reads corner probes (an SVG element by its
  box, so audit the HTML element that wraps a rotated SVG).
- Inside `writing-mode: vertical-rl`, `cqi` resolves on the vertical axis; size widths there with `cqw`.
- A px length on an element inside an SVG `viewBox` is in user units: `translate: 7px` on a hexagon with a
  100-unit box drawn 34 px wide moves it 2.4 px. Measure it before you write it down.
- `emulateMedia({ media: 'print' })` never paginates, so it cannot show a torn entry; check page breaks in a
  real `page.pdf()`, and with `printBackground: true` under the dark theme.
- Headless Chromium draws WebGL on SwiftShader, which the stage refuses; capture the living stage with
  Playwright's `channel: 'chromium'`.
- TypeScript skips files under `.claude/`; a script this skill needs lives in `tools/design/`.

## The approved pieces

The character sheet (`CharacterHero.astro`), the select screen (`SelectScreen.astro`), the Codex plate
menu (`PlateMenu.astro`) and the Livres contents (`SommaireSpread.astro`) are approved; `references/approved-pieces.md` lists their files, routes and
guard tests, and `assets/approved/` shows them. They set the direction: build new pieces from their
vocabulary and reuse their components, but never copy one to change it, and never touch them unless the
owner asks. Before and after any change near them, compare their renders (`references/measuring.md`).

## The run

The main agent orchestrates, runs every command, and is the only one that talks to the owner. A
subagent gets the brief, the files in scope and what earlier steps found.

1. **Intake.** Restate the request. Name the page type and its view (read
   `src/components/views/View.astro`, never assume), the approved pieces within reach, the rulings that
   apply, and what the owner already rejected for this surface (`references/rulings.md`).
2. **Research.** For any new layout, `aubaine-design-researcher` finds the reference games' in-game
   screens of the same kind and the makers' words, and returns the addresses of the pictures to capture.
   Save those pictures into the scratchpad and give them back to it to describe; merge its sourced rows
   into the dossiers (`references/research.md`). Skip this step only for a small change to an existing
   piece.
3. **Directions.** Propose directions that each come from a named in-game screen and differ in
   structure, not only in dress. `aubaine-design-critic` judges each one through each of its three lenses
   (the owner's rulings; web usability and accessibility; build cost and the approved pieces' safety).
   Drop what it shows broken; keep what survives.
4. **C0, the owner chooses what to build.** Ask the questions the repository does not settle, in one
   message: which directions, which pages, which objects of Aubaine's world. Build nothing on a guess.
5. **Prototype.** Build on the gated page, never on a live route (`references/prototypes.md`), through
   the real data and the door contract, in every state and both languages.
6. **Measure.** `pnpm design:audit` with every piece against its frame, swept over every pointed state,
   at the seven sizes; contrast; sideways scroll; the approved pages against their captures with
   `pnpm design:pixels` (`references/measuring.md`). Fix what it flags, then make one refinement pass
   that polishes what exists rather than adding pieces, before showing.
7. **C1, the live review**, as `references/prototypes.md` § The live review runs it; the owner's verdict
   is recorded as `references/rulings.md` asks.
8. **Ship the pick**, as `references/prototypes.md` § Shipping a pick runs it.
9. **Verify** as `.claude/CLAUDE.md` asks, then report the links, the tables and the open questions.
   Commit only on « commit ».

## Refusals

- Do not touch the approved pieces without a request, and do not copy one to change it.
- Do not take a layout from a game's marketing site, or a name, a label, a joke or a mechanic from any
  game.
- Do not dress a site page as CADRAN, the Atlas boot's screen.
- Do not make a hub the select screen, or a grid of its framed cards.
- Do not add a picture or a video made for one page, and do not put a sharp painting on a hub.
- Do not let the page place the pieces: every piece has a stated place on its shape, measured.
- Do not show a design as stills alone, and do not claim a fit or a fix without its measurement.
- Do not keep a screenshot of a rejected design; record the rejection in words.
- Do not delete art; move a picture nothing uses to `data/media/unassigned/`.
- Do not commit other studios' pictures; link them.
- Do not claim a check passed unless it ran.

## References

| File | Read it |
| --- | --- |
| `references/rulings.md` | At intake, every time: what the owner decided, rejected and approved |
| `references/approved-pieces.md` | Before reusing, matching or touching an approved piece, and for the door contract |
| `references/prototypes.md` | Before building a prototype, reviewing it with the owner, shipping it, or reusing a kept layout |
| `references/measuring.md` | Before claiming that anything fits, is unchanged or reads |
| `references/research.md` | Before proposing a new layout, with the dossiers `persona-5.md`, `deadlock.md` and `hextech.md` |
| `references/web-platform.md` | When a piece relies on transforms, masks, container units, `:has()`, popovers or the stage |
| `references/accessibility.md` | For any interactive piece, any text over a picture, any motion |
| `assets/approved/` | To see the accepted pieces: open a capture with the Read tool |

## Subagents

| Agent | Job | Tools |
| --- | --- | --- |
| `aubaine-design-researcher` | Finds and reads in-game screens and the makers' words; returns sourced rows | Read, Grep, Glob, WebFetch, WebSearch |
| `aubaine-design-critic` | Judges a direction or a prototype through one lens; returns findings | Read, Grep, Glob |

Neither edits a file or runs a command: the main agent captures pictures, runs the tools and writes.

## Maintaining this skill

- A design correction or rejection from the owner goes into `references/rulings.md`, dated and quoted, in
  the change that applies it. Check a quote against the stored conversations with a search that tolerates
  typos, since the owner's own spelling defeats an exact search, and count as the owner's words only what
  they typed or picked in an answer, never a tool's output that repeats them.
- An approval goes into `references/rulings.md` as what was approved, never as the owner's praise: a
  description, its values or the file that holds them, a capture in `assets/approved/` (a screenshot, or
  for a motion a film strip from `pnpm design:transit --film`), and the date. Cite the capture from
  `references/approved-pieces.md` (`references/measuring.md`, Capture an accepted piece).
- After editing the description, check it against `evals/trigger-queries.json`: the queries marked
  `should_trigger` load this skill, and the near misses load another one or none.
- `claude plugin validate .claude/skills` and `claude plugin validate .claude/agents` check the
  frontmatter.
