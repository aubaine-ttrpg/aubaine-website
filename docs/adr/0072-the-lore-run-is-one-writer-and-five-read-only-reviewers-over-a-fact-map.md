# ADR: The lore run is one writer and five read-only reviewers over a fact map

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-07
**Revised:** 2026-11-07, a revision moves and retitles the owner's text and never rewords it (addendum in Decision 1)
**Revised:** 2026-11-08, owner text is what the decider wrote, and a writer sentence stays only where the decider's words ask for it (addendum in Decision 1)
**Revised:** 2026-11-08, a note on the decider's text reaches the decider through `owner-notes.md` (addendum in Decision 2)
**Deciders:** Kori
**Scope:** How the `aubaine-lore` skill works: its modes, its agents, its canon ledger, the checks it
runs, and where its research is recorded. Amends 0050 Decision 2 for lore, and Decision 5 and 0008
Decision 3 for one file, `.claude/skills/aubaine-lore/references/research.md`. Leaves 0050
Decision 1 standing: the reader prose of a species file stays with `aubaine-content`. Does not
change the page order of 0060 or the quote staging of 0068.

---

## Context

The decider asked for a permanent editorial system for lore in both languages, with research, a
canon ledger, page architecture, specialist reviewers and quality gates, proven by a revision of
the Elfe. The skill as 0050 built it could only write or transcribe a page with a light pass. It had
a writer, a canon verifier and an editor that edited. It had no notion of where each fact belongs,
no epistemic status beyond four verdicts, and no reviewer contract. It kept no record of canon the
decider settles in conversation, which lived only in an assistant's memory. A first Elfe restructure
on 2026-11-04 rewrote the decider's text and was undone on 2026-11-06. On 2026-11-07 the decider
chose to remake the one skill rather than add parallel ones.

---

## Decision 1: Three modes, and a page is revised only on the decider's words

### Decision

- `write` makes a new page or fills a stub, from the decider's text when there is one.
- `revise` reworks an existing page. It runs only when the decider's words ask for it, and those
  words go into the run's `request.md` verbatim.
- `audit` is read-only and is the default for an existing page. It writes `audit.md` in the run
  folder and changes nothing under `data/`.
- The skill stays model-invocable. The mode rule, not `disable-model-invocation`, guards a page.
- C0 stays the default. The decider may waive it for a run, and the waiver is recorded.
- In `revise`, owner wording changes only on a fact-map row that cites the passage of the request
  asking for it. A frozen list (the name lists, the pictures, a quote's staging, the lines the
  decider keeps) is checked with `grep -F` after every writer pass. No fact the decider wrote is
  lost.

### Rationale

- The decider chose that the skill may start on its own, with the read-only audit as the default.
  `disable-model-invocation: true` would also hide the skill from plain requests such as "write the
  dwarf lore", which the routing in `.claude/rules/content/editorial-style.md` sends to it. Checked in
  `https://code.claude.com/docs/en/skills` on 2026-11-07, against Claude Code 2.1.291
  (`claude --version`).
- The 2026-11-04 run changed owner text that no owner words had opened. Tying each change to a
  quoted passage turns that failure into a missing citation the orchestrator can see before the edit.

### Alternatives considered

- **A separate user-only skill for revisions**: rejected by the decider in favour of one remade
  skill. Reopens if a revision starts without the decider's words despite the mode rule.
- **Six skills and a `docs/editorial/` tree**, as the request first sketched: rejected by the
  decider. They would compete with `aubaine-lore` and with the shared references of `aubaine-prose`.

### Caveats

- The mode rule is an instruction, not a mechanism. A model that ignores it can still start a
  revision; the baseline in the run folder and the decider's C1 are the remaining guard.

### Addendum (2026-11-07): what `revise` may do to the decider's text

- The first Elfe run read the request's general licence (« delete weak prose », « restructure ») as
  leave to reword the decider's sentences: 34 of the 49 sentences of the committed page came back
  changed or missing, counted by `tmp/lore-runs/2026-11-07-elfe-revise/owner-text-check.py`. At C1 the
  decider asked for chapters to move and be retitled, and the lore not to change.
