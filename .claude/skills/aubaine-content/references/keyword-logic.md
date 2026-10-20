# Keyword logic

The lens of pass 3, `aubaine-content-keywords`, and the reference `aubaine-prose` and `aubaine-lore`
link to for every `{{...}}` they write. The first half says how a reference renders; § Deciding
whether a word takes a key is the procedure the pass runs.

Aubaine sets every load-bearing mechanical noun as an icon plus a coloured term. A player scanning a
plate finds what a rule depends on without reading the paragraph. This is the part of the house voice
that has to survive a rewrite of the prose around it.

Every link is an explicit reference by key, written by the author. A word without markup never
links. The index is built in `src/lib/game/build.ts` and applied in `src/lib/game/richtext.ts`, and
`docs/adr/0029-every-link-is-an-explicit-reference-by-key.md` records why. The printed plates in
`data/media/pdf/` show the result.

## The classes

| Class | Render | Key | List |
| --- | --- | --- | --- |
| Rule terms | own colour and icon | `slugify` of the French label, `{{action-bonus}}`, or the term's own `key` | `RULE_TERMS` in `src/lib/game/build.ts` |
| Category values | their category's colour and icon, unless the entry carries its own; the category's tooltip, titled by the value | `slugify` of `labelFr`: `{{grande}}`, `{{dragon}}`; a damage type adds its kind, `{{degats-feu}}` | the vocabulary a rule term names in `values`: `data/meta/sizes.json`, `creature-types.json`, `damage-types.json` |
| Characteristics | per term colour and icon | `slugify` of `labelFr`, `{{dexterite}}` | `data/meta/characteristics.json` |
| Aptitudes | one shared colour and one shared icon, own definition | `slugify` of `labelFr`, `{{visee}}` | `data/meta/aptitudes.json` |
| Tags | one shared colour and one shared icon, own definition | `slugify` of `labelFr`, `{{illusion}}` | `data/meta/tags.json` |
| States | kind colour and the state icon | the state `key`, its file name, `{{a-terre}}` | `data/states/` |
| Skills | badge, plus a tooltip carrying type, tree, and the opening of the description | the skill `id`, `{{TRAFEU-001}}` | `data/skills/` |
| Equipment items | the icon of the item's slot | the file name, `{{dague}}` | `data/equipment/items/` |
| Skill trees | the tree icon in the colour of its leading Domaine | the tree `id`, `{{feu}}` | `data/skill-trees/` |

A Caractéristique's key comes from its French label, not from its English machine `key`: `{{dexterite}}`,
never `{{dexterity}}`.

Rule terms, Caractéristiques and Aptitudes each show their own definition in the tooltip, read from
`RULE_TERMS` and the `definitionFr` and `definitionEn` fields of their vocabulary file. Tags show the
definition from `data/meta/tags.json`, in a chip in a card footer and wherever rule text writes their key.
A tag a rule term reads, as Sort reads `spell`, answers to that rule term. A definition, a tag's included, may itself carry references by key. The Rules page
renders them as links; a tooltip or a chip shows the same text flattened, each reference printing its
label or its written text, never its braces.

A skill enters the index if it is placed on a tree, named in a skill list, offered by a species,
or granted by an item or a set bonus, and it links to the first of those, in that order. A skill only
equipment grants links to its entry in the skills index.

Keys do not collide. A skill id has its own shape, and the build stops when two other entries answer
to the same key.

Every one of those lists grows. Read its source when you need the members, and never write a copy of
a vocabulary into prose, a rule, or a reference file: the copy is what falls out of date, and an
agent trusting the copy will miss terms that have since been added.

## What the writer controls

- `{{clé}}` links the entry and prints its default label: its label in the language the string is
  written in. A French string prints French labels, and so does a French string an English page
  falls back to. Only a string from an `.en` overlay prints English labels: an overlay writes
  `{{energie}}` and gets "Energy".
- `{{1d6 clé}}` counts: the amount, dice or a number, prints before the label inside the keyword,
  « 1d6 Dégâts de Feu ». Only a damage type takes one; `pnpm data:check` refuses it elsewhere.
- `{{clé|texte}}` links the same entry and prints `texte` exactly as written, as plain text with no
  markup inside. Plurals and agreements go there: `{{entrave|Entravée}}`, `{{energie|Énergies}}`,
  `{{GRIMOI-001|grimoire}}`. No entry carries a list of inflected forms, so any wording is
  available without declaring it first.
- A word without markup is plain text and never links, whatever its capitals. A common word used in
  its ordinary sense is therefore safe as it is, and capitals stay a matter of house style.
