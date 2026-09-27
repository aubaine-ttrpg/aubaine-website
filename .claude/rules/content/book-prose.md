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
- Rule text references apply. `{{clé}}` and `{{clé|texte}}` resolve the same way they do in an entry, with the keys `keywords-and-markup.md` gives, and `pnpm data:check` fails on a key that does not. Use ordinary markdown `**bold**`, not `***gras***`, because markdown owns emphasis here.
- The author chooses every link. Each `{{...}}` renders as a link with the icon, colour and tooltip an entry gives it, and each bare word as text. Nothing is marked automatically, at a first appearance or anywhere else.
- Use a definition list for a closed set of named things, which is how resources, currencies, and the parts of the Soul are already presented.
- Use a table for genuinely tabular facts such as costs and derived values.
- Write a quote as a Markdown blockquote. When it has a speaker, close it with a last line `> :source[...]`: that line becomes the attribution, outside the quote, and `pnpm data:check` refuses a `:source[` anywhere else.
- Frame an example of play as a callout, `> [!EXAMPLE] Titre`, and keep `> [!PRINCIPLE] Titre` for the rules that come before all others. `docs/runbooks/add-a-book-page.md` owns the syntax.
- Set formulas as code so they read as formulas. A reference inside one renders like the rest of the text, as in `` `{{ca}} = 12 + {{dexterite}}` ``; a heading or a fenced code block renders none.

## Voice

- Open by saying what the thing is and what it is for. No atmosphere before the definition.
- Explain Aubaine as it is. Never frame a rule against another game or against what roleplaying games usually do, as in « pas de niveau », « ni attaque ni sauvegarde à part » or « ce qu'Aubaine fait à sa façon ». Say what the rule does.
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
- Write game terms with the capitals an entry gives them. Capitals are style here too: `Avantage` written bare is text, and only `{{avantage}}` links.
- Never enumerate a list that has a source of truth under `data/`. Name one or two members as examples, say the index carries the current list, and let the reader go there. Trees, items and states come and go; a copied list rots.