- So `revise` moves, splits, retitles and consolidates the decider's sentences, and rewords one only
  where the decider names the passage or a ruling changes it. A script checks that every committed
  sentence survives word for word or is on the brief's list of allowed changes
  (`.claude/skills/aubaine-lore/references/lore.md` § Start from the owner's text).

### Addendum (2026-11-08): owner text is what the decider wrote

- The second Elfe round treated every committed sentence as the decider's. Checked against the
  decider's Notion export with `pnpm lore:owner-text`, then traced by `aubaine-lore-canon` through the
  run folders (`tmp/lore-runs/2026-11-07-elfe-revise/provenance-r3.md`), 52 sentences of the page and
  its « Jouer » text were not the decider's as written: 9 differed only by typography, a slip or
  canon that had moved, 22 had been asked for by the decider's words, and 21 had not. The 21
  included « Chez eux règne la Matriarchie. », written from a ruling, four facts carried from
  neighbour pages, and three cuts inside the decider's sentences; the decider struck the first.
- So owner text is the decider's sources and messages. A writer sentence enters or stays on a page
  only where the decider's words ask for it, and is otherwise a `PROPOSE` row off the page. A ruling
  or a direction asks for no sentence. A cut inside the decider's sentence needs the decider's
  words, so the consolidation the addendum above allows no longer reaches inside one.
- `pnpm lore:owner-text` (`tools/lore/owner-text.ts`) replaces the run-folder script of the addendum
  above, and `aubaine-lore-canon` gains a provenance mode
  (`.claude/skills/aubaine-lore/references/canon.md` § Provenance).

---

## Decision 2: One writer, five read-only reviewers, and blind first reads

### Decision

- `aubaine-lore-writer` is the only agent that changes a lore page.
- Five reviewers have `tools: Read, Grep, Glob`, and the researcher adds WebFetch and WebSearch:
  - `aubaine-lore-canon`;
  - `aubaine-lore-gameplay`;
  - `aubaine-lore-editor`, called once per locale;
  - `aubaine-lore-critic`;
  - `aubaine-lore-researcher`.
- The editor loses Edit. It returns findings with exact replacements, and the writer applies the
  findings the orchestrator accepts.
- A reviewer gets the brief, the files, the frozen list and the decider's decisions. It never gets
  the draft history or another reviewer's findings. The orchestrator settles conflicts in this
  order: canon and mechanics, player comprehension, the mysteries the canon keeps, structure, prose,
  concision.
- Findings carry a severity (BLOCKER, MAJOR, MINOR, SUGGESTION), evidence and a remedy. At most two
  fix rounds follow the final panel; what stays MAJOR goes to the decider as a documented limitation.
- The reader prose of a species file (`roleplay.text`, `subspecies[].text`) stays with
  `aubaine-content`. A lore run hands it the path of its brief, whose fact map says what the field
  holds.

### Rationale

- A reviewer that cannot write cannot change a page it is judging. The subagent documentation states
  that `tools` is an allowlist, and that a subagent can still reach unlisted skills only when `Skill`
  is in that list. Checked in `https://code.claude.com/docs/en/sub-agents` on 2026-11-07.
- Separate contexts keep each lens from adopting another's conclusions. That is the reason 0050
  Decision 2 gave each pass its own subagent.
- The decider chose to keep `roleplay.text` in `aubaine-content` on 2026-11-07. The survey of the
  Elfe page counted 7 sentences of that field paired with sentences of the lore sections in French,
  and 6 in English (`pnpm lore:survey elfe`), the cost of two writers working without a shared map.

### Alternatives considered

- **Separate French and English editors**: rejected because the two would share three of their four
  lens files. One agent with the locale's file per call does the same work. Reopens if the two
  editions need lenses that diverge further.
- **Reviewers that edit, as the lore editor did**: rejected for the reason in the rationale.
- **Moving the species reader prose into `aubaine-lore`**: declined by the decider. Reopens on the
  decider's request.

### Addendum (2026-11-08): a note on the decider's text reaches the decider

- The first Elfe round's diagnostic panel raised three findings on text the second round restored as
  the decider's: three subjects under one heading (`tmp/lore-runs/2026-11-07-elfe-revise/diag-gameplay.md`,
  B3, MAJOR), « druidique » in five parts (`diag-critic.md`, row 17), and « magie lunaire »
  (`diag-editor-fr.md`, question 4). The first round answered B3 with a new title, and its C1 report
  listed « magie lunaire » among the mysteries kept open (`report.md` § 6); the second round
  restored the decider's text, and the findings closed with it. None reached the decider as a question, and the
  decider raised all three in the fourth round (`request.md`, lines 1768 to 1770).
- The skill gave a note no path to the decider: the brief holds no findings, C0 showed only the
  brief, and C1 listed proposals, inferences, conflicts and limitations, never notes.
- So every note and question for the decider, from a reviewer or the writer, every finding held for
  the decider, and every finding whose remedy a later round undid, goes into `owner-notes.md` in the
  run folder, with its file and line, unless an answer of the decider has closed it. C0 shows
  `owner-notes.md` beside the brief, every C1 lists its open rows, and an audit writes them into
  `audit.md`. A remedy that changes only a heading never settles a section of several subjects
  (`.claude/skills/aubaine-lore/SKILL.md` § The run, steps 1, 4, 6 and 11;
  `.claude/skills/aubaine-lore/references/review.md` § Synthesis).

---

## Decision 3: The canon ledger records how sure the world is

### Decision

