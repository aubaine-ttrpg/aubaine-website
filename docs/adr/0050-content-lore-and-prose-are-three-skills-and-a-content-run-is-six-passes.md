# ADR: Content, lore and prose are three skills, and a content run is six passes by named subagents

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-20
**Revised:** 2026-10-20, the Sauvegarde, the pair of an Attaque and a DD written with its base extend the notation (addendum in Decision 3)
**Revised:** 2026-10-24, on the d20 a Compétence's DD has the base 8, and the criticals gain their forms (addendum in Decision 3)
**Revised:** 2026-10-24, the balance pass reads a measured report and gains the `measured` label (addendum in Decision 4)
**Deciders:** Kori
**Scope:** Which writing skill owns which reader facing surface, how a run of the content skill is
staged across subagents and owner checkpoints, the one wording each mechanical relationship takes,
and what the balance pass may claim. Reverses 0016 Decision 1 in part and amends 0008 Decision 1.
Does not cover the data model (0002), the overlay mechanism (0003), the schema contract (0004), the
reference syntax (0029), or the refused phrasings and the decidable checks, which 0016 Decisions 2
and 3 keep.

---

## Context

0016 Decision 1 put every word a reader sees under one skill, `aubaine-prose`, and rejected a split
on the owner's instruction. On 2026-10-19 the owner asked for three skills with separate jobs, each
with its own workflow and its own subagents: one for balanced gameplay content, one for prose, one
for lore. They gave the content workflow as six passes in order: write, shape for a reader with
ADHD, decide the keywords, apply reusable formulas, check the balance, check quality and
professionalism.

The ground before this change, verified in the working tree:

- `aubaine-prose` ran as a single agent with no subagent, no formulary and no balance pass.
- `.claude/skills/aubaine-content/` was an empty folder that git does not track. An earlier staged
  pipeline under that name, with a formulary and ADHD rules, had left no file behind.
- `.claude/agents/` did not exist.
- `tools/balance/` was empty and untracked, and `package.json` declared no balance script.

---

## Decision 1: Three skills, one owner per surface

### Decision

- `aubaine-content` owns every entity file under `data/` but `data/books/**` and `data/lore/**`: rule
  text, structured fields, flavour fields and English overlays.
- `aubaine-lore` owns `data/lore/**`, and standalone lore once a schema exists.
- `aubaine-prose` keeps the book chapters, the tooltip definitions, the Banque Commune `note`,
  `src/lib/i18n/strings.ts`, the policy pages and the composed titles. It also keeps the voice, the
  locale references and the tells, which the other two read by path.
- A reference lives in the skill that owns its concept and is never copied. The moves:

  | File | From `aubaine-prose` to |
  | --- | --- |
  | `keyword-rendering.md`, renamed `keyword-logic.md` | `aubaine-content` |
  | `clarity-checklist.md`, renamed `quality.md` | `aubaine-content` |
  | `one-entry-one-job.md`, `naming.md` | `aubaine-content` |
  | `lore.md` | `aubaine-lore` |
  | § In lore of `ai-tells.md`, now `lore-tells.md` | `aubaine-lore` |
  | the lore types of `future-content-types.md`, now `future-lore-types.md` | `aubaine-lore` |
  | § Any entry and § Rule text of `editorial-workflow.md`, now in `writing.md` | `aubaine-content` |

- `.claude/rules/content/editorial-style.md` routes each surface to its skill, and `lore-prose.md`,
  `rule-text.md` and `keywords-and-markup.md` name the skill or the reference that serves them.

### Rationale

- The three jobs fail in different ways. Rule text fails when two readers execute it differently or
  when it prices a mechanic wrong; lore fails when it invents canon; site prose fails when it reads
  as generated. One procedure written for all three gave each of them the checks of the others and
  missed the ones it needed: nothing in `aubaine-prose` measured an entry against a budget, and
  nothing traced a lore claim to a source line.
- The objection 0016 raised still holds where it applies, and the split respects it: the voice, the
  refused phrasings and the locale conventions stay in one place, in `aubaine-prose`, and the other
  two skills read them there rather than carry a copy.
- Ownership by file keeps a run inside one skill. A species file holds rule text and flavour fields
  side by side, so one skill writes the whole file; the lore page beside it is a separate file.

### Alternatives considered

- **Keep one skill**: rejected by the owner on 2026-10-19. Reopens if the three skills turn out to
  claim the same file.
- **Two skills, with lore inside prose**: rejected. Lore needs a canon verifier that traces every
  claim to a source line, which no other surface needs. Reopens if lore pages stop being written.

### Caveats

- `docs/adr/0019-a-sub-species-lives-on-its-species-page.md` cites the old path of
  `keyword-rendering.md`. It stays as written, and this record carries the move.

---

## Decision 2: A content run is staged across named subagents and two owner checkpoints

### Decision

