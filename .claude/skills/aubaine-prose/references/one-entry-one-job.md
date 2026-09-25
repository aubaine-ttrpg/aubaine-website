# One entry, one job

Aubaine earns its worth by being navigable, and navigability breaks when two entries answer the same
question. The reader who finds both learns that neither is authoritative.

## Before adding to a tree that already exists

Read what every skill in that tree already does. State, for the new entry, the one thing it does
that none of them does. If that sentence will not come, the entry is a variant of something already
written, and the right move is to strengthen the existing one or to make the new one genuinely
different.

Two skills may differ in numbers and still be one idea. A tier three skill that is the tier one
skill with a larger die is an upgrade, and the schema has `upgrades` for exactly that.

## Distinct jobs, in practice

"What this does" and "when you would use it" are one entry. "What the state does" and "what applies
it" are two: the state file defines the condition, the skill file applies it, and neither restates
the other.

A book chapter explains a mechanic. An entry executes it. When a chapter reproduces an entry's whole
rule, the two compete and the entry loses, because the reader who arrived at the chapter never
reaches it. Cut the chapter back to the explanation and let the keyword carry the reader.

## Cross references are the structure

Aubaine links through spelling. A canonical term renders as a keyword and carries the reader to
its definition; a missed capital renders as plain text and the link silently does not exist. That is
the practical reason `keyword-rendering.md` is strict about capitals: it is not typography, it is
the navigation.

Reference a state with `[[...]]` and a skill with `{{...}}` where the reference is deliberate.
Everything else links by being spelled correctly.

An entry that nothing references and that references nothing is isolated. That is fine for a basic
skill and wrong for a skill in the middle of a tree.

## Do not restate what the reader can reach

Naming a mechanic precisely is enough. The link goes to the definition, so the entry does not carry
a copy of it. An entry that explains the state it applies is carrying a second copy of the state
file, and the two will disagree the first time one of them changes.

Define an uncommon term before leaning on it. Do not define a term the vocabularies already own.
