---
paths:
  - "data/**/*.[a-z][a-z].json"
  - "data/**/*.[a-z][a-z].md"
  - "docs/runbooks/add-a-translation.md"
---

# Translation

French is the source language and the fallback. English is a sidecar overlay: the same path with `.en` before the extension. The supported locales are `fr` and `en`, declared in `src/lib/i18n/locales.ts`, and the English document language is `en-GB`. `docs/runbooks/add-a-translation.md` owns the field allowlist and the worked examples.

## The overlay contract

- An overlay holds only the strings that change. Every key it leaves out falls back to French.
- Do not copy the French file and translate it in place. Extra keys are at best ignored and at worst invalidate the overlay.
- An overlay may carry only the fields its kind allows. One disallowed or misspelled key drops the whole overlay, and the entry renders in French on the English page with no error.
- `pnpm data:check` does not catch that. It counts entries, not translated strings. If an English page is stubbornly French, check the overlay field names first.
- Never write an explicit `null`. Leaving a key out is exactly how you say keep the French.
- An overlay must target a file that exists.

## What is not translated

- Ids, `key` fields, and domain, characteristic, rarity, discipline and tag keys are machine values shared across locales.
- Structural numbers and costs live in the canonical file only.

## Translating rule text

- Translate the concept, not the sentence shape. A localized entry is not the French one with the nouns replaced.
- A translation may never change how a rule executes. If the English wording admits a different resolution, the translation is wrong.
- A reference keeps its key in both locales: an overlay writes `{{enrage}}` and `{{RAGEXX-001}}` exactly as the French does, never a translated name. Written alone, it prints the entry's English label, which stays the French one for an entry nobody has translated yet. A plural goes in the written text, `{{jet|Rolls}}`. `pnpm data:check` resolves each key in the locale it is written in.
- Keep the established capitalization of English game terms. It is style: a word links only through `{{...}}`. See `keywords-and-markup.md`.
- Choose one English term per Aubaine concept and use it everywhere. Use `labelEn` from `data/meta/` and the English side of `RULE_TERMS` where they cover the concept.
- Use British spelling, the Oxford comma where it prevents ambiguity, and direct subject verb object sentences for mechanics.

## Coverage

- A missing overlay is a legitimate state. The entry shows French on the English page.
- Do not invent an English name for a concept that has not been given one. Leave it untranslated and record the decision.
