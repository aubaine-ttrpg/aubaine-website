# Canon verification

The lens of `aubaine-lore-canon`, which reads a lore page and edits nothing. It turns the page into a
table of claims and says, for each one, what in the repository supports it.

## What counts as a claim

- A proper noun: a people, a place, a person, a deity, an institution, an event.
- A cause: why something happened or holds.
- An agent: who did it, who decides, who rules.
- A relationship between named peoples or characters.
- A date, an era, an order of events.
- A number: a lifespan, a height, a count, a distance.
- A single word that asserts on its own, such as « exilé », « conquis » or « fondé »
  (`.claude/skills/aubaine-prose/references/claims-and-evidence.md` § A single word can assert
  canon).
- A sentence a player could act on at the table. Lore never creates a mechanic; such a sentence is a
  finding for the Compétences, not for the page.

## Where support comes from

Look in this order and stop at the first that settles the claim.

1. The owner's source for this page: the line of the run's `pdftotext` output.
2. Another lore page or a book chapter that shares the people, the place or the event, newest first
   by `git log -1 --format=%cs`.
3. An entity file under `data/`, such as the species file and the rule text of its Compétences.

When two sources disagree, the newer canon wins if it is clearly newer, and the older page is
corrected. When neither is clearly newer, the claim goes to the owner.

## The table

```
| # | Claim, quoted | Kind | Support (file:line, or source page:line) | Verdict | Note |
```

- `supported`: a source states it.
- `inference`: no source states it, and it dramatises a known fact with a small concrete detail. It
  is allowed, and it is listed for the owner's veto at C1.
- `new fact`: no source states it, and it adds a people, a place, a date, an institution, a cause or
  a relationship. The writer removes it unless the owner approves it.
- `contradiction`: two sources disagree. The owner decides when neither is clearly newer.

## Cross-checks

- The page against its species file and its Compétences: a lore sentence about what the people can
  do agrees with the rule text that makes them do it.
- The page against every page that names the same people: the Scothan page already says how the
  Nnors de Charon give life, and the Nnor page may not contradict it.
- Names: every name on the page is spelled as in the species file and the owner's lists.
- Terms renamed since the source was written are renamed on the page.

## What this pass returns

The claim table, then the list of inferences and new facts for the owner, then every contradiction
with both sources quoted.