- Each claim gets one of eight statuses in
  `.claude/skills/aubaine-lore/references/canon.md`: `CANON`, `BELIEF`, `DISPUTED`, `MYSTERY`,
  `UNKNOWN`, `CONFLICT`, `PROPOSAL`, `INFERENCE`.
- Only the decider or the canon makes a `MYSTERY`. An `UNKNOWN` is reported and never filled.
- A parity mode compares the French and English ledgers for drift in certainty, facts,
  relationships, rules and setting names. Names are checked against the English already in use; no
  list of names is kept.
- Canon the decider settles in conversation goes into
  `.claude/skills/aubaine-lore/references/rulings.md` the day it is given. Once a page carries the
  fact, the entry keeps only what it ruled out.

### Rationale

- The four verdicts of 0050 could not tell a chosen mystery from a gap, or a belief from a fact. The
  request names both confusions as failures to avoid.
- On 2026-09-25 the decider refused a repository rule about English names. The parity check reads
  the existing `*.en.*` files instead, so the names have a single source.
- The canon the decider gave on 2026-11-03 to 2026-11-07 was recorded only in an assistant's memory,
  which the repository cannot see.

### Alternatives considered

- **A FR/EN glossary of setting names**: declined by the decider on 2026-11-07. Reopens on the
  decider's request.
- **Keeping rulings in memory**: rejected because the repository is the only authority for canon
  (`.claude/rules/content/authority.md`).

---

## Decision 4: A survey tool and two data checks, with no hook

### Decision

- `pnpm lore:survey <target>` (`tools/lore/run.ts`, pure functions in `tools/lore/survey.ts`, tests
  in `tests/unit/lore-survey.test.ts`) resolves a species or tree by id or name. For each part of
  the page, `roleplay.text` included, it reports words, first and last sentences, recurring terms
  and similar sentences across parts, and it lists the neighbour pages with their last change. It
  directs a reading and never decides a cut.
- `tests/data/integrity.test.ts` gains two checks:
  - authored prose (books, equipment, lore) holds no U+2013, U+2014, curly quote or special space;
  - a lore page and its English page keep the same `##` sections, the same pictures in order and
    the same name lines.
- The run folder records `git rev-parse HEAD` and `git status --porcelain` at intake. At the end, a
  file changed outside the run's allowlist is reported, never restored.
- No hook guards a run.

### Rationale

- Both data checks passed on every page on 2026-11-07, and both failed on a probe that added a
  section and an en dash to `data/lore/species/elfe.en.md`, then passed again once it was restored.
- Skill hooks register when the skill is invoked and keep running for the rest of the session, and
  an `Edit|Write` matcher does not see a Bash write. Checked in
  `https://code.claude.com/docs/en/skills` and `https://code.claude.com/docs/en/hooks-guide` on
  2026-11-07. Several sessions commit to this tree on the same day, so a scope hook or a restore
  would block or undo their work.

### Alternatives considered

- **A scope-guard script that hashes dirty files**: dropped because the per-pass snapshot guard of
  `.claude/skills/aubaine-content/SKILL.md` § The ledger already covers the files in scope. Reopens
  if a run changes a file outside its scope unnoticed.
- **A PreToolUse hook on Edit and Write**: rejected for the reasons above.

---

## Decision 5: `aubaine-lore` names its research sources

### Decision

- `.claude/skills/aubaine-lore/references/research.md` lists each outside source the skill learned
  from: book and page or URL, what it does, what was taken, what was refused, and the date read.
- A finding becomes practice only in the reference that owns the concept, stated as Aubaine's own.
- The other references, in every skill, stay principle-only as 0050 Decision 5 says. Everything
  under `data/` stays original and cites nothing, as 0008 Decision 3 says.

### Rationale

- The decider chose on 2026-11-07 to name the sources in the skill. That reverses the 2026-10-19
  choice for this one file.

### Alternatives considered

- **Sources only in the git-ignored run folder**: offered and declined by the decider on 2026-11-07.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `aubaine-lore` | modes, run, team, owner text, maintenance | `.claude/skills/aubaine-lore/SKILL.md` |
| Writer | the only agent that changes a page | `.claude/agents/aubaine-lore-writer.md` |
| Reviewers | canon, gameplay, editor, critic, researcher, read-only | `.claude/agents/aubaine-lore-*.md` |
| Ledger and parity | eight statuses, drift between editions | `references/canon.md` |
| Rulings | canon the decider settled that no page carries yet | `references/rulings.md` |
| Architecture | the parts of a page, one home per fact, the fact map | `references/architecture.md` |
| Review contract | report, severities, synthesis, gates | `references/review.md` |
| Research | outside sources, dated | `references/research.md` |
| Survey | parts, recurring terms, similar pairs, neighbours | `tools/lore/`, `pnpm lore:survey` |
