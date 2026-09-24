# Validation

`pnpm data:check` runs `tests/data/integrity.test.ts`. Run it before calling any content change done,
and never claim it passed unless it did.

## What it checks

`tests/data/integrity.test.ts` is the source of truth for this, and it grows. Read it when it matters
whether something is covered. The summary below orients you; it does not bound the suite.

- Every domain, characteristic, rarity, and discipline key an entry names is declared in `data/meta/`.
- Every tree placement link, `evolvesFrom`, equipment `grants`, item `set`, and skill list id resolves.
- Every `[[...]]` resolves to a state `name` and every `{{...}}` to a skill `title`, case insensitively,
  across skill descriptions, upgrade descriptions, state descriptions, item text and description, and
  set bonus text. Callouts are checked and then stripped before the state pass.
- Referenced art, PDFs, and book pages exist on disk.
- State printed names and item slugs are unique, and every item section is a declared catalogue key.
- No explicit `null` anywhere under `data/`.
- Byte exact formatting: `JSON.stringify(JSON.parse(raw), null, 2) + "\n"`.
- No U+2013 or U+2014 in `src`, `tools`, `tests`, or `docs`.
- Under `data/`: no U+2013 anywhere, and U+2014 only as a string that is exactly that one character.
- Under `data/`: no curly quote, no curly apostrophe, no no-break space, no narrow no-break space.
- None of `BANNED_PHRASES` appears in rule text, a book chapter, an interface string, or a policy
  page.
- Every rule term, Caractéristique (but the `any` marker) and Aptitude has its own definition in both
  locales, no two share a text, and the definitions written in code pass the dash, typography, banned
  phrase and antithesis checks.
- Every tag a skill carries is declared in `data/meta/tags.json` in the slot it fills, an École
  accepts the Pratique it is paired with, every declared tag is carried by some skill, and a French
  citation « l'étiquette X » names a declared label.
- No antithesis outside a book chapter, in rule text or in site copy.
- Emphasis in rule text is `***gras***`. Any other run of asterisks fails, because `MARKUP` in
  `src/lib/game/richtext.ts` parses only three and the characters otherwise reach the page.
- Both locales load with identical entity counts, and every overlay targets a file that exists.

## What it does not check

These are the failure modes to watch by eye, because CI is silent on them.

- **Keyword capitalization.** A bare term spelled `avantage` passes and simply does not render.
- **Overlay completeness.** The coverage test counts entries, not translated strings. An overlay with
  one disallowed key is dropped whole and the entry renders in French on the English page, with no
  error anywhere.
- **Whether prose matches the structured data.** Nothing catches a description that states a cost the
  fields contradict.
- **Whether prose is templated.** Rhythm, metronomic closers, reused scaffolds, and whether an entry
  carries a detail only it could carry are all out of reach of a check. `ai-tells.md` holds the
  method, and reading a tree's entries in a row is what actually catches it.
- **Whether an entry is any good.** Use `style-checklist.md` and `clarity-checklist.md`.

## Then look at it

`pnpm dev`, open the page, and check the card, the stat line, the keyword colours, and the tooltips.
For a translated entry, compare the `/en/` page against the `/fr/` one. An entry that is stubbornly
French has a broken overlay.
