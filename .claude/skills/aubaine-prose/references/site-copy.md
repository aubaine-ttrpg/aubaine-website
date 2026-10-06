# The site's own copy

Three surfaces outside `data/` carry text a reader sees. None of them is Aubaine canon, none of them
runs through the keyword index, and the schema contract does not reach any of them.

## The interface strings

`src/lib/i18n/strings.ts` holds every label, lead and error, both locales in one module. The type
makes an omission a compile error, so there is no fallback and no partially translated state.

- A label names a destination and is read in passing. It is not a sentence.
- A lead is one or two sentences, and on a hub page it is also the meta description.
- An error says what failed and what the reader can do next.
- A value may be a function taking a variable. It returns a complete message; never assemble one
  from concatenated fragments. The check reads a function's template text like any other string.
- No version string. `tests/data/integrity.test.ts` fails on one.
- Nothing here resolves a `{{...}}` reference, so a game term is plain text with no icon, no colour
  and no tooltip. Write its capitals correctly anyway, because the reader still reads it.
- This file uses the curly apostrophe, unlike `data/`, which requires the straight one. That is
  deliberate: the straight apostrophe is a rule of `data/` only.

## The policy pages

`src/content/policies/` holds the privacy note, the credits, the licences and the AI policy, in
French with an English overlay. ADR 0015 owns their contract.

This is the project speaking in its own name about itself. It is the one surface that may use the
first person, and it never adopts the in-world voice of the game. It carries no rule text markup,
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
  cut at the last whole word with an ellipsis, so the opening has to carry the meaning on its own, without restating the rules that follow it.
- `flattenText` removes the `***` emphasis and replaces each `{{...}}` with what it prints, its
  written text or the entry's default label, then collapses whitespace. A reference inside the first
  160 characters reaches the description as a plain word, never with its braces.
- A tree page description is composed by `treeDescription` in `strings.ts` from the tree's `name`,
  its `subtitle`, its type and the titles of its first skills. A subtitle is therefore also read in
  search results. A species page takes `speciesDescription` the same way, from the species name and
  the titles of the skills it offers, and an archive page takes `archiveDescription`.
- A book chapter takes its own frontmatter `description`, falling back to the book's. A chapter of
  any length deserves its own.
- A policy page takes its frontmatter `description`.
- The search page, the 404 and every page whose subject resolves to `draft` are `noIndex`, and the
  sitemap lists only the rest. `docs/adr/0040-search-engines-read-the-page-descriptors.md` records
  why.