- The main agent orchestrates. It writes the brief in `tmp/content-runs/<date>-<slug>/`, runs every
  command, merges the ledger, and is the only one that talks to the owner.
- Each pass is a subagent in `.claude/agents/`: `aubaine-content-writer`, `-adhd`, `-keywords`,
  `-formulary`, `-balance` and `-quality`, plus `-translator` for the English overlays. The lore and
  prose skills have their own: a writer, a canon verifier and an editor for lore, a writer and an
  editor for prose.
- C0 comes before any write: every decision the repository does not settle goes to the owner in one
  table, titles and ids included. C1 comes after the last check: the ledger, the balance findings,
  the open questions and both locales on `pnpm dev`. A commit follows only the owner's « commit ».
- A pass changes only what its lens names. The orchestrator snapshots the files before each pass and
  diffs them after it; a change no ledger row accounts for is restored and logged as reverted.
- No subagent has Bash, Agent or Skill in its tools.
- A failure that comes from an unclear instruction becomes a fix to the reference, proven by a rerun
  in propose mode and shown at C1.

### Rationale

- The owner gave the content workflow as passes in a fixed order. A subagent per pass gives each one
  a clean context and a single reference to apply, so the ADHD pass cannot drift into rewriting a
  mechanic and the keyword pass cannot drift into style.
- Earlier passes over the same kind of text broke what the owner had kept: a verifier rewrote a
  flavour line the owner had already accepted, and another dissolved labelled sections into prose.
  The snapshot guard turns that failure into a reverted hunk instead of a silent change.
- The `tools` field of a subagent cannot allow Bash for one command only; a specifier in
  `disallowedTools` removes the whole tool. Checked in the Claude Code subagent documentation,
  `https://code.claude.com/docs/en/sub-agents`, on 2026-10-19. Keeping every command with the
  orchestrator is the only way to stop a reviewer from running anything else.

### Alternatives considered

- **Run each skill in a forked context (`context: fork`)**: rejected. A fork does not see the
  conversation and cannot pause for the owner, and both checkpoints need them. Reopens for a pure
  audit with no checkpoint.
- **Give reviewers Bash for `pnpm data:check` and `git show`**: rejected for the reason above.
  Reopens if the harness lets a tool list allow a single command.

### Caveats

- The same documentation states that a running session watches only the agent directories that
  existed when it started. `.claude/agents/` is new with this change, so the session that created it
  must restart before a run can call its agents.
- A subagent's behaviour depends on the harness version it runs under.

---

## Decision 3: One wording for one mechanical relationship

### Decision

- `.claude/skills/aubaine-content/references/formulary.md` holds the house formulas, each with its
  French and English form, when it applies, the nearest wrong wording, dated counts, two settled
  examples and a status: approved, proposed or legacy.
- The roll notation, decided by the owner on 2026-10-19:
  - a roll that imposes the pair writes it in parentheses, « un {{jet}} ({{force}} + {{melee}}) »,
    and the English mirrors it;
  - a roll that names one half keeps « un {{jet}} de {{melee}} »;
  - a Compétence's DD stays « {{dd}} (10 + {{X}} + {{Y}}) » on 2d12.
- The legacy roll form, « un {{jet}} de {{X}} + {{Y}} », stays in every entry a run does not touch
  until a migration batch rewrites them together. It appeared in 112 skill and state files, 69 of
  them settled, measured on 2026-10-20 with a script kept out of the repository.
- `data/books/livre-du-joueur/02-comment-jouer.md` teaches the approved forms in both locales.
- A keyword sits in a grammatical sentence: once its label prints, « un {{jet}} de {{melee}} » reads
  « un Jet de Mêlée », never « Jet Mêlée » (owner, 2026-10-19).
- The formulary is an authoring reference only. A new formula needs the owner's approval.

### Rationale

- The same function in the same words, so a reader who has learned one resisted effect recognises
  the next and reads only what is new in it. That is what the owner asked the formulary for: logic,
  implicit links, and less to hold for a reader with ADHD.
- Counted measures keep the formulary honest. Every entry names its count and its examples, so a
  formula claimed to be the house form can be checked against the files.

### Alternatives considered

- **A check that refuses the legacy roll form**: declined by the owner on 2026-10-19. While both
  forms exist in settled entries, such a check would fail on 69 of them. Reopens after the migration
  batch.
- **A formulary page for players**: declined by the owner on 2026-10-19. Reopens if players ask for
  the formulas in one place.
- **Migrate every legacy entry in this change**: rejected for scope; it rewrites settled entries the
  owner has already reviewed, outside any run's checkpoints.

### Caveats

- Until the migration batch, settled entries print the legacy roll form beside new entries that
  print the approved one, and the chapter teaches only the approved one.
- Most English forms are `proposed`: only 33 skill overlays exist, so many formulas have no English
  precedent yet.

### Addendum (2026-10-20): the Sauvegarde, the pair of an Attaque, and a DD with its base

