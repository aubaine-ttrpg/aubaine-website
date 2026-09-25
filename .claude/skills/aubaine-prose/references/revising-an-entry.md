# Revising an entry that already exists

Improving an entry that is already in Aubaine is usually worth more than adding another one. These
are the rules for doing it without breaking what points at it.

## The id is permanent

An id is five characters and a number, and it is never reused even when the title changes. It is the
filename, so a rename is a new file plus a deletion, and the old id must not come back.

## A title is a reference, so renaming one is a repository wide change

A skill `title` is what `{{...}}` resolves against and a state `name` is what `[[...]]` resolves
against. Renaming one means moving every reference to it, in both locales, or the build fails. Check
the English overlay as well: it carries its own title and resolves against the English index.

A name that collides with a rule term or a characteristic label loses, because the index is first
wins and the later entry simply never links. Check before renaming, not after.

## Triage before editing

Classify the entry first, because the three cases want different work.

- **Sound.** Tighten the prose, add the detail it lacks, check the keyword spelling.
- **Overlapping.** It answers a question another entry already answers. Differentiate it or merge
  it. See `one-entry-one-job.md`.
- **Weak.** The mechanic itself is incomplete or contradicts a field. That is a design question and
  it is reported, not rewritten into something plausible.

## Do not add words

The goal is a better entry, not a longer one. Cut a sentence that repeats a point before adding one
that does not. An entry that grew by a paragraph and says nothing new got worse.

## Keep the layers separate while you work

A revision is the moment layers leak. A number that moves into prose from a field, a piece of
flavour that acquires a mechanic, an interpretation that hardens into a rule: each of those is
easier to introduce while editing than while drafting. `claims-and-evidence.md` is the test.

## Check both locales

An entry and its overlay can drift apart in a revision, and nothing reports it. If the French gained
a clause, the English needs it or the two now resolve differently, which `locale-en.md` calls a
broken translation rather than a stylistic difference.

If the entry has no overlay yet, the French change simply renders on the English page too. That is
the designed fallback and it is not a defect.

## Then

Run `pnpm data:check` and open both pages. A revision that passes the checks can still have changed
what the stat line reads or which keywords render, and only the page shows that.
