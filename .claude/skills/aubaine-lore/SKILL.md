---
name: aubaine-lore
author: Kori
version: 2.1.0
last_updated: 2026-11-08
license: MIT
description: Write, revise, translate and audit Aubaine's lore in French and English, the histories of its peoples and trees under data/lore/ and the standalone lore to come. One writer and five read-only reviewers (canon, gameplay, line editor per locale, adversarial critic, researcher) work from a fact map, with owner checkpoints, starting from the owner's own text whenever there is one and adding no sentence the owner did not ask for. Use for a species or tree lore page, its epigraph and quotes, its English edition, a page's structure or repetition, its canon and mysteries, which sentences on it are the owner's, and any story or history of the setting. An existing page is audited, read-only, unless the owner's words ask for a change.
argument-hint: [write|revise|audit] <people, tree or event>
---

# Aubaine Lore

## Authority

The repository is the only authority for Aubaine's canon (`.claude/rules/content/authority.md`).
`.claude/rules/content/lore-prose.md` holds the invariants, and `docs/runbooks/add-a-species.md`
§ The lore file the format. A rule under `.claude/rules/` wins over this file.

## Scope

`data/lore/**`, and standalone lore once a schema exists (`references/architecture.md` § Lore types
without a schema). The species file, its Compétences and the reader prose inside it
(`roleplay.text`, `naming`, `subspecies[].text`) belong to `aubaine-content`; a lore run hands that
prose the same fact map. A book chapter belongs to `aubaine-prose`.

## Modes

`$0` is the mode when it is `write`, `revise` or `audit`; otherwise every argument is the target and
the mode follows from the page.

| Mode | When | Changes |
| --- | --- | --- |
| `write` | No page yet, or a stub, from the owner's text or the canon the owner points to. | The page in scope. |
| `revise` | An existing page, and only when the owner's words ask for a change. Those words go into `request.md` verbatim. | The page in scope, by the fact map. |
| `audit` | An existing page, and the default for one. | Nothing under `data/`. Writes `audit.md` in the run folder. |

Resolve the target with `pnpm lore:survey <target>`. It matches an id or a French or English name;
when nothing matches it lists every species and tree, and the orchestrator picks from that list
(« elves » is the Elf, `elfe`).

## The team

The main agent orchestrates, runs every command, settles every finding, and is the only one that
talks to the owner. Each subagent gets the brief, the files in scope, the frozen list and the owner's
decisions; a reviewer gets neither the draft history nor another reviewer's findings, save the one
exception `references/review.md` § Blind reading makes.

| Agent | Main lens | Changes | Runs |
| --- | --- | --- | --- |
| `aubaine-lore-writer` | `references/lore.md`, `references/architecture.md` | the page of its locale | write, fix |
| `aubaine-lore-canon` | `references/canon.md` | nothing | provenance, discovery, French review, parity, request check |
| `aubaine-lore-gameplay` | `references/architecture.md` | nothing | diagnostic, final panel |
| `aubaine-lore-editor` | `references/lore-tells.md` | nothing | diagnostic, after each edition, once per locale |
| `aubaine-lore-critic` | `references/review.md` § The critic's questions | nothing | diagnostic, final panel |
| `aubaine-lore-researcher` | `references/research.md` | nothing | only for a question `research.md` does not answer |

Each agent file lists everything its agent reads first.

Independent reviews run in parallel. Two writers never edit the same file at once. When one call of a
panel fails, rerun that call alone: a workflow resumed after a failure reruns every call after the
first changed one. A workflow agent cannot be resumed, so a call that stops at its turn limit without
a report is rerun with its task narrowed to the files it must read. An agent file created during a
session can take a few minutes to register: a call
that fails with `agent type ... not found` is retried once the harness lists the agent, never
replaced by another agent.

## The run

1. **Intake.** Open `tmp/lore-runs/<date>-<slug>/`. Write the owner's request verbatim to
   `request.md`. Copy every file in scope from `git show HEAD:` to `baseline/`, and save
   `git rev-parse HEAD` and `git status --porcelain`. For a PDF source, take its text with
   `pdftotext -layout` and list every character it holds that the repository refuses. Read the
   owner's original source whole when one exists (an export, a PDF), and search every earlier run
   folder of the target (`tmp/lore-runs/*-<slug>*/request.md` and `brief.md`) for the owner's
   answers: each one that still holds goes into `references/rulings.md` before the brief. Read every
   `owner-notes.md`, `ledger.md`, review, audit, report and writer return in those folders too,
   whatever its name (`diag-*.md`, `review-*.md`, `audit.md` and `report*.md` among them): every
   note and question for the owner, every finding held for the owner, and every finding whose remedy
   a later round undid goes, quoted with its file and line, into `owner-notes.md` in the run folder,
   unless an answer of the owner has closed it (`references/review.md` § Synthesis). For the whole
   run, every message and answer of the owner goes into `request.md` verbatim before the next agent
   call; an answer to a choice goes in with its question and every option as the owner saw them.