- Reference every occurrence of a word used in the gameplay sense its entry defines: « vous fait
  `{{memorisee|mémoriser}}` », « un `{{sort}}` », « `{{apprise|appris}}` ». A word used in its
  ordinary French sense stays bare, and so does a word that only looks like a term: « Jet de
  dégâts » names dice, not a `{{jet}}`. Write the term rather than a paraphrase: « un `{{sort}}` »,
  not « une Compétence qui porte l'étiquette Sort ».
- `pnpm data:check` fails on a key that does not resolve in the locale its string is written in, on
  `[[` anywhere, and on an icon the index names that has no file. It cannot see a term the author
  meant to link and left bare, nor written text that no longer agrees with its sentence: only
  reading the page catches those.
- Renaming a skill title or a state name moves no reference. It changes the default label wherever a
  reference writes no text, so read those sentences again after a rename.
- A tree or catalogue booklet prints every state and rule word its entries reference by key, with its
  definition, on its last pages. Nothing in the rule text asks for it beyond the reference.

## What the writer does not control

Activation, range, duration, the `limit` of use, and the energy, karma, and life costs are fields. The render builds the
stat line from them with its own icons. Never restate them in prose.

## Deciding whether a word takes a key

The rule (owner, 2026-10-20): a word takes a key when a rule defines it and plain prose does not
resolve it, when there is something behind the word. Tour, Grande and Type de créature are
keywords for that reason. A category with values is one rule with several sub-rules, as Jet has
Sauvegarde and Attaque: its values are keywords of their own (Taille gives {{grande}}, Type de
créature gives {{dragon}}, Dégâts gives {{degats-feu}}).

Braces separate rules from prose. A word in braces is the game's defined thing; a bare word keeps its
ordinary French meaning. The owner's example sets the line:

- « À force d'entraînement, vos attaques sont devenues létales. » is prose. The sentence tells a story
  and executes nothing, so « attaques » stays bare.
- « Vos {{attaque|Attaques}} infligent désormais 1d4 dégâts Contondants supplémentaires. » is a rule.
  It changes what every Attaque does at the table, so the word takes its key.

Run these steps over every candidate word, in both directions: a bare word that should link, and a
braced word that should not.

1. **Find the candidates.** A candidate is any word of a label's family in one of the sources in
   the table above: the label, its inflections, and the verb, noun or participle built on it
   (« mémoriser » for Mémorisée, « déplacer » for Déplacement, « aveugler » for Aveuglé). Read the
   sources themselves, never a copy of their members.
2. **Run the sense test.** Replace the word by its tooltip definition. If the sentence still
   executes the same way, and the word counts, costs, triggers, targets or names the defined thing,
   it takes its key. If the sentence turns into nonsense or into a different rule, it stays bare.
   A sentence that executes nothing, a flavour line, goes to step 8.
3. **Check the known homographs.** These examples show the trap; the sense test decides every
   other case.
   - « une action » is any act; « une {{action}} » is the Action a turn spends.
   - « l'action {{ATTAQU-001}} » keeps « action » bare: it names what Attaquer is, not the cost.
   - `{{attaque}}` is the rule word, an Attaque against a CA. `{{ATTAQU-001}}` is the Compétence de base
     Attaquer. They are two entries.
   - « Jet de dégâts » and « Jet d'initiative » name dice, not a `{{jet}}`, and stay bare.
   - « une {{resistance-degats}} aux {{degats-poison}} » is the damage rule of chapter 11, a
     keyword since 2026-10-20, as is {{vulnerabilite-degats}}. `{{resistance}}` is the Aptitude.
   - « {{degats-force}} » names a damage type. `{{force}}` is the Caractéristique.
   - « une Compétence » in the game sense is `{{competence}}`; an entry naming itself writes its own
     id, « {{PERRUS-001|cette Compétence}} » (owner, 2026-10-20).
   - A grant is « accorder », never « donner »: « {{FORDRA-001}} vous {{accordee|accorde}} … ».
   - « de la taille d'une caisse » is a size in the ordinary sense. `{{taille}}` is the rule term, and
     a height in metres is never a `{{taille}}`.
   - « vous apprenez » for learning a fact stays bare. `{{apprise}}` is a Compétence you bought.
