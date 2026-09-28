# Choose a skill id

Produces the id a new skill carries: its filename in `data/skills/`, the key every tree, list, species, item and set uses to name it, and the last segment of its node page URL.

An id is never invented. It is drawn from the skill's French title by the rule below, and `pnpm skill:id` applies the rule for you.

## The shape

```
SURCHA-001
```

Six capital letters or digits, a hyphen, three digits: `^[A-Z0-9]{6}-[0-9]{3}$`. The letters come from the French title, because French is the source language and every skill has a French title. The number is `001` unless the skill derives from another.

## The command

```
pnpm skill:id "Mur de pierre"
pnpm skill:id "Détection primordiale" --owner Poisse
pnpm skill:id --evolves COURRO-001
```

The first form prints the id for a title. The second prints it for a title several trees or species share, `--owner` naming the tree or the species by its French name. The third prints the next number for a skill that derives from the one named. When the letters a title asks for are already held by another skill, the command says which one and prints the next free letters.

## The letters, step by step

1. Split the title into words on anything that is not a letter or a digit: spaces, apostrophes, hyphens, colons, commas.
2. Drop the small words, the articles, prepositions, conjunctions and pronouns that `FUNCTION_WORDS` in `tools/skill-id/derive.ts` lists (« de » is one), compared in lowercase with their accents, and any word of a single letter. « Pied sûr » keeps « sûr », because the comparison sees the accent that « sur » does not have. If nothing is left, keep every word.
3. Remove the accents, write `œ` as `OE` and `æ` as `AE`, and write the words in capitals.
4. Share six letters between the words, as evenly as possible, the extra letters going to the first words.

| Words | Letters from each |
| --- | --- |
| 1 | 6 |
| 2 | 3, 3 |
| 3 | 2, 2, 2 |
| 4 | 2, 2, 1, 1 |
| 5 | 2, 1, 1, 1, 1 |
| 6 or more | 1 from each of the first six |

5. A word shorter than its share keeps all its letters, and the ones it cannot give go one at a time to the words that still have some, starting from the first word: « Os de géant » is `OSGEAN`, « Pluie d'or » is `PLUIOR`.
6. A title with fewer than six letters in all is completed with `X`.

| Title | Letters |
| --- | --- |
| Surchauffe | `SURCHA` |
| Mur de pierre | `MURPIE` |
| Aviver les flammes | `AVIFLA` |
| Grand tour de passe-passe | `GRTOPP` |
| TOUT BRÛLER | `TOUBRU` |
| Chef-d'œuvre | `CHEOEU` |
| Mot à l'oreille | `MOTORE` |
| Rage | `RAGEXX` |

## The number

A skill with no `evolvesFrom` is `001`.

A skill with `evolvesFrom` takes the six letters of its base and the next free number, in the order the derived skills are added. Courroux is `COURRO-001`; Courroux: Brutalité, Courroux: Protection and Courroux: Féral are `COURRO-002`, `COURRO-003` and `COURRO-004`. Connaissances druidiques is `CONDRU-001` and its two Communications are `CONDRU-002` and `CONDRU-003`.

The number never separates two unrelated skills. Two base skills always differ by their letters.

## A title several trees share

Some skills exist once per tree under the same title, like Détection primordiale and Étendue martiale. Their letters are the initials of the first two words left by step 2, then four letters from the French name of the tree or the species that owns the skill, shared by step 4 and completed by step 6.

| Title | Owner | Letters |
| --- | --- | --- |
| Détection primordiale | Feu | `DPFEUX` |
| Détection primordiale | Foudre | `DPFOUD` |
| Étendue martiale | Eau | `EMEAUX` |
| Étendue martiale | Terre | `EMTERR` |

A one-word title gives its first two letters instead of two initials.

## When the letters are taken

The skill that already holds the letters keeps them. The newcomer replaces the last letter it took from its last word with that word's next unused letter, then the one after, and moves to the previous word when a word runs out. `pnpm skill:id` prints the first free result.

| Title | Held by | Letters |
| --- | --- | --- |
| Improvisation | Improviser, `IMPROV` | `IMPROI` |
| Marque de chair | Marchandage, `MARCHA` | `MARCHI` |
| Surcharge | Surchauffe, `SURCHA` | `SURCHR` |

## When the title changes

While a skill resolves to `draft`, by its own `status` or the one it inherits, its id follows its title. Rename it, then rename its file, its overlay and every reference to the new id the command prints. Its derived skills carry its letters, so they move with it, their `evolvesFrom` included.

From `playtest` on, the id never changes, even if the title does. A settled skill keeps the id it had when it left draft, and its node page keeps its URL. `pnpm data:check` derives every id from its title, so the rename of a settled skill also adds the skill to `TITLE_BEFORE_RENAME` in the `skill ids` checks of `tests/data/integrity.test.ts`, mapped to the title its letters were drawn from.

## How to check it

```
pnpm skill:id "<titre>"
pnpm data:check
```

`pnpm data:check` fails when an id does not follow its title, when a base skill is not `001`, when a derived skill does not carry its base's letters and a number above `001`, and when two base skills share letters.

## Traps

**Derive the id from the final French title.** A title that is still changing gives an id that has to change with it. Settle the title first.

**The letters are the French ones, even on the English page.** An English overlay changes the title a reader sees, never the id.

**An upgrade has no id.** Only a skill file does. A step that needs its own node is a derived skill with `evolvesFrom`, and it takes the next number.

**Never give a second skill a title another skill carries.** A title several skills share takes the owner form, so a second skill with the title changes the letters the first must carry, and a settled id cannot change. Share a title only while every skill that carries it is a draft, as the placeholder species skills do; otherwise choose another title. `pnpm skill:id` refuses a title that is already taken unless `--owner` names the tree or the species of the new copy.

**Rename every file with the id.** The skill file and its `.en.json` overlay are both named after the id, and every tree, list, species, item and set that names it moves with it in the same change.
