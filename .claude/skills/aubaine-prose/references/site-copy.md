# The site's own copy

Three surfaces outside `data/` carry text a reader sees. None of them is codex canon, none of them
runs through the keyword index, and the schema contract does not reach any of them.

## The interface strings

`src/lib/i18n/strings.ts` holds every label, lead and error, both locales in one module. The type
makes an omission a compile error, so there is no fallback and no partially translated state.

- A label names a destination and is read in passing. It is not a sentence.
- A lead is one or two sentences, and on a hub page it is also the meta description.
- An error says what failed and what the reader can do next.
- A value may be a function taking a variable. It returns a complete message; never assemble one
  from concatenated fragments.
- No version string. `tests/data/integrity.test.ts` fails on one.
- The keyword index does not run here, so a capitalised game term is plain text with no icon, no
  colour and no tooltip. Write it correctly anyway, because the reader still reads it.
- This file uses the curly apostrophe, unlike `data/`, which requires the straight one. That is
  deliberate: nothing here is matched against a keyword index.

## The policy pages

`src/content/policies/` holds the privacy note, the credits, the licences and the AI policy, in
French with an English overlay. ADR 0015 owns their contract.

This is the project speaking in its own name about itself. It is the one surface that may use the
first person, and it never adopts the in-world voice of the codex. It carries no rule text markup,
because nothing here parses it.

A claim on these pages is about rights, data or attribution, so it is verified before it ships or it
does not ship. Never state a licence, a retention period or a credit that no file in the repository
supports. Two of them are asserted by test: the licences page must name the licence identifier and
its deed in both locales.

## What the titles and descriptions are made of

`src/lib/game/pages.ts` composes every title and meta description. It is not a place to write prose;
editing prose there is a bug. What matters is knowing what your sentence becomes.

- A skill node page takes `flattenText(description, 160)`. **The first 160 characters of a skill's
  rule text are that page's meta description.** 249 of 271 descriptions are longer than that and are
  cut at the last whole word with an ellipsis, so the opening has to carry the meaning on its own.
- `flattenText` removes the print callout, the `***` emphasis and the `[[` `]]` of a state
  reference, then collapses whitespace. It does not remove `{{` `}}`, so a skill cross reference
  inside the first 160 characters would reach the description with its braces. None does today.
  Keep it that way by opening on the mechanic rather than on a reference.
- A tree page description is composed from interface strings and a count, not from authored prose.
- A book chapter takes its own frontmatter `description`, falling back to the book's. A chapter of
  any length deserves its own.
- A policy page takes its frontmatter `description`.
- Only the search page and the 404 are `noIndex`.

Known gap, recorded rather than fixed: the skills and equipment hubs use their eyebrow labels as
meta descriptions, at 45 and 39 characters. They are labels doing a sentence's job.
