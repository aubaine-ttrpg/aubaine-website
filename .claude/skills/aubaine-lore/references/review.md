# Review

The contract every reviewer of an aubaine-lore run follows, the order in which the orchestrator
settles their findings, and what happens when a gate fails. Reviewers read and report; only the
writers change a page.

## The reviewers

`SKILL.md` § The team gives each reviewer its lens and the steps it runs in; each agent file under
`.claude/agents/` says what it reads first.

## Blind reading

A reviewer gets the brief, the files in scope, the frozen list and the owner's decisions. It does not
get the draft history, another reviewer's findings, or the orchestrator's opinion of the page, so
that each lens finds what it finds. A finding on frozen text, on owner text the fact map does not
open, or against an owner decision, becomes a note for the owner and is never a remedy; the
orchestrator copies every such note, and every note and question for the owner that a reviewer or
the writer returns, into the run's `owner-notes.md` (`SKILL.md` § The run, steps 1, 4, 6 and 11).
The one
exception is the provenance pass: it also reads earlier runs' `request.md`, briefs and ledgers, as
evidence of who wrote a sentence and never of what is true.

## The report

Every review returns, in this order:

1. **What was read:** the files, and the snapshot it read (`snap/<pass>/`).
2. **Scope:** the parts and the locales, and the sources consulted.
3. **Findings,** most severe first:

   ```
   | # | Severity | Locale | Part | Quote | Problem | Evidence | Remedy | F# |
   ```

4. **Evidence** sits in its column: the quoted text with its file and line, and the source or rule
   the finding rests on.
5. **Remedy** is exact replacement text when the finding is local, or the action and its target
   (MOVE to « La Matriarchie », CUT as a repeat of F12).
6. **Canon touched:** the fact-map rows (F#) the finding changes, or none.
7. **Notes and questions for the owner,** numbered.
8. **Assessment:** two sentences and a confidence, no score.

A reviewer reads the files its task names, opens another page only to settle a named claim, and
writes its report before its turns run out: a review that ends on a tool call returns nothing.

A finding with no quote, no evidence or no remedy is dropped. "Make it more immersive" is not a
finding, and a reviewer's overall verdict on quality is never evidence. An empty findings table is a
valid review.

A prose finding names its problem from a short set, each with its edit: cliché (replace with the
particular), redundant exposition (cut), purple prose (cut the ornament), poor structure (split or
reorder), lack of specificity (replace the general word with the particular the canon holds, in
writer text), awkward wording (drop the hedge,
use the plain verb), tense slip (fix the tense). A particular that makes a passage longer is never a
length fault.

## Severities

| Severity | Meaning | Before C1 |
| --- | --- | --- |
| BLOCKER | Canon corrupted, a mechanic contradicted or implied (such as a magic the game does not give the people; `architecture.md` § Lore and mechanics names the rest), serious drift between the editions, a frozen line changed, a part that cannot do its job, a sentence on a page of the owner's (`lore.md` § Start from the owner's text) that no words of the owner asked for, within the reach of the revision, or a question put to the player. | Resolved. |
| MAJOR | A structural, narrative, gameplay or prose weakness a demanding editor would refuse. | Fixed, or recorded as a limitation with its reason and its evidence. |
| MINOR | A local improvement. | Applied when it clearly improves the page, except in writer text the owner has seen, which changes only as `lore.md` § Start from the owner's text says. |
| SUGGESTION | A creative direction. | Optional; never applied without the owner when it would add canon, nor in writer text the owner has seen. |

No numbers, no grades, and no finding invented to fill the table.

## Synthesis

The orchestrator reads every review, merges duplicates by location, and settles each finding by this
order of priority:

1. canon and mechanical integrity;
2. what the player needs to understand and play the people;
3. the mysteries the canon keeps;
4. structure: one home per fact;
5. the quality of the prose;
6. concision.

The order settles a conflict between reviewers, such as a gameplay editor asking for an answer the
canon keeps open; it is never a reason to accept dull prose. Each finding becomes a ledger row,
settled only as far as its severity allows before C1 (§ Severities): accepted with the remedy the
writer applies, rejected with its reason, or held for the owner as a row of `owner-notes.md`.
Before a remedy goes to a writer, the orchestrator checks it against the brief's list of facts to
keep: a remedy that fixes one claim must not drop another.

