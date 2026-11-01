# ADR: A page change is a view transition where the choice carries across

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-01
**Deciders:** Kori
**Scope:** What a reader sees between two pages, from the click to the settled page, and how Back
returns. Replaces the crossfade of 0012 Decision 3; the crest of that decision, and 0012 Decisions 1
and 2, stand. Does not cover what a page holds at rest, nor a piece's own arrival (0054, 0065).

---

## Context

The owner found no transition between hubs, indexes and pages: "It's just a blank screen and then
nothing else." Measured on the built site, the next page was ready about 75 ms after the click, and
the crossfade of 0012 then hid `#swup` for 18 to 19 frames, flashing `#f7f6f1` between two dark stages in
the light theme. The wait was the fade's, not the network's.

Measured against `swup` 4.10.0 and `@swup/astro` 1.8.0, read in `package.json` and the pnpm store. The
references are in `.claude/skills/aubaine-design/references/`: in Persona 5's pause menu the previous
scene stays on screen while one shape crosses it, and in League's ban phase the columns hold still while
the centre changes. No maker of the three games publishes a menu transition's duration, so every duration
here is Aubaine's own.

---

## Decision 1: Swup runs the change as a view transition

### Decision

- `native: true` and `animationClass: false` in `astro.config.mjs`. `.au-swup-page` and its fade are gone.
- `src/scripts/page-transit.ts` waits for the page and its stylesheets before the capture, so the old page
  stays on screen until the new one is live, then cross-fades the root under a still header.
- Every name exists only during a visit: `html[data-transit]` for the header and the crest, one setter for
  the flying pieces.
- A browser without view transitions, reduced motion, the Atlas (no depth), a typed search, the threshold
  and a visit inside one book or tree change page with no transition.
- A press marks its link at once (`data-pressed`), and a click that lands during the transition is held
  and replayed at its point when it ends.

### Rationale

- There is no empty frame by construction: `tools/design/transit.ts` read 0 hidden frames on every edge,
  against 18 to 19 before.
- It is the one instance's own option, verified in `swup/src/modules/navigate.ts`, so no dependency and no
  second transition system (`.claude/rules/frontend/swup.md`).
- `#swup` and `.au-stage` are never named. The hosts are opaque and groups follow paint order, so a named
  stage would hide the page or be hidden by it (`web-platform.md`, View transitions).
- The hold exists because the plan's assumption was false: with the root taking part, a real mouse click
  reached `<html>` only on Chromium 153, even with `::view-transition { pointer-events: none }`.

### Alternatives considered

- **`@swup/parallel-plugin`**: two live `#swup` containers, each with its stage, ids and focusable links.
  Rejected on that duplication. Reopens if view transitions cannot serve a required browser.
- **Keep the crossfade and shorten it**: an empty moment would remain. Rejected.
- **`:root { view-transition-name: none }`**, which would let clicks through: rejected because a change
  of this size then needs `#swup` named, the case above.

### Caveats

- Rendering freezes while the new page goes in. On Codex to Arbres, whose page holds 25 spotlight templates
  (391,899 bytes of HTML), the motion starts about 100 ms after the click; 53 ms of that is the layout
  forced by the a11y plugin's focus, which the first frame would pay anyway.
- A held click waits for the end of the transition, about 300 ms at most.

---

## Decision 2: What you chose becomes the next page

### Decision

- The owner's pick among four live looks: B, "B looks like what we agreed upon so it's good for me"
  (2026-11-01). A slanted cut, a paper stack and a plain fade were built and removed.
- `src/scripts/page-flight.ts`: a door's name plates fly plate by plate into the title plates of the page
  it opens, when the words match and each plate keeps its shape within 25 %. A card flies into the sheet's
  card, from the spotlight when it shows that entry and from the roster otherwise.
- A flown piece gives up its own landing, on that visit only. A direct load keeps the approved arrival.
- A piece off screen or a picture not decoded in 250 ms takes no flight. A draft card flies with its stamp,
  which the owner confirmed: "Draft cards are perfect, it's the correct behaviour".
- Where there is no piece to carry, the root cross-fades and the page's own arrivals supply the motion.

### Rationale

- The door is already named exactly as its page, and the card is the same 3:4 picture on both sides
  (`src/lib/game/hub-cards.ts`, `src/lib/game/character-sheet.ts`), so the pieces are true counterparts.
- The stage stays in the root, so the light carries across while the paper changes.

### Alternatives considered

- **The whole title as one group**: door and title wrap differently and the snapshot smears. Rejected.
- **Forbidding a flight when the plates wrap differently**: tried first. It blocked Codex to Arbres, the
  owner's own example, though each plate keeps its shape. Replaced by the shape test.

---

## Decision 3: Motion is paced to be seen, inside 400 ms

### Decision

- `--ease-travel` carries the transition, and `paceMotion` gives the flight what remains of a 400 ms budget,
  between 260 and 360 ms.
- The art effects start at `visit:end` on an animated visit, so no heavy work competes with the motion, and
  a page's first canvas appears under an ambient that fades out over 450 ms.

### Rationale

- The first timing shipped for review met its numbers and failed the reader: "i don't see any diff really,
  it seems that everything is too quick to see". On `--ease` a 300 ms flight crossed 10 % to 90 % of its
  travel in 94 ms, about five frames. On `--ease-travel` the same span takes about half the flight.
- Pacing gives light pages a longer flight and keeps the heaviest on budget: `tools/design/transit.ts` read
  378 to 392 ms on every non-book edge on Chromium; Codex to Arbres read 417 to 445 ms with a fixed flight.
