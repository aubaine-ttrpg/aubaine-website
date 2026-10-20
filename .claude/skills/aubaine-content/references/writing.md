# Writing

The lens of pass 1, `aubaine-content-writer`. It turns an approved brief into entries that execute at
the table. Passes 2 to 6 refine what this pass writes; none of them invents what it left out.

## Any entry

1. Identify the entity kind and open its runbook in `docs/runbooks/`.
2. Read two or three siblings in the same directory. They carry the register, the terminology, and
   the level of detail Aubaine has settled on. Take them only from entries whose resolved status
   is `playtest`, `beta` or `balanced`. A `draft` is lorem ipsum or unverified text and is never a
   model, however finished it looks. Resolve the status as the build does: an entry that writes
   none inherits it from what owns it, and the `status` field in `src/lib/game/schema.ts` says
   from what. When the directory holds no settled sibling, read the nearest settled entries of the
   same kind elsewhere, and name the ones you used when you report.
3. Build the field skeleton from the schema. Decide every structured value before writing a sentence.
4. Write the mechanic until it is internally complete: trigger, subject, resolution, outcome, ending.
5. Reference by key what the reader should reach, `{{clé}}`, or `{{clé|texte}}` for an agreement.
   `keyword-logic.md` decides each word; this pass makes the first decision and pass 3 checks it.
6. Add flavor only where it gives the entry identity, and only where it cannot be read as a rule.

## Rule text

Precision outranks style. The reader is at a table, mid turn, deciding what happens.

Confirm every trigger, cost, target, resolution step, outcome, duration, limit, and reset condition
that the mechanic actually has, and none that it does not.

Write prose only after the mechanic is complete. Prose written first tends to invent mechanics to
justify its sentences.

The invariants every sentence must hold are in `.claude/rules/content/rule-text.md`: keep every
limitation, say each rule once, resolve in order, `pouvez` for a permission and the indicative for
an obligation, no stat field restated in prose. They load with the file; this pass applies them.

## Start from the subject

- A species, a tree or an item starts from what it is known for in the fiction: what this people
  does with its body, what this school of magic asks, what this object is for. The brief names its
  signature traits, approved at C0. Every entry carries one of them, the detail only it could carry
  (`.claude/skills/aubaine-prose/references/claims-and-evidence.md`).
- Set each entry beside the settled siblings of its kind, so it neither pales beside them nor
  overshadows them. The balance pass measures; this pass aims.
- A trait whose source belongs to another game is rebuilt from Aubaine's own mechanics, through the
  mapping approved at C0 (`migration.md`). Its old numbers and terms never carry over on their own.

## House craft

- One verb per action. Take the verb the formulary or the settled siblings use, « effectue »,
  « gagne », « subit », and keep it. A second verb for the same action reads as a second rule.
- A recurring effect is a hook other rules name: write its key, and keep its wording stable so a
  later Compétence or item can point at it.
- Write each formula in its canonical form from the start (`formulary.md`). Pass 4 catches a miss;
  it does not replace getting it right here.
- Write sentences, not label stacks. A keyword sits in a grammatical French sentence with its
  article and preposition (`keyword-logic.md` § Read it as a sentence).
- Flavour opens an entry only when the brief asks for it: one or two sentences, before the first
  rule, implying nothing the rules do not state, always in a paragraph of its own (owner,
  2026-10-20). `.claude/skills/aubaine-prose/references/flavor.md` says what anchors an image.
- A tag names what the effect does. A transformation is « Métamorphose », never « Protection »
  because it also shields (owner, 2026-10-20); read each tag's definition in `data/meta/tags.json`
  before choosing. What the body or the blood gives is Inné (the Dragonnor's breath, claws, flight
  and bite; Écho tribal), what a people teaches is Enseignement with no École (Persistance
  rustique, Instinct tribal), and a blow of the body that replaces an Attaque may carry Inné and
  Manœuvre together (Coup de sabot). An École goes on only when one fits (owner, 2026-10-20).
- Light takes no keyword and no levels: a Compétence says what the creature sees in plain words,
  « vous voyez dans le noir, en l'absence de lumière », never « Lumière faible » or « Lumière
  vive » (owner, 2026-10-20: « we drop dnd's bullshit about lighting level »; the Ténèbres keyword
  was removed the same day because the prose says it).
- A usage limit is the `limit` field and a grant is {{accordee}}: neither is written as a sentence
  (`formulary.md` § limit, § granted).
- Every correction the owner makes at a checkpoint becomes a rule in the reference that owns it, in
  the same change, dated and quoted, so no later run repeats it.
- An instruction to remove covers what it is about. « let's just remove everything else » after a
  dictated sentence removes the text that sentence replaces, never a rule the owner did not name:
  Legs de Charon lost its Feu resistance that way, and the owner asked for it back (2026-10-20).
  When removing would drop a mechanic the owner did not mention, ask.
- A species file carries reader prose in `subspecies[].text` and `roleplay.text`. Write them in the
  register of the settled species files, through the same flavour test.
- Write French only. The translator writes the English overlay after pass 4.

## What this pass returns

- One ledger row per file written, in the columns `SKILL.md` § The ledger gives.
- A limitation inventory per entry: cost, cap, the resolution (who rolls what against which DD,
  and what success and failure do), range and area, duration and its ending, use limit and reset,
  the order of chained effects. Passes 2 and 6 compare against it, so list every one the entry has.
- Every question the brief did not settle. A gap is a question, never a plausible value.
