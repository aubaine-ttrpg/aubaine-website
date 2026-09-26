# Add a skill

Produces one skill card: a node on a plate, the node's own page where the card opens beside the plate, and a tooltip wherever rule text names it.

## The file to create

```
data/skills/<ID>.json
```

The filename is the id and nothing else. The id matches `^[A-Z0-9]{5}-[0-9]{2}$`: five capital letters or digits drawn from the name, a hyphen, then two digits. `SCHAU-01`, `RAGER-01`, `CBREP-01`.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `id` | required | Identité immuable d'une Compétence : cinq caractères tirés du nom, puis un numéro. Deux Compétences ne peuvent pas la partager, même dans deux arbres différents. | `^[A-Z0-9]{5}-[0-9]{2}$` |
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable : les listes le masquent tant que le lecteur n'affiche pas les brouillons ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `title` | required | Nom imprimé. Un texte de règle appelle la Compétence par ce nom, entre doubles accolades. | any non empty string |
| `type` | required | Forme du nœud sur la planche : rond pour active, carré arrondi pour passive, concave pour spéciale. | `active`, `passive`, `special` |
| `tier` | required | Palier de prix. Le PX rendu vaut 5 × tier, sauf si xpOverride le remplace. | integer 1 to 10 |
| `xpOverride` | optional | Prix saisi par le concepteur, qui remplace celui du tier. Nécessaire au-delà de 50 PX, que le tier ne peut pas atteindre. | integer 0 to 100 |
| `showXp` | optional | Absent vaut true. false pour une Compétence octroyée par un équipement ou par un autre nœud, et jamais achetée : le jeton doré disparaît. | `true`, `false` |
| `domains` | required | Domaine(s) réellement employé(s), choisis par Compétence et jamais repris de l'arbre. Donne la couleur de bordure. `[]` vaut Neutre ; deux Domaines donnent une bordure scindée à 135 degrés. | 0 to 2 keys from `data/meta/domains.json` |
| `characteristics` | optional | Caractéristique(s) employée(s) par les Jets : icône(s) devant le titre. `[]` ou absent signifie que la Compétence n'appelle aucun Jet. `any` marque une Caractéristique variable selon le contexte. | keys from `data/meta/characteristics.json` |
| `prerequisite` | optional | Condition à remplir avant d'acheter la Compétence, rendue sur la ligne de stats : une Caractéristique et son seuil, une Espèce, un nombre de Compétences d'un Domaine. Absente : la Compétence n'en demande aucune. | free text |
| `activation` | optional | Ce que la Compétence coûte pour être jouée : 1 Action, 1 Action Bonus, 1 Réaction, 1 Attaque pour une manœuvre qui remplace une Attaque, Passif, ou une durée. Une Réaction énonce son déclencheur en tête de sa description, jamais ici. | free text |
| `range` | optional | Portée, sur la ligne de stats. | free text |
| `duration` | optional | Durée, sur la ligne de stats. | free text |
| `concentration` | optional | `Rendue dans la durée sous la forme « Concentration · <durée> ». Ce n'est pas une étiquette.` | `true`, `false` |
| `recharge` | optional | Repos qui rend la Compétence une fois jouée, rendu sur la ligne de stats : « 1 fois par Repos court » pour `short-rest`, qu'un Repos long rend aussi, « 1 fois par Repos long » pour `long-rest`. Absent : la Compétence se rejoue sans attendre de repos. | `short-rest`, `long-rest` |
| `energy` | optional | Pastille ÉNERGIE. Zéro est une valeur réelle et se distingue d'une Compétence sans coût : elle affiche « 0 énergie ». | integer 0 to 5 |
| `karma` | optional | Pastille KARMA. Une créature en garde 3 au plus et n'en récupère à aucun repos, alors une Compétence qui en coûte pèse lourd. | integer 1 to 3 |
| `life` | optional | Pastille PDV : un coût payé en Points de vie, en dés (1d6) ou en nombre fixe. | `"6"`, `"1d6"` |
| `evolvesFrom` | optional | `Compétence dérivée : identifiant de la base, rendu « ▲ <titre> ». Réservé aux nœuds rattachés à une base, jamais aux améliorations imbriquées.` | a skill id that exists |
| `tags` | optional | Étiquettes rendues en pied d'entrée, dans l'ordre Pratique, Écoles, Spéciales, chacune avec sa définition au survol. Aucune n'est obligatoire : une Compétence ne porte que celles qui servent l'équilibre, la saveur ou les combinaisons. | an object with `practice` (one key), `schools` (one or two distinct keys) and `specials` (one or more keys), each optional, keys from `data/meta/tags.json`; never an empty object |
| `description` | required | Texte de règle. Les retours à la ligne sont respectés, une ligne vide sépare deux paragraphes. Balisage : `***gras***`, `[[Nom d'état]]` et `{{Nom de compétence}}`. | any non empty string |
| `upgrades` | optional | Améliorations imbriquées, rendues sous la carte par niveau croissant. | see [add-an-upgrade.md](add-an-upgrade.md) |

