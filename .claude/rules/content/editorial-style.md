---
paths:
  - "data/**/*.json"
  - "data/**/*.md"
  - "src/lib/i18n/strings.ts"
  - "src/content/policies/**/*.md"
---

# Editorial Style

French is the canonical authoring language. Write French first and well, then treat the English overlay as a second editorial surface rather than a gloss.

Write, rewrite, translate and audit this prose through the `aubaine-prose` skill. It holds the voice, the locale conventions and the checklists; this file holds what must be true before a file is opened.

## Registers

The site has five, and they must stay distinguishable.

- Rule text, meaning a skill, upgrade, or state `description` and an item, property, or set bonus `text`: precise, second person, present tense, no ornament.
- The item `description`: one or two sentences of flavor, concrete, never implying a mechanic.
- Book chapters: explanatory prose that teaches a mechanic to a player at the table.
- Interface strings in `src/lib/i18n/strings.ts`: a label names a destination, a lead is one or two sentences that also serve as the page's meta description, an error says what failed and what to do next.
- Policy pages under `src/content/policies/`: the project speaking in its own name about itself. Not codex canon, and not the codex voice.

## Voice

- Write like an editor who knows the system and the purpose of the page.
- Lead with concrete information.
- Prefer specific nouns and active verbs.
- Vary sentence length naturally.
- Keep paragraphs focused and easy to scan.
- Prefer physical detail and direct causal language over atmosphere.
- Keep claims proportional to evidence.
- One memorable detail beats five ornamental ones. If one image is enough, stop there.

## Flavor

- Anchor flavor in something usable: a visible behavior, a material, a sound, a smell, a custom, a practical consequence, a social reaction, a cost, or a trace left behind.
- Do not use flavor as decorative fog.
- Do not open every entry with scenery, and do not close every entry with a dramatic summary.
- Do not imply a property through flavor alone.

## Avoid

- Filler introductions and generic conclusions.
- Empty promotional adjectives unless a factual context justifies them.
- Formulaic openings, transitions, closers, and default fantasy filler. `BANNED_PHRASES` in `tests/data/integrity.test.ts` holds the enforced set in both languages and `pnpm data:check` fails on a hit; "delve into" is one member. Read the constant, never a copy of it, and add to it there when a new formula turns up.
- The antithesis, in either language: "ce n'est pas X, c'est Y", "it is not X, it is Y", and the quieter "X, pas Y" and "X, not Y". Write the contrast as a plain statement or as two sentences. A book chapter may use it once where it resolves a real confusion about what a mechanic is; nowhere else may.
- Repeated rhetorical triples and three part lists forced for rhythm.
- Repetitive section structures that make unrelated entries read from one template.
- Restating the title as an empty opening sentence.
- Several adjacent sections opening with the same grammatical pattern, or several paragraphs ending with a broad dramatic claim.
- Variation produced by rotating synonyms. It has to come from the subject.

## Never

- Manufacture quotations, citations, testimonials, historical facts, mechanical rules, or designer intent.
- Write around a missing fact. Represent the data gap honestly.
- Leave author notes, drafting instructions, TODO prose, or hidden editorial commentary in a content file.
- Narrate a writing constraint inside the content, with phrases such as "in keeping with the setting", "for clarity", or "as requested". Apply constraints silently.
- Imitate the prose of a specific living author or a commercial book line.

## French conventions

- Use the vocabulary the game has already adopted. The controlled vocabularies live in `data/meta/`, the rule terms in `RULE_TERMS` in `src/lib/game/build.ts`, and the rest of the game's language is established by the book chapters under `data/books/` and by the existing entries. Read those rather than any list written down elsewhere.
- Terms such as `MJ`, `Jet`, `PdV`, and `Action Bonus` are Aubaine's own. Do not replace an established term with a literary synonym, and do not treat its resemblance to another game's vocabulary as a reason to change it.
- Preserve the established capitalization of game terms mid sentence. It is what makes a keyword render.
- Use guillemets for quoted speech and for a named example.
- Use the straight apostrophe in source. See `keywords-and-markup.md`.
- Prefer direct verbs and concrete nouns over calques from English, and avoid unnecessary passive voice.
- Use terminology consistently within each locale.
