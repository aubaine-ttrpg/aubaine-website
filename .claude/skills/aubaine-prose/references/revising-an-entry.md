# Revising an entry that already exists

Improving an entry that is already in Aubaine is usually worth more than adding another one. These
are the rules for doing it without breaking what points at it.

## The id is fixed once the entry leaves draft

A skill id is drawn from the French title by `docs/runbooks/choose-a-skill-id.md`. While the skill is
a draft, a new title means a new id, a renamed file and every reference moved. From `playtest` on,
the id stays what it was, whatever the title becomes.

## A title is a default label, so renaming one changes every reference that prints it

Rule text references a skill by its id and a state by its key, so renaming a `title` or a `name`
breaks no reference. It changes the text of every reference that writes none of its own, in the
language of each string: the French title in French text, the overlay's title in English text.
Search the id or the key across `data/` and read each of those sentences again, because an agreement
written around the old name may no longer fit.

## Triage before editing

Classify the entry first, because the three cases want different work.

- **Sound.** Tighten the prose, add the detail it lacks, check the references by key.
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