Key order is the order of this table. Keep it.

## A complete example

`data/skills/SCHAU-01.json`:

```json
{
  "id": "SCHAU-01",
  "title": "Surchauffe",
  "type": "active",
  "tier": 3,
  "domains": [
    "fire"
  ],
  "activation": "1 Action Bonus",
  "range": "Personnel",
  "duration": "jusqu'à 1 minute",
  "energy": 1,
  "tags": {
    "practice": "spell",
    "schools": [
      "protection"
    ]
  },
  "description": "Vous portez votre chaleur au-delà de ce que votre corps supporte au repos. Tant que Surchauffe dure, vous gagnez une résistance aux dégâts infligés par les Sorts d'Eau et par toute autre source magique d'Eau, et votre Vitesse augmente de 3 m."
}
```

## What appears on the site

The file alone creates no page. A skill is shown once a tree names it. Add the placement, then:

- `/fr/arbre/feu` and `/en/tree/feu`: the node on the plate, in the « Arbre de compétences » section after the lore.
- `/fr/arbre/feu/SCHAU-01` and `/en/tree/feu/SCHAU-01`: the same page with the card open in the pane beside the plate, the node circled in gold and its lines drawn gold. Choosing the node on the tree page leads here.
- Anywhere rule text writes `{{Surchauffe}}`, the name becomes a tooltip carrying the type, the tree and the first lines of the description.
- In the card footer, each tag shows its label and, on hover or keyboard focus, its definition. On `/fr/competences` and `/en/skills` the Pratique, École and Spéciale filters find it.

See [place-a-skill-on-a-tree.md](place-a-skill-on-a-tree.md) for the placement.

## How to check it

```
pnpm data:check
pnpm dev
```

Then open the tree page, choose the node and read its card in the pane.

## Traps

**A skill usually inherits its status, so leave `status` out.** An absent `status` takes the value of the tree that places the skill, then of an item that grants it, then of a set bonus that grants it. Write `status` only to contradict that owner, and write `"status": "balanced"` to say the skill is settled even though its tree is not. `balanced` prints no badge; it only stops the inheritance.

**A skill no owner covers shows nothing.** A Common Bank skill and a basic skill belong to a list, and a list carries no status, so those two kinds only ever badge from a `status` written on the skill itself.

**The id is permanent and unique across the whole repo.** Two skills may never share one, not even in two different trees. Before you invent an id, check that `data/skills/<ID>.json` does not exist. Three ids were renamed on import because they collided; see the known inconsistencies in [../data-contract.md](../data-contract.md).

**`energy: 0` is not the same as no `energy`.** `"energy": 0` prints a `0 énergie` pill, which says the skill costs nothing on purpose. Leaving the key out prints no energy pill at all, which says energy is not part of this skill. Pick the one you mean.

**A passive skill may not carry an energy cost above 0.** The schema rejects it: `une Compétence passive ne coûte pas d'Énergie. energy: 0 reste permis pour marquer explicitement une absence de coût.`

**Tags are optional, and each one has to earn its place.** `tags` holds up to three kinds of key from `data/meta/tags.json`: one Pratique, one or two Écoles, any number of Spéciales. For each slot, ask whether this skill needs it for balance, flavour or a combo; leave it empty otherwise, and leave `tags` out entirely when nothing applies. Each École must accept the Pratique it is paired with (its `practices` list). A key that is not declared, or declared in another slot, fails `pnpm data:check`. Never invent a tag for one skill: [add-a-tag.md](add-a-tag.md) says when a new one is justified.

**`spell` carries a rule.** A skill whose Pratique is `spell` is a Sort: it needs a Catalyseur equipped to be activated, whether it is passive or active. `shout` carries one too: a Cri only affects creatures that can hear it. Rule text that cites a tag writes « l'étiquette » followed by its French label exactly, `l'étiquette Illusion`, so the citation reaches every skill that carries it.

**A rest limit is `recharge`, never a sentence.** A skill that can be played once, then waits for a rest, writes `"recharge": "short-rest"` or `"recharge": "long-rest"`, and the stat line prints it. Do not restate it in the description, the way `activation`, `range` and `duration` are never restated either. A Repos long also recharges a `short-rest` skill.

**A Species Skill costs 25 PX unless it says otherwise.** Write `"tier": 5`. A skill a species offers is kept for free at creation, but the others are bought later at the printed price, and 25 PX is the default a designer departs from on purpose, through the tier or `xpOverride`.

**Never write `"key": null`.** Leave the key out. `pnpm data:check` fails on any explicit null in `data/`.

**`pos` and `linked` are not skill fields.** They belong to the tree file, because one skill can sit in more than one tree. The schema is strict and will reject them here.

**Rule text markup.** `***gras***` for bold, `[[Nom d'état]]` for a state pastille, `{{Nom de compétence}}` for a cross reference, a blank line for a paragraph break. Every name inside brackets or braces must match an existing state name or skill title exactly, or `pnpm data:check` fails.

**Adding the file is enough.** No index, no registry, no code change.
