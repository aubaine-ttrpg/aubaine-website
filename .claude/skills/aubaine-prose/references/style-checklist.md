# Style checklist

Before calling an entry finished:

- Does the first sentence say what the thing is or does?
- Is every mechanic explicit enough to execute at the table?
- Is any flavor pretending to be a rule?
- Is any interpretation pretending to be canon?
- Did any external terminology leak in without an Aubaine decision behind it?
- Is every keyword spelled canonically, capital letters included?
- Does any structured value get restated in prose?
- Are repeated sentence templates visible when the entries of this tree are read in a row?
- Are there filler transitions?
- Does the entry carry one detail that only this entry could carry?
- Does a dramatic final sentence merely repeat the paragraph?
- Is there an antithesis outside a book chapter?
- Does the locale read as native rather than translated, rather than mirroring the French sentence?
- Is the vocabulary consistent with the chapters and the sibling entries?
- Does the opening still say what the thing is once it is cut at 160 characters?

## Enforced, so check by running rather than by eye

The refused phrasings, the dashes, the curly apostrophe and the no-break space are all checked by
`pnpm data:check`. Spend the attention above on what the check cannot see.

## Formatting

- Two space indent, one trailing newline.
- Keys in schema declaration order.
- No explicit `null`.
- No Markdown headings, lists, or links inside a JSON field.
- The exact bytes equal `JSON.stringify(JSON.parse(file), null, 2) + "\n"`.

## Then

Run `pnpm data:check`. Open the page. Look at the stat line, the keyword colours, and the tooltips.