- Holding the effects reduced Firefox's worst frame during a card flight from 83 to 92 ms to 50 to 58 ms,
  measured on real Firefox 158, headless, through geckodriver.

### Alternatives considered

- **A longer flight for all**: easier to see and past the budget on Codex to Arbres. Reopens if the owner
  still finds it too quick; `LONGEST_MOTION_MS` and `MOTION_BUDGET_MS` are the two numbers to change.

### Caveats

- At 4x CPU slowdown, Codex to Arbres takes about 570 to 580 ms: its first motion alone takes about 270 ms.
  Meeting 400 ms there means a lighter page, not a shorter animation.
- The 400 ms is measured on Chromium. Without a GPU in headless mode, Playwright's Firefox 155 read 390 to
  442 ms and its WebKit 26.6 read 426 to 520 ms; real Firefox 158 read 357 to 393 ms on a card flight, with
  frames up to about 130 ms in the headless builds. Safari itself was not driven.

---

## Decision 4: Livres closes like the book it is

### Decision

- From the Livres spread, an entry first sends the title and its help button off the screen; then the right
  page turns over the spine and its blank back lands on the left with the crest; then the closed book is
  thrown off the screen while the page arrives behind it. The closing is the owner's idea, "having the book
  closing itself and then having the rest arriving", and the title leaving first is the owner's correction of
  the first build: "Livres + helper on book goes out of screeen and then the book close cuz that just ugly
  the way you did it now" (2026-11-01).
- Coming back to Livres from deeper plays it in reverse: "he comes up, then opens, then title and help
  button descends" (2026-11-01). Below the spread's breakpoint there is no fold to
  close, and the page simply changes.
- The title and the help button move as Aubaine's paper does, on request: "smoother and matching our DA not
  that dumb animation we currently have that is tasteless" (2026-11-01). Leaving, the help button goes first,
  then the plate dips, peels and flies out. Arriving, the plate falls, lands past its rest, settles, and the
  help button stamps on last, as the sheet's grades do.
- `src/scripts/page-book.ts` copies the sheet into a left and a right half for the time of the transition.
  The arrivals of the next page are held 270 ms by moving their `currentTime`.
- Painted outside the animation, the pieces are pixel-identical to the open book: the blank back lies under
  the two halves, the title stays above them, and they sit on the sheet's exact fractional box.
- The pieces leave the page in the frame the last motion ends, not at `visit:end`.

### Rationale

- `SommaireSpread.astro` already draws an open book with a centre fold, so the motion states what the page
  already is. One visit in the hub's path carries a ceremony; League's rule of ceremony by value applies.
- A view transition captures one image per name, so a page that turns needs two named halves.
- An opaque book thrown away replaced a fade, which let the left page ghost through the closing back.

### Alternatives considered

- **Keep this edge inside 400 ms**: a page cannot turn and a book leave in that time and still read. The
  budget here is the 700 ms of 2026-10-30's arrival rule: it reads 570 to 677 ms on Chromium, the opening the longest.

- **Removing the pieces at `visit:end`**: Swup waits two frames after the transition (`nextTick` in
  `swup/src/modules/animatePageIn.ts`), and in those frames the owner saw "the whole left page white with the
  logo". A test counted 3 to 4 such frames on all three engines. Rejected.
- **Clearing every transition attribute when the motion ends**: tried first. The pseudo-elements still exist
  at that moment, so the rules falling away started a default animation on them and held the transition open
  about 300 ms longer. Only the pieces leave early.

### Caveats

- The flash sweep (`pnpm design:transit --flash`) reads 2 general flashes in a second on closing and 3 on
  opening, in both themes; 3 is WCAG 2.3.1's limit and not over it, because a large cream page passes over a
  dark stage. It plays once per click and never repeats on its own. Closing the book and going Back within
  about a second read 4 once, the two counted together. Other edges read 0 to 1.

---

## Decision 5: Back returns where you were

### Decision

- `window.history.scrollRestoration = 'manual'`, and the scroll is restored from memory for every Back,
  including a hash-only one.
- The spotlight and the lit door return to the entry left, the card or plates fly home if on screen, and
  the roster does not deal again. The memory is in the page's lifetime only: a fresh visit opens on the lead.
- Back with a browser's own gesture (`hasUAVisualTransition`) runs no second transition. Back during a slow
  wait renders the same page with its scroll kept, with no transition.

### Rationale

- The owner's pick among proposals, "Return where you were" (2026-11-01). The last pointed door already
  stays lit like a menu cursor.
- Automatic restoration moved the old page before the capture, and only restored the right place when the
  old page was tall enough, probed on the built site.

### Alternatives considered

- **Instant Back**: the safest, and the least like a game. Offered to the owner and not chosen.
- **Aborting Back during a slow wait**: needs Swup's internal location corrected by hand. Rejected on that
  coupling, which costs a re-render of the same page at the same scroll.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Engine | Native transition, waits, names, Back, held clicks | `src/scripts/page-transit.ts` |
| Flights | Which piece flies to which | `src/scripts/page-flight.ts` |
| Book | The closing and the opening of Livres | `src/scripts/page-book.ts`, `src/styles/transit.css` |
| Depth | Server data the classification reads | `depthFor` in `src/lib/i18n/routes.ts` |
| Proof | Behaviour on three engines | `tests/e2e/page-transit.spec.ts` |
| Measure | Frames, timing, flashes, stray frames, films | `tools/design/transit.ts` |
