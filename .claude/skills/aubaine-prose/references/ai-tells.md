# Prose that reads as generated

Unrelated entries that sound as though one generator made them. With 271 skills across 23 trees, a
growing catalogue, four surfaces and two locales, this is the failure mode that shows up fastest and
the one a single file review cannot see.

Removing the obvious vocabulary is the easy fifth of the job. Everything below survives a pass that
only swaps words, which is why swapping words is not the repair. The repair is writing about the
subject.

## The refused phrasings live in the check

`BANNED_PHRASES` in `tests/data/integrity.test.ts` holds the current set, in both languages, and
`pnpm data:check` fails on a hit across the codex, the interface strings and the policy pages.
`delve into` is one member. Read the constant when you need the others, and add to it there when a
new formula turns up in a draft. A copy of that list in a rule or in this file is the copy that goes
stale.

## The antithesis

`Ce n'est pas X, c'est Y` and its English twin, plus the quieter `X, pas Y` and `X, not Y`. It is
the most recognisable machine cadence in either language, and it is refused in a skill, an upgrade,
a state, an item, an interface string and a policy page. Write the contrast as a plain statement or
as two sentences.

A book chapter is the one exception and a narrow one. The construction is allowed where it resolves
a confusion a reader actually arrives with, once, in the sentence that defines a mechanic.
`Un Niveau n'est pas une nouvelle Compétence : c'est la même, qui fait davantage.` earns it. A
closing line reaching for it to sound final does not.

Plain negation is not this. `n'est pas` on its own is ordinary French and appears 22 times under
`data/` doing honest work. The tell is the pair: a negation and a contrastive affirmation inside one
sentence. `plutôt que` is not this either; three of its four occurrences are mechanical alternatives
in rule text, where it is the correct word.

## Rhythm

Do not end every section, entry or paragraph on a polished line. Let some of them stop.

Do not reuse a counted scaffold across entries. A tree whose skills all open on `Vous gagnez` and
all close on a cost is one generator's signature, not a house style.

Do not alternate sentence lengths mechanically. Uniform rhythm and deliberately varied rhythm read
the same way, because both are decisions taken about the rhythm instead of about the subject.

Do not restate a heading, a title or a field in the first sentence.

Do not append a conclusion that only repeats the paragraph.

Variation comes from subject matter. Synonym rotation is not variation.

## Shape

Prefer flowing prose. Use a list where order or membership matters and nowhere else, and never build
a whole section out of bolded inline headers.

Do not open every entry with the same grammatical shape, and do not open every section of a chapter
with the same kind of sentence.

Length is an output of covering the subject, never a target. Cut a sentence that repeats a point
before adding one that does not.

## Specificity

An entry carrying no detail that only this entry could carry reads as generic however clean its
sentences are. A number, a named mechanic, a physical particular, a consequence: one of them,
concretely, in every entry.

This is the single strongest separator between an entry that is worth reading and one that could
have been written about anything in the same tree. If the entry cannot supply one, that is a design
gap to report, not a sentence to smooth over. See `claims-and-evidence.md`.

## The two locales are localized, not mirrored

A French entry and its English overlay that map sentence for sentence are a tell in themselves, and
the pair is where it becomes visible. Resolve the concept, then write the sentence a native reader
would write. See `locale-en.md`.

## Rule text is the exception to variation

The same mechanical relationship described with a different sentence shape in every entry is the
failure here, not the fix. Use one phrasing for one mechanical relationship, and save variation for
flavour.

## Checks that catch it

Read several entries from the same tree in a row. If they open with the same grammatical shape, or
close with the same kind of claim, rewrite at least one.

Read the first sentence of every skill in a tree as a list. Templated prose is obvious in that view
and invisible one entry at a time.

Read the hub leads in `src/lib/i18n/strings.ts` as one block, in each locale. The same test applies
and there are few enough of them that there is no excuse.

Before calling a draft done, re-read it once against three questions. How many antitheses are in it?
Does every section end on a punchline? Could a reader tell this entry is about this thing, or would
the sentences fit any entry in the tree? Fix what that surfaces.
