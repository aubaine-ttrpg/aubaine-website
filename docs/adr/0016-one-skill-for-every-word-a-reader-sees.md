# ADR: One skill for every word a reader sees, and a test owns the decidable part

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-23
**Revised:** 2026-09-24, the tooltip definitions in `RULE_TERMS` and in `data/meta/tags.json` become prose surfaces (0020, addendum in Decision 1)
**Deciders:** Kori
**Scope:** Which prose surfaces one editorial skill governs, where its craft guidance comes from, and
which prose defects a test refuses rather than a reader. Amends 0008, whose rule and skill boundary
it keeps. Does not cover the data model (0002), the overlay mechanism (0003), the schema contract
(0004), or the policy collection itself (0015), whose files it inherits as a surface.

---

## Context

0008 put the editorial corpus in a skill named `aubaine-content` and scoped it to `data/`. That
guidance is strong on the game: registers, keyword rendering, canon authority, the two locales, rule
text clarity. It is thin on prose craft. Measured against the working tree before this change,
nothing in the repository refused the antithesis construction, and no French formulaic lexicon
existed anywhere, in a project whose canonical authoring language is French.

Three surfaces were nobody's. `src/lib/i18n/strings.ts` carries the interface copy in both locales
and sits in `editorial-style.md`'s `paths:`, but no skill claimed it. `src/content/policies/`, which
0015 created, arrived with no editorial register: opening one of its eight files loaded metadata and
linking guidance and nothing about how to write. `src/lib/game/pages.ts` composes every title and
meta description out of both.

0008 Decision 1 also left a caveat open since 2026-09-20: nothing validates prose. That was still
true. `pnpm lint` is Biome and does not read Markdown, and the dash scan in
`tests/data/integrity.test.ts` covered `src`, `tools`, `tests` and `docs` and nothing about how the
text reads.

The owner rates the editorial apparatus in the sibling repository `athletis-corporate-website` above
what is here and asked for it as the source of truth, retranslated. That repository sells coaching
software, so a third of it is commerce and has no referent in a wiki. The rest transfers, because
the failure it was built to fight is the same one Aubaine faces at 275 skills across 23 trees: a
library that reads as though one generator made it.

---

## Decision 1: One skill, `aubaine-prose`, over every reader facing surface

### Decision

- `.claude/skills/aubaine-content/` becomes `.claude/skills/aubaine-prose/`.
- Its scope is every text a reader sees: `data/`, `src/lib/i18n/strings.ts`,
  `src/content/policies/`, and the titles and descriptions composed in `src/lib/game/pages.ts`.
- The boundary 0008 Decision 1 drew is unchanged. Rules hold what must be true before a file is
  opened and must match real paths; the skill holds voice, register, locale and the checklists, and
  loads on demand. `.claude/rules/content/` still holds nine files.
- `.claude/rules/content/editorial-style.md` gains `src/content/policies/**/*.md`, and its register
  list grows from three to five.
- No existing text is rewritten by this change beyond the two defects in Decision 3.

### Rationale

- The voice is one voice. `editorial-style.md` describes it once and it does not change between an
  item's flavour line and the first sentence of the privacy page. Two skills would carry that
  description twice, and `.claude/rules/meta/rule-maintenance.md` calls a copied list "a defect with
  a delay on it". A copied voice is the same defect with the same delay.
- The surfaces are not separable in the output. `src/lib/game/pages.ts` builds a tree's description
  from interface strings and a count, and a node's from a skill's own rule text through
  `flattenText(description, 160)`. One rendered sentence crosses the boundary a split would draw.
- The name had to move with the scope. `content` is what this repository calls `data/`:
  `src/content.config.ts` declares the collections and `.claude/rules/content/` is nine files about
  them. A skill called `aubaine-content` that also governed interface labels would be read as
  `data/` only.
- The policy pages had no owner. Verified by expanding every `paths:` glob under
  `.claude/rules/content/`: none matched `src/content/policies/`, so the editorial rule had never
  once loaded while one was being written, which is the exact condition 0008 Decision 1 exists to
  prevent.

### Alternatives considered

- **Two skills, one for the codex and one for the site copy**: rejected on the owner's instruction,
  and the instruction has a cost behind it. The voice, the refused phrasings and the locale
  conventions are identical on both sides, so the second skill would be a copy of the first minus
  the runbook routing. Reopens if the interface ever adopts a register that contradicts the codex's.
