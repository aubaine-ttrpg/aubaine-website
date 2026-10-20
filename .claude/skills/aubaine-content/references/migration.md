# Migrating a design from another system

How the orchestrator prepares checkpoint C0 when the source was written for another game, as the
owner's early documents were written while Aubaine was a fork of one. The source gives the fiction
and the intent. Its mechanics never carry over on their own: each one is rebuilt from what the
repository already has, or goes to the owner.

## Extract

1. Take the source's text layer, never a retyping: `pdftotext -layout source.pdf out.txt`, from
   poppler. Save it in the run folder.
2. List every character the repository refuses or that hides a defect: U+2013, U+2014, curly
   quotes and apostrophes, no-break spaces, soft hyphens. A name with a hidden character is a
   question for the owner.
3. Split the source into fiction (history, customs, names, appearance), which `aubaine-lore` takes,
   and traits, which this skill takes.
4. Quote each trait whole, with its page, in the brief.

## Classify each construct

Every trait is made of constructs. Each class below asks one question, and its answer is a precedent
file or an owner decision.

| Construct in the source | The question | Where Aubaine answers it |
| --- | --- | --- |
| Ability score increases | What does an Espèce give? | `data/books/livre-du-joueur/04-les-especes.md` § Ce qu'une Espèce apporte |
| A skill proficiency | Which Aptitude takes the Expertise, chosen when? | `formulary.md` § expertise-grant |
| A bonus that grows with level, a rating, a challenge value | What fixed value or redesign replaces the scaling? | none: Aubaine has no character level; owner |
| A saving throw against a computed DC | Which pair defends, which pair sets the DD? | `formulary.md` § resisted-effect, § dd |
| Uses per rest, uses equal to a bonus | An Énergie cost, or a `limit`? | `balance.md` § Owner rulings; the runbook's `limit` trap |
| A condition | Which state, and does its Aubaine definition match the intent? | `data/states/`, read the definition, not the name |
| Advantage on a kind of save | 1 Avantage on the Jets that resist it | `formulary.md` § avantage-gain |
| A reroll | The reroll wording of a settled entry | CONELF-001 |
| Resistance to a damage type | The damage rule of chapter 11 | `formulary.md` § damage-resistance |
| Seeing in the dark | What exactly does the creature see, in plain words, with no light levels (`writing.md` § House craft)? | `data/books/livre-du-joueur/08-l-exploration.md` § La visibilité |
| Ignoring difficult terrain | The rule term and its settled wording | `formulary.md` § free-difficult-terrain |
| Replacing an attack | An `activation` of « 1 Attaque » and the manoeuvre wording | CROSAN-001, MENDAN-001; `formulary.md` § attack-manoeuvre |
| A spell cast through a trait | Aubaine has no spell list: a Compétence, redesigned, or nothing | owner |
| A feature gated by level | Available on purchase, or priced higher | owner |
| Speed, size, age, height | The species fields | `docs/runbooks/add-a-species.md` |
| Sub-races | `subspecies`, and which word the Espèce uses for them | `naming.md` |

## Search for a precedent

1. Name the concept in Aubaine's words first, then search `data/skills/`, `data/states/` and
   `data/books/` for it.
2. Keep only settled entries: resolve each hit's status as `writing.md` § Any entry says. A draft is
   never a precedent.
3. Read the hit whole. A name that matches can hide a different mechanic.
4. Check `RULE_TERMS`, `data/meta/` and `data/states/` before proposing a new term, so nothing
   restates an existing one.
5. When nothing settled covers the construct, the row reads « owner decision », with two or three
   options the owner can pick from, each costed against `balance.md`.

## The C0 table

```
| # | Source construct (quote, page) | Proposed treatment | Precedent, or owner decision | Options |
```

One row per construct, plus rows for the pool composition, each Compétence's title and id, its
price, where the name lists go, the status at the end of the run, and any file the run deletes. The
owner's answers are copied into the brief verbatim.

## Scan the result by sense

After the run, read every new text for the source system's vocabulary, by sense and not by string,
because some of its words are Aubaine words too: Aubaine has a Repos court, an upgrade has a
level, and a chapter speaks of a modifier. What may not survive is the foreign meaning: a saving
throw, a proficiency bonus, a character level, a challenge rating, a wisdom score, a race, a spell
slot, a casting ability.
