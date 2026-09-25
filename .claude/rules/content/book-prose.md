---
paths:
  - "data/books/**/*.md"
---

# Book Prose

Book chapters are the explanatory layer. They teach a mechanic in plain language without changing it, and, beside the species and tree lore, they are the only long form prose in Aubaine. `docs/runbooks/add-a-book-page.md` owns the procedure.

## Format

- A chapter is plain Markdown with GitHub flavored extensions and definition lists.
- Frontmatter carries `title`, and optionally `description`. The chapter title comes from `title`, so the
  body starts at `##` and never uses `#`. `description` is that chapter's own meta description; left
  out, the chapter falls back to the book's, which is why a book of any length should give each
  chapter its own.
- A chapter is a whole page, not a fragment. Its parts are `##` and `###` headings inside one file,
  and the page builds its own outline from them. Do not split a subject across files to make it
  navigable; a file is a chapter, the way a chapter is a chapter in a printed book.
- Rule text markup applies. `[[Nom d'état]]` and `{{Nom de compétence}}` resolve the same way they do in an entry, and `pnpm data:check` fails on a name that does not. Use ordinary markdown `**bold**`, not `***gras***`, because markdown owns emphasis here.
- Keywords are marked automatically wherever they appear, from the exact spelling. A chapter therefore carries the same icons, colours and tooltips as an entry, and you do not mark them up by hand.
- Use a definition list for a closed set of named things, which is how resources, currencies, and the parts of the Soul are already presented.
- Use a table for genuinely tabular facts such as costs and derived values.
- Write a quote as a Markdown blockquote. When it has a speaker, close it with a last line `> :source[...]`: that line becomes the attribution, outside the quote, and `pnpm data:check` refuses a `:source[` anywhere else.
- Set formulas as code so they read as formulas.

## Voice

- Open by saying what the thing is and what it is for. No atmosphere before the definition.
- Give the direct answer first, then the procedure, then the exceptions, then an example.
- Address the reader as the player at the table, in the second person, when the chapter tells them what to do.
- Keep sections short and semantic. A heading names what is under it.
- Explanation may simplify sentence structure. It may not simplify away an edge case.
- An example demonstrates the rule and never patches it. Keep numbers easy to verify.
- Do not turn an interpretation into a rule. If the chapter and an entry disagree, that is a contradiction to record, not to smooth over.

## Consistency with entries

- A chapter and the entries it explains must use the same term for the same thing.
- A chapter must not restate a value that an entry owns. Explain the mechanic and let the entry carry the number.
- A chapter must not restate what another chapter owns either. One mechanic is explained in one place, and
  the chapters that need it point at it.
- Capitalization is what makes a keyword render, here exactly as in an entry. `Avantage` is marked, `avantage` is not.
- Never enumerate a list that has a source of truth under `data/`. Name one or two members as examples, say the index carries the current list, and let the reader go there. Trees, items and states come and go; a copied list rots.