- **Keep the name and widen the scope silently**: rejected. `description` in `SKILL.md` is what a
  harness matches on, and it would have named a quarter of what the skill governs.
- **Move the widened guidance into `.claude/rules/content/` as always loaded rules, the way the
  sibling repository structures its own**: rejected by the owner, and it is the question 0008
  Decision 1 already settled. Voice and checklists do not need to sit in context during unrelated
  work. Reopens only if the harness loading behaviour 0008 recorded as observed turns out to differ.

### Caveats

- The skill names a TypeScript module, `src/lib/game/pages.ts`, as a prose surface. It is the only
  one where text is composed rather than written, and editing prose there is a bug rather than an
  edit.

### Addendum (2026-09-24): the tooltip definitions are prose surfaces

- The `definition` of each entry in `RULE_TERMS` in `src/lib/game/build.ts` is reader facing text,
  so `aubaine-prose` governs it. It is the second TypeScript surface after `src/lib/game/pages.ts`,
  and the only one where prose is written in code rather than composed there (0020 Decision 1).
- The definitions in `data/meta/tags.json`, `data/meta/characteristics.json` and
  `data/meta/aptitudes.json` sit under `data/` and were already in scope.

---

## Decision 2: The craft is ported from the sibling repository, retranslated, and the refused list has one home

### Decision

- The six editorial standards in `athletis-corporate-website/.claude/rules/editorial/` and the tell
  inventory in its `seo-geo-playbook.md` are ported as references, retranslated for a codex.
- `anti-template.md` is deleted and folded whole into `references/ai-tells.md`.
- Four new references carry the ported material: `ai-tells.md`, `claims-and-evidence.md`,
  `one-entry-one-job.md`, `revising-an-entry.md`. A fifth, `site-copy.md`, carries the widened
  scope. The skill holds eighteen references.
- The refused phrasings live in one place, `BANNED_PHRASES` in `tests/data/integrity.test.ts`, 43
  entries across both languages. `editorial-style.md`, `flavor.md`, `reference-voice.md` and
  `style-checklist.md` name it and no longer enumerate members.
- Three things do not come across: the requirement to cite an external source, the detector
  vocabulary, and the commerce layer.

### Rationale

- The lists had already drifted, which is the argument for a single home rather than a tidier one.
  Before this change `editorial-style.md` enumerated 16 formulas and `anti-template.md` 14, sharing
  only 12; fantasy filler sat in both `editorial-style.md` and `flavor.md`; marketing diction sat in
  `reference-voice.md`. Four copies, two already disagreeing.
- Putting the membership in the test is the move 0015 Decision 2 already made when the icon and font
  tables went into `src/lib/rights/attribution.ts` and the document kept the reasoning. It is also
  the only artefact that cannot silently diverge from what is enforced.
- The external sourcing rule is the one piece that cannot be adapted. `evidence-and-claims` requires
  a primary source linked inline; 0008 Decision 3 states the codex cites nothing and no schema
  carries a provenance field. `claims-and-evidence.md` therefore inverts it: the five supports are a
  schema field, a runbook, a sibling entry, a chapter, and a controlled vocabulary.
- The detector framing is refused by a standing rule. `.claude/rules/core/text-integrity.md` forbids
  mentioning AI detection or humanization in published copy, and the source's closing advice is to
  write so a draft does not need cleaning later. The three self check questions carry; the rubric
  sources and the framing do not.
- Folding rather than stacking was forced by overlap. Both files answer "does this read as
  generated", and two files would have wanted the same list, the same rhythm rules and the same
  template warning, recreating the defect this decision removes.

### Alternatives considered

- **Port the commerce layer too, adapted**: rejected. SERP research, publishing cadence, money
  pages, hero image prompts, bylines and the legal review gate have no referent in a wiki with no
  blog, no funnel and no external citation. Reopens only if the site gains a marketing surface.
- **Keep `anti-template.md` beside a new file**: rejected, one topic per file, and the two are one
  topic.
- **Also import the prose corpus in `../aubaine.io`**: rejected on the owner's instruction that its
  quality is not trusted. It was not read and nothing from it is present. Reopens if that corpus is
  reviewed and endorsed.
- **Leave the four enumerations in place and add a precedence note**: rejected.
  `rule-maintenance.md` says to remove the duplicate rather than explain which one wins.

### Caveats

- Nothing validates the skill's own reference files. The dash scan covers `src`, `tools`, `tests`
  and `docs`, not `.claude/`, so this corpus can still go stale without a check failing. That half
  of the 0008 caveat stays open.