The owner extended the notation at the Nnor run's last checkpoint:

- A rule term, `Sauvegarde` (English "Save", icon `game-icons/dodge`), joins `RULE_TERMS` in
  `src/lib/game/build.ts`. It names any {{jet}} that a Compétence, an objet, a state or the
  environment imposes on a creature against a {{dd}}; a {{jet}} the player chooses to attempt stays a
  {{jet}}. A resisted effect writes « fait une {{sauvegarde}} ({{X}} + {{Y}}) contre votre {{dd}}
  (10 + {{X}} + {{Y}}) ».
- An Attaque carries its pair in parentheses, as a {{jet}} does: « Portez l'{{attaque}} ({{force}} +
  {{melee}}) avec vos sabots contre une créature à portée ».
- A DD is written with its base and its pair. « Votre {{dd}} vaut 10 + la {{caracteristique}} et
  l'{{aptitude}} du {{jet}} de cette {{attaque}} » stays only where the entry does not fix the pair.
- The Nnor and their Compétences are the first entries in these forms, and the base later rewrites
  start from. The chapters and every other entry keep their forms until a migration batch, as the
  legacy roll form does.

The forms are in `formulary.md` § save, § resisted-effect, § attack-vs-ca, § attack-manoeuvre and
§ dd-from-attack.

### Addendum (2026-10-24): the base of a DD is 8 on the d20

0056 moves every Jet to `1d20 + Caractéristique + Aptitude`.

- A Compétence's DD is « {{dd}} (8 + {{X}} + {{Y}}) », the base still printed in every entry. Every
  form above that writes the base 10 now writes 8, and `formulary.md` § dd says so.
- The two criticals are rule terms, `{{reussite-critique}}` and `{{echec-critique}}`, and
  `formulary.md` gives each its form.
- Every entry is converted in the same change, so no legacy DD base remains to migrate later.

---

## Decision 4: The balance pass is advisory, and labels what it could not measure

### Decision

- The balance pass edits nothing. Each finding carries its evidence and one label:
  `budget-checked`, `sibling-compared` or `unmeasured`.
- Its measures are `data/books/livre-du-mj/03-concevoir-une-competence.md` and
  `data/books/livre-du-mj/04-eprouver-l-equilibrage.md`, settled siblings only, and the owner
  rulings written in `.claude/skills/aubaine-content/references/balance.md` with their dates.
- A settled entry that sits uneasily with a ruling is a question for the owner, never a precedent.

### Rationale

- The owner rejected estimated balance numbers on 2026-10-11 and asked for evidence. The repository
  holds no simulator today, so a claim that needs one can only be labelled unmeasured.
- The owner asked for the pass now, advisory, and for the real balancing of Aubaine to come later.

### Alternatives considered

- **Leave the pass out until balance is defined**: declined by the owner on 2026-10-19.
- **A blocking pass**: rejected. The values of chapter 03 are a starting calibration, by its own
  words in chapter 04. Reopens when playtests have settled them.

### Addendum (2026-10-24): the pass reads a measured report

- The run gains a Measure step before pass 5. The orchestrator runs `pnpm balance report` for the
  entries in scope and writes `balance-tool.md` in the run folder
  (`.claude/skills/aubaine-content/SKILL.md`). 0057 Decision 5 records the tool.
- The pass reads that report first and labels what it gives `measured`, beside `budget-checked`,
  `sibling-compared` and `unmeasured`. It never recomputes a number the report gives.
- The pass still edits nothing, and stays without a shell. The rationale above no longer holds as
  written: the repository holds a measuring tool now. What the tool cannot read, a rider, a state, a
  trade, is still costed by hand or labelled unmeasured.

---

## Decision 5: Outside research informs the craft and is not listed

### Decision

- The references state as house principles what outside research on rules writing, cognitive
  accessibility and generated prose taught: one term per concept, one wording per function, short
  active sentences, keywords as hooks, the tells of generated text.
- They name no outside source. 0008 Decision 3, no document listing external material, stands.

### Rationale

- The owner chose principles without names on 2026-10-19, keeping 0008 Decision 3 intact.

### Alternatives considered

- **Name the sources in this record**: declined by the owner on 2026-10-19. It would need an
  addendum to 0008 Decision 3.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `aubaine-content` | gameplay content, six passes and a translator | `.claude/skills/aubaine-content/`, seven agents |
| `aubaine-lore` | lore, writer, canon verifier and editor | `.claude/skills/aubaine-lore/`, three agents |
| `aubaine-prose` | chapters, definitions, interface, policies, shared voice | `.claude/skills/aubaine-prose/`, two agents |
| Formulary | one wording per relationship | `.claude/skills/aubaine-content/references/formulary.md` |
| Balance | advisory, labelled findings | `.claude/skills/aubaine-content/references/balance.md` |
| Routing | surface to skill | `.claude/rules/content/editorial-style.md` |