4. **Keep contrasting pairs even.** Two words listed as members of one set, as in « passifs comme
   actifs » or « X ou Y », are a pair: when one of them has no entry, both stay bare, so « passifs »
   carries no key there. An
   ordinary word set against the term it does not count toward is not a pair, and the term keeps
   its key: in « vous déplacer de 1,5 m. Ce trajet ne compte pas dans votre
   {{deplacement|déplacement}} », the verb stays bare and the noun links.
   A list of three or more mixes keys and bare words as each member needs: « votre {{ca}}, votre
   {{vitesse}} et votre Initiative » keeps Initiative bare because it has no entry.
5. **Agree the written text.** `{{clé|texte}}` prints `texte` as written, so it agrees with its
   sentence in gender and case, and keeps the house capitals of game terms:
   « {{etourdi|Étourdie}} », « {{jet|Jets}} ». In number, a counted state stays invariant after a
   number, « 2 {{combustion}} », « autant de {{combustion}} », as every counted state does in the
   data; a resource agrees, « 2 {{energie|Énergies}} », « 2 {{glyphe|Glyphes}} ». No markup inside
   `texte`.
6. **Write the term, not a paraphrase.** « un {{sort}} », never « une Compétence qui porte
   l'étiquette Sort ». The owner's own words are the exception: when the owner dictates a
   sentence, its words stay, never replaced by a term's label, and a key goes on them only when
   the prose does not already say what they mean. « vous voyez dans le noir, en l'absence de
   lumière » says it, so « noir » stays bare (owner, 2026-10-20: « prose sufficie itself, it's
   useless »). Replace a paraphrase only when the term's definition says the same thing:
   Boule de Feu keeps « ce qui n'est ni porté ni transporté », because {{objet-libre}} adds a
   weight its sentence does not have.
7. **Link every gameplay occurrence,** every time it is written, not only the first.
8. **Leave flavour bare.** A flavour sentence executes nothing, so it carries no reference.
   The same holds for a `***Label.***` lead-in, because the parser prints a reference inside bold
   as literal text.
9. **Check every damage.** Each damage type is a keyword (owner, 2026-10-20), and the dice sit
   inside it: « {{6d6 degats-feu}} », « {{1d4 degats-contondant}} », printed « 6d6 Dégâts de
   Feu », « 1d4 Dégâts Contondants ». The keyword is the type, of the kind Dégâts, and its key is
   `degats-` and the type; the players see its `referenceFr` in `data/meta/damage-types.json`. A
   flat 1 agrees after the bar, « {{1 degats-feu|Dégât de Feu}} ». A type named without dice keeps
   the bare key. Unbraced « dégâts de Feu » is the legacy form.
10. **Never invent a key.** A concept with no entry that recurs across settled entries is a
    `proposal` row for a state or a rule term, checked first against the vocabularies so it does
    not restate an existing one. The owner decides.

## Read it as a sentence

Print every reference as its label, or as its written text, and read the sentence aloud. It must be
correct French, with its articles, prepositions and agreement.

- « un {{jet}} de {{melee}} » prints « un Jet de Mêlée »: a sentence.
- « Jet Mêlée », « Action Bonus Attaque »: a stack of labels with no grammar between them. That is a
  defect even when every key resolves. Fix it by writing the missing words, or with a `{{clé|texte}}`
  that agrees.

The same test applies in English with English labels: « a {{melee}} {{jet}} » prints « a Melee Roll ».

## English

An overlay keeps the same keys and writes English text after the bar where an agreement needs it,
`{{jet|Rolls}}`. The sense test is run again in English, because an English sentence can make a word
ordinary that was a rule in French, or the other way round.

## What this pass returns

One decision row per candidate word: file, field, the word with its neighbours, `key` or `bare`, the
step above that decided it. Then ledger rows for each change, and proposals for any missing entry.

## Book chapters

Chapters, the lore pages and the equipment guide resolve their references through a rehype plugin
registered in `astro.config.mjs`. The locale comes from the filename, so
`03-creer-un-personnage.en.md` resolves against the English index and prints English labels.

The plugin skips fenced code blocks, existing links and every heading, so a section title stays
plain and `pnpm data:check` refuses a reference in either. An inline formula is read like the rest of
the text: `` `{{force}} + {{melee}}` `` keeps its code look and its words become pills. Everything else
runs through the same `parseRuns` as an entry, which is why there is one parser and not two.

The author chooses every link in a chapter, exactly as in an entry. Every `{{...}}` renders, every
time it is written, and nothing is marked on the author's behalf, at a first appearance or anywhere
else.

Astro caches compiled markdown in `node_modules/.astro`, keyed on the markdown, not on the plugin. A
change to the plugin therefore does nothing until that directory is removed. Deleting `.astro` at the
repository root is not enough and is the easy mistake to make.