---

## Decision 3: A prose check ships only when it is decidable from the string

### Decision

- `tests/data/integrity.test.ts` gains five checks, run by `pnpm data:check`: no refused phrase, no
  antithesis outside a book chapter, emphasis in rule text as three asterisks only, no en dash under
  `data/` with the em dash confined to a whole stat value, and the straight apostrophe with no fixed
  space under `data/`.
- Left to a reader: rhythm, metronomic closers, whether variation comes from the subject, whether an
  entry carries a detail only it could carry, register, and keyword capitalization.
- The antithesis is scoped by surface. It fails in an entry, an interface string and a policy page,
  and is permitted in `data/books/**/*.md`.
- Two defects the checks surfaced are fixed here.

### Rationale

- The line is drawn at false positives, because these assertions gate `pnpm verify` and
  `CONTRIBUTING.md` forbids weakening or skipping a failing check to land a commit. A check that
  fires on prose a person judged good puts a contributor between that rule and their work.
- Every enforced check was measured against the corpus before being written. All 43 refused phrases
  score zero across `data/`, `src/content/policies/` and `strings.ts`, so the list ships as a hard
  failure with no content churn.
- The antithesis had to be paired and scoped, not banned outright. `n'est pas` alone occurs 22 times
  under `data/` as ordinary French negation; a bare ban would have fired on all of them and pushed
  authors toward worse French. The paired form occurs four times, all four in book chapters, both
  locales of two sentences, and both do definitional work: `Un Niveau n'est pas une nouvelle
  Compétence : c'est la même, qui fait davantage.` is the clearest available sentence for that idea.
  In a sales blog the construction is always a punch line; in a rules corpus it is also how a
  confusion about what a mechanic is gets resolved.
- Keyword capitalization stays unchecked, and the reason is now recorded rather than assumed. The
  keywords are homographs of ordinary French words and verb forms, so `une attaque` for a generic
  attack and `gelée` as a past participle are correct French that any case sensitive scan calls a
  defect.

### Alternatives considered

- **Extend the existing dash scan to `data/` wholesale**: rejected by 0008 Decision 4 on the grounds
  that 56 files would fail, and that remains true of the wholesale form. The precise form was
  measured instead: `data/` holds 110 U+2014 and 0 U+2013, and all 110 are exactly equal to the
  whole string, under `range` and `duration` only. Banning U+2013 outright and permitting U+2014
  only as a whole value passes at 100% today and cannot admit a dash into a sentence, because a
  sentence is never one character long.
- **Require the key to be `range` or `duration` as well**: rejected. `keywords-and-markup.md` writes
  "a stat field such as `range` or `duration`", deliberately open, and the whole value form already
  gives the safety.
- **A model driven editorial review in CI**: rejected. `.claude/rules/quality/testing.md` requires
  deterministic tests. Reopens as a reporting job that never fails a build.
- **Ship the checks and defer the two fixes**: rejected. A check that is known to fail is either
  disabled or it blocks, and both are worse than a two line fix.

### Caveats

- The asterisk check is the one that found a live defect rather than preventing a future one.
  `MARKUP` in `src/lib/game/richtext.ts` parses `***` and nothing else, so 24 runs of two asterisks
  across seven files under `data/equipment/items/` were reaching the page as literal characters,
  confirmed by 12 occurrences of strings such as `**3 mètres**` in
  `dist/fr/equipement/index.html`. They are now `***`. The defect had shipped in both locales.
- `data/books/recueil-des-planches/book.json` carried one curly apostrophe, the only one under
  `data/`. It is now straight.
- The checks read `data/`, the interface strings and the policy pages. They do not reach what
  `pages.ts` composes, which only a rendered page shows.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Prose skill | One voice over every reader facing surface, loaded on demand | `.claude/skills/aubaine-prose/`, eighteen references |
| Widened scope | Codex, interface strings, policy pages, composed heads | `data/`, `src/lib/i18n/strings.ts`, `src/content/policies/`, `src/lib/game/pages.ts` |
| Ported craft | Retranslated from the sibling repository, folded not stacked | `references/ai-tells.md` and three siblings |
| Refused phrasings | One list, enforced, named by the rules and the skill | `BANNED_PHRASES` in `tests/data/integrity.test.ts` |
| Machine checked | Phrases, antithesis, asterisk runs, dashes, typography | `pnpm data:check` |
| Human judged | Rhythm, specificity, register, keyword capitalization | `references/ai-tells.md`, the checklists |