A finding whose remedy a later round undoes, as when a round restores the owner's text, is open
again, and goes into `owner-notes.md` as a note for the owner. A remedy that changes only a heading
never settles a section that holds several subjects (`architecture.md` § What each part is for).

## Gates

The orchestrator runs the machine gates, and a failure stops the run until it is fixed:

- the checks of `SKILL.md` § The run, step 10, the private build among them;
- every frozen line still present, by `grep -F`;
- an empty diff after every read-only pass, and every hunk of a writing pass matched to a ledger row
  (aubaine-content `SKILL.md` § The ledger);
- the working tree compared with the intake status: a file outside both runs' allowlists is reported,
  never restored, since another session may own it.

The reviewers hold the judgment gates: canon with no `CONFLICT`, `PROPOSAL` or drift left unlisted;
gameplay with every part doing its job; the editors with no tell left in writer text the owner has
not yet seen; the critic
with no BLOCKER and no MAJOR left without a decision.

## When a gate fails

| Failure | Fixed by | Then |
| --- | --- | --- |
| A markup, reference or format check | the writer of that file | the check again |
| A canon finding | the writer, in a call limited to its rows | canon on the changed hunks |
| A drift finding | the writer of the drifting edition | canon in parity mode on the changed hunks |
| An accepted prose finding | the writer | the editor of that locale on the changed hunks, in the second round only |
| A gameplay or critic MAJOR | the writer, from the orchestrator's decision | the reviewer who raised it, on the changed parts |
| A finding on the species file's reader prose (`roleplay.text`, `naming`, `subspecies[].text`) | `aubaine-content-writer` or `aubaine-content-translator` | the keyword pass when braces change, then `aubaine-content-quality` |
| A finding an unclear reference caused | a `skill-fix` row | that pass again, read-only, on the snapshot that showed the defect, to prove the fixed reference catches it |

Before a remedy that changes one edition goes to a writer, the orchestrator checks it against the
other edition's claims: a remedy written for style can drop a claim the other edition keeps. After
every fix round, run `pnpm lore:survey <target>` again; two sets of fixes that are each sound can
converge on the same words in two parts of one side (`architecture.md` § One home per fact).

At most two fix rounds follow the final panel. What is still MAJOR then goes to C1 as a documented
limitation with the reviewer's evidence. Nothing loops on taste.

## The critic's questions

The critic reads the page cold, as a demanding editor, game master or player would, and returns only
what such a reader would actually refuse:

- What could belong to any fantasy setting? Swap the proper nouns: does the paragraph still stand?
- What is said twice on one side of the page, inside « Histoire » or inside the opening and « En
  jeu »? Start from the survey's similar pairs and recurring terms; a light restatement across the
  two sides is no finding, a retold section is (`architecture.md` § One home per fact).
- What sits in a part whose job it is not?
- Which section holds paragraphs that share nothing but its title?
- Which paragraph has another people as its subject, rather than this people's view of them or a
  bond with them (`architecture.md` § The subject test)?
- What does « Jouer » ask the player, even rhetorically, and toward which side does any line push
  them?
- Which sentence on a page of the owner's is not the owner's, and which words of the owner ask for it?
- What is explained more than the reader needs, or before they need it?
- What sounds literary and says nothing?
- What is a mystery with no reason to care, and what mystery does the page answer?
- What breaks the world's own rules, its canon or its Compétences, and what does the page give the
  people that the game does not, such as a magic (`architecture.md` § Lore and mechanics names the
  rest)?
- What stands in for cultural complexity: a single personality for a whole people, a list of virtues?
- Which sections share a shape, a length, an opening or an ending?
- What would a skeptical reader skip or mock, and why?
- Of every quote: what does the speaker want from the listener, and does the line still sound like
  that speaker with its source line hidden?
- Of every event the page tells: what did it change, and does that change still hold when play
  begins?
- Where the page names a people or a place, does it say what they work at, trade, eat and travel by?
  A gap the canon does not fill is a question for the owner, never a fact to write.