2. **Canon discovery.** Run `pnpm lore:survey <target> --out <run>/survey-before.md`. It gives the
   parts, the recurring terms, the similar sentences across parts and the neighbour pages, newest
   first. When the lore page exists, run
   `pnpm lore:owner-text <target> --source <file> --out <run>/owner-text-before.md`, with one
   `--source` for each file of owner text (`references/lore.md` § Start from the owner's text),
   among them `owner-words-fr.md` in the run folder, which holds verbatim and dated the French
   wording the owner's messages give for the page, and exists in every run, empty when the owner
   gave none. It sorts every sentence of the French page and
   its species prose into the owner's, changed and writer text; a page not yet written has nothing
   to sort, and the tool first runs at step 10. Read `rulings.md` § All peoples and the entries of every people the page touches.
   `aubaine-lore-canon` then returns
   the claim ledger, `canon-ledger.md`, and the provenance of each writer sentence
   (`references/canon.md` § Provenance).
3. **Research,** only for a question `research.md` does not answer, or answers with a row more than
   twelve months old. Add the researcher's rows to `research.md`, dated.
4. **Diagnostic panel** on the page as it is: gameplay, the editor for each locale, and the critic.
   `audit` stops here and writes `audit.md`: the ledger, the findings by severity, a proposed fact
   map, and every open row of `owner-notes.md`.
5. **Brief.** Write `brief.md`:
   - the fact map (`references/architecture.md` § The fact map);
   - the section plan: the purpose of each part, what it keeps, the mysteries it keeps, and the play it
     opens;
   - the frozen list, verbatim;
   - the quote brief, when the quote changes;
   - the list of allowed changes to the owner's text: each fact-map row that changes the owner's
     wording, with the owner's words behind it, and each fix `references/lore.md` § Start from the
     owner's text allows without words, added as it is made;
   - the proposals for the owner.

   Every change to the owner's text that `references/lore.md` § Start from the owner's text does not
   allow without words, and on a page of the owner's every sentence that is not the owner's, cites the
   owner's words that ask for it; a writer sentence there with no such words is a `PROPOSE` row, and
   leaves the page within the reach of the revision. A lore page in `write` with no owner text
   (`references/lore.md` § Start from the owner's text) cites the brief's fact for each of its
   sentences instead.
   A fact the brief tells a writer to keep is quoted from its source with its subject, never
   paraphrased: a paraphrase can move an adjective from a people to its names. The brief holds
   decisions, never findings: every later reviewer reads it, so the panel's reports and their summary
   stay in their own files (`diag-*.md`, `diag-summary.md`).
6. **C0.** The owner approves the brief, with `owner-notes.md` beside it. The text the owner
   approved, the brief or a plan that holds it, is copied verbatim to `c0.md` in the run folder. The
   owner may waive C0 for a run; the waiver goes into `request.md`.
7. **French.** The writer revises or writes the French page. If the species prose changes, hand it to
   aubaine-content with the brief's path: its writer, keywords when braces appear, then quality.
   Then canon and the French editor review in parallel; settle, fix, and freeze the fact map.
8. **English.** The writer writes the English page from the brief, never from the French sentences;
   aubaine-content's translator writes the species prose. Then canon in parity mode and the English
   editor review in parallel; settle and fix.
9. **Final panel.** Gameplay and the critic read the whole page in both editions. Settle, then at
   most two fix rounds, each followed by canon parity on the changed hunks
   (`references/review.md` § When a gate fails).
10. **Checks.** Run them in this order:
    1. build privately, as aubaine-content says (`.claude/skills/aubaine-content/SKILL.md` § The run,
       Check B, and § Checks); Biome formats none of a lore run's files under `data/`;
    2. every step `pnpm verify` runs in `package.json`, such as `pnpm data:check`, except
       `pnpm build`, which the private build replaces;
    3. the species, quote and no-JavaScript e2e specs against the private build. Start
       `pnpm astro preview --port <free port> --outDir <run>/dist --ignore-lock` as a background
       process (astro's own `--background` refuses `--ignore-lock`), then run
       `pnpm exec playwright test -c <copy> species-page lore-quote no-javascript`. The copy of
       `playwright.config.ts` sits outside the repository: it imports `@playwright/test` by its
       absolute path in the repository's `node_modules`, sets an absolute `testDir`, that port and no
       `webServer`, since the repository's runs `pnpm build`. Stop the preview by the pid listening
       on its port, never with `astro preview stop`, which stops another session's server.

    Then: the survey again, to `survey-after.md`; `pnpm lore:owner-text <target>` with the sources
    step 2 lists, to
    `owner-text-after.md`, where every owner sentence is present, or changed as the brief's list of
    allowed changes says, and every writer sentence has its row in the brief; `grep -F` for every
    frozen line; and a comparison of the status with intake. In `revise`, a last
    `aubaine-lore-canon` call in request mode (`references/canon.md` § Request mode) states for each
    request and ruling whether both editions meet it, with the line that proves it.
11. **C1.** The owner gets the page in both locales on `pnpm dev`, together with:
    - the ledger and the before and after survey;
    - the proposals, inferences and conflicts;
    - every open row of `owner-notes.md`, this round's and every earlier round's: every row that no
      answer of the owner has closed;
    - the limitations that remain, and the real output of every check.

    Commit only on « commit ».
12. **Retrospective.** Write `retrospective.md`: which reviewer found what, where they overlapped,
    what was found late, and the `skill-fix` rows.

## The ledger

The ledger, its columns, the snapshot guard and the `skill-fix` row are the ones `aubaine-content`
defines in `.claude/skills/aubaine-content/SKILL.md` § The ledger; a lore `skill-fix` is recorded and
proven as § Keeping this skill true says.
A read-only pass must leave an empty diff. A file changed outside the run's allowlist is reported,
never restored: another session may own it.

## Owner text

- The frozen list holds what no pass may touch: the pictures, a quote's staging, and the lines the
  owner chose to keep. The orchestrator checks it with `grep -F` after every writer pass. The name
  lists are data in the species file, which no lore pass touches.
- Owner text, a page of the owner's, and what a revision may change in the owner's text and on
  whose words are defined once, in `references/lore.md` § Start from the owner's text. A committed
  sentence is not the owner's for being committed: earlier runs wrote some.
- In `write`, owner text gets only the light pass `references/lore.md` § Start from the owner's text
  describes. `pnpm lore:owner-text` checks that every owner sentence survives, or is on the brief's
  list of allowed changes.
- On a page of the owner's, a sentence that is not the owner's enters or stays only where the
  owner's words ask for it, a standing request recorded in `references/rulings.md` included. A ruling
  or a direction settles canon or tone, and asks for no sentence.
- No fact the owner wrote is lost: it leaves the page only when another page already carries it, or
  the owner's words drop it, and the report lists it.
- Every owner answer during the run goes into `request.md` verbatim, and the canon it settles goes
  into `references/rulings.md` in this skill's words. A request meant to hold beyond the run, such as
  one for every people or one that brings an older source's lore onto the page, goes there too, as a
  standing request, with the line of `request.md` it comes from.

## Refusals

- Do not invent a people, a place, a date, an institution, a cause, a relationship or a magic. Only
  in `write` with no owner text may a small concrete detail dramatise a known fact, and it is listed
  for veto.
- Do not put a question to the player, in « Jouer » or anywhere on the page.
- Do not turn a belief, a dispute or a mystery into fact, and do not fill an unknown.
- Do not let lore create a mechanic or a magic. What a people can do at the table is a Compétence,
  and a magic it practises is one the game holds and gives it (`references/architecture.md` § Lore
  and mechanics).
- Do not swap a people the owner named for one that has a page.
- Do not mirror the French sentence for sentence in English.
- Do not claim a check passed unless it ran. Do not commit without « commit ».

## Keeping this skill true

- **A reference changes when a run shows it was wrong or unclear:** a reverted hunk, a check failure,
  an owner correction, or a defect found late. Record a `skill-fix` row, edit the one reference that
  owns the concept, and rerun that pass, read-only, on the snapshot that showed the defect, to prove
  the fixed reference catches it.
- **An owner ruling** goes into `references/rulings.md` the day it is given. Once a page carries the
  fact, trim the entry to what it ruled out.
- **Research is refreshed** for a new question, or when its row is more than twelve months old.
- **To retire an agent or a reference,** move its job to the file that will own it, update every
  caller in the same change, and record the move in an ADR when it changes the run.
- **When two references disagree,** the rule under `.claude/rules/` wins. Fix the reference rather
  than writing which one takes precedence.

## References

- `references/lore.md`: the craft, read end to end before writing.
- `references/architecture.md`: the parts of a page, one home per fact, the fact map, what leaves
  the page.
- `references/canon.md`: the claim ledger, certainty, parity.
- `references/rulings.md`: the owner's canon that no page carries yet, their direction, and their
  standing requests.
- `references/lore-tells.md`: the tells of long narrative prose.
- `references/review.md`: the reviewer contract, severities, synthesis, gates.
- `references/research.md`: outside research, with sources.
- Shared, in `.claude/skills/aubaine-prose/references/`: `claims-and-evidence.md`, `ai-tells.md`,
  `locale-fr.md`, `locale-en.md`, `house-voice.md`.
- `{{...}}` references follow `.claude/skills/aubaine-content/references/keyword-logic.md`.
