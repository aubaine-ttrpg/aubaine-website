# Naming and titles

Names encode setting identity without becoming hard to tell apart at the table.

Within one local cast or one tree, avoid multiple names with the same first syllable, silhouette, or
rhythm unless the confusion is intentional.

Titles should communicate role, reputation, office, kinship, or history.

Avoid stacking ornamental titles that do not affect how people address or understand the subject.

Do not generate fantasy names by repeatedly combining apostrophes, doubled consonants, and rare
letter clusters.

For each culture, establish a small naming grammar and reuse it consistently.

## In the codex, a name is also an identifier

A skill `title` and a state `name` are what `{{...}}` and `[[...]]` resolve against and what the term
index matches. That has three consequences.

- A name must be unique in its class. Two states may not share a printed name.
- Renaming is a repository wide change. Every entry that references the old name has to move with it,
  in both locales, or the build fails.
- A name that collides with a rule term or a characteristic label loses. The index is first wins, and
  the later entry simply never links.

The id is drawn from the name but is permanent and independent of it. Five characters plus a number.
Once an id exists it is never reused, even if the title changes. Three ids were already renamed on
import because they collided; check that `data/skills/<ID>.json` does not exist before inventing one.

Names appear in search, in tooltips, on the plate, and in the printed index. A name that is clear on
a card and ambiguous in a list is a name to reconsider.

## A people's regional variant is an origine régionale

Reader-facing text never calls the regional variant of a people a « sous-espèce » or a « race », in
either locale (EN: never "sub-species" or "race"). Those words read peoples as breeds, which the game
refuses. The reader sees « origine régionale », or "regional origin" in English. The data field stays
`subspecies`, and the species runbook names it that way; that is a machine name, and it never reaches
a page.
