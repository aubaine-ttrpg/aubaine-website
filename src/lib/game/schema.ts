import { z } from 'astro/zod'

import { ARCHIVE_FILE, BOOKLET_KINDS, RELEASE_FILE } from '../booklet/release.ts'
import { LOCALES } from '../i18n/locales.ts'
import { POLICY_KINDS } from '../i18n/routes.ts'
import { ICON_NAME_PATTERN } from '../rights/attribution.ts'

const SKILL_ID = /^[A-Z0-9]{5}-[0-9]{2}$/
const MACHINE_KEY = /^[a-z][a-z0-9-]*$/
const HEX = /^#[0-9a-f]{6}$/
const LIFE_COST = /^[1-9][0-9]*(d[1-9][0-9]*)?$/
const CHAPTER_FILE = /^[0-9]{2}-[a-z0-9-]+$/
const MEDIA_FILE =
  /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{1,2}_\d{1,2}-(?:og|cleaned|upscaled_[24])\.(?:png|jpg)$/
const MEDIA_CAPTION_FILE =
  /^(?:art|items|skills|unassigned|video)\/[a-z0-9]+(?:-[a-z0-9]+)*-\d{1,2}_\d{1,2}-(?:og|cleaned|upscaled_[24]|compressed)\.(?:png|jpg|mp4)$/
const VERSION = /^\d+\.\d+\.\d+$/
const SHORT_HASH = /^[0-9a-f]{8}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

const skillId = z
  .string()
  .regex(SKILL_ID)
  .describe(
    "Identité immuable d'une Compétence : cinq caractères tirés du nom, puis un numéro. Deux Compétences ne peuvent pas la partager, même dans deux arbres différents.",
  )

const domainKey = z
  .string()
  .describe("Clé de Domaine, telle qu'elle est déclarée dans data/meta/domains.json.")

const sizeKey = z
  .string()
  .describe("Clé de catégorie de taille, telle qu'elle est déclarée dans data/meta/sizes.json.")

const languageKey = z
  .string()
  .describe("Clé de langue, telle qu'elle est déclarée dans data/meta/languages.json.")

const creatureTypeKey = z
  .string()
  .describe(
    "Clé de type de créature, telle qu'elle est déclarée dans data/meta/creature-types.json.",
  )

const tagKey = z
  .string()
  .regex(MACHINE_KEY)
  .describe("Clé d'étiquette, telle qu'elle est déclarée dans data/meta/tags.json.")

const characteristicKey = z
  .string()
  .describe(
    "Clé de Caractéristique, déclarée dans data/meta/characteristics.json. La clé 'endurance' vient d'avant un renommage et reste acceptée : elle se résout vers 'constitution' au chargement.",
  )

export const CONTENT_STATUSES = ['draft', 'playtest', 'beta', 'balanced'] as const

const contentStatus = z
  .enum(CONTENT_STATUSES)
  .describe(
    "Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable : les listes le masquent tant que le lecteur n'affiche pas les brouillons ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre.",
  )

const mediaFile = z
  .string()
  .regex(MEDIA_FILE)
  .describe(
    "Nom de fichier d'image, sous la forme <nom>-<rapport>-<état>.<extension>. Le rapport s'écrit en plus petits termes, souligné à la place des deux points : 16_9 pour une bannière, 3_4 pour une couverture, 1_1 pour une illustration d'objet, et il doit décrire les pixels du fichier. L'état vaut og pour un fichier jamais retouché, cleaned pour un débruitage, upscaled_2 ou upscaled_4 pour un agrandissement. og et une retouche s'excluent.",
  )

export const position = z
  .object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })
  .strict()
  .describe(
    "Centre du nœud, en pourcentage de la planche, origine en haut à gauche. Posé à l'intégration, pas à l'autorat.",
  )

export const upgrade = z
  .object({
    level: z
      .number()
      .int()
      .min(2)
      .max(10)
      .describe("Palier dans l'échelle de la Compétence. La base est implicitement au niveau 1."),
    tier: z.number().int().min(1).max(10).describe('Palier de prix : PX rendu = 5 × tier.'),
    xpOverride: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe('Prix saisi par le concepteur, qui remplace celui du tier.'),
    title: z.string().min(1),
    domains: z
      .array(domainKey)
      .max(2)
      .optional()
      .describe(
        'Absent vaut hérité de la base, [] vaut explicitement aucun, rempli remplace. Ces trois états sont distincts et ne doivent jamais être confondus.',
      ),
    characteristics: z
      .array(characteristicKey)
      .optional()
      .describe('Absent vaut hérité, [] vaut explicitement aucune, rempli remplace.'),
    description: z
      .string()
      .min(1)
      .describe("Texte de règle de l'amélioration, même balisage que la Compétence de base."),
  })
  .strict()
  .describe(
    'Amélioration imbriquée : une extension de la Compétence de base, sans identifiant, sans position et sans ligne de stats propre. Deux améliorations peuvent partager un niveau.',
  )

export const skill = z
  .object({
    id: skillId,
    status: contentStatus.optional(),
    title: z
      .string()
      .min(1)
      .describe(
        'Nom imprimé. Un texte de règle appelle la Compétence par ce nom, entre doubles accolades.',
      ),
    type: z
      .enum(['passive', 'active', 'special'])
      .describe(
        'Forme du nœud sur la planche : rond pour active, carré arrondi pour passive, concave pour spéciale.',
      ),
    tier: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe('Palier de prix. Le PX rendu vaut 5 × tier, sauf si xpOverride le remplace.'),
    xpOverride: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe(
        'Prix saisi par le concepteur, qui remplace celui du tier. Nécessaire au-delà de 50 PX, que le tier ne peut pas atteindre.',
      ),
    showXp: z
      .boolean()
      .optional()
      .describe(
        'Absent vaut true. false pour une Compétence octroyée par un équipement ou par un autre nœud, et jamais achetée : le jeton doré disparaît.',
      ),
    art: mediaFile
      .optional()
      .describe(
        "Illustration au rapport 1:1, dans data/media/skills/ : ce que porte l'intérieur du nœud sur la planche et sur la carte de l'entrée. Absente, le nœud porte la planche 1:1 par défaut.",
      ),
    domains: z
      .array(domainKey)
      .max(2)
      .describe(
        "Domaine(s) réellement employé(s), choisis par Compétence et jamais repris de l'arbre. Donne la couleur de bordure. [] vaut Neutre ; deux Domaines donnent une bordure scindée à 135 degrés.",
      ),
    characteristics: z
      .array(characteristicKey)
      .optional()
      .describe(
        "Caractéristique(s) employée(s) par les Jets : icône(s) devant le titre. [] ou absent signifie que la Compétence n'appelle aucun Jet. 'any' marque une Caractéristique variable selon le contexte.",
      ),
    prerequisite: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Condition à remplir avant d'acheter la Compétence, rendue sur la ligne de stats : une Caractéristique et son seuil, une Espèce, un nombre de Compétences d'un Domaine. Absente : la Compétence n'en demande aucune.",
      ),
    activation: z
      .string()
      .optional()
      .describe(
        'Ce que la Compétence coûte pour être jouée : 1 Action, 1 Action Bonus, 1 Réaction, 1 Attaque pour une manœuvre qui remplace une Attaque, Passif, ou une durée. Une Réaction énonce son déclencheur en tête de sa description, jamais ici.',
      ),
    range: z.string().optional().describe('Portée, sur la ligne de stats.'),
    duration: z.string().optional().describe('Durée, sur la ligne de stats.'),
    concentration: z
      .boolean()
      .optional()
      .describe(
        "Rendue dans la durée sous la forme « Concentration · <durée> ». Ce n'est pas une étiquette.",
      ),
    recharge: z
      .enum(['short-rest', 'long-rest'])
      .optional()
      .describe(
        "Repos qui rend la Compétence une fois jouée, rendu sur la ligne de stats : « 1 fois par Repos court » pour 'short-rest', qu'un Repos long rend aussi, « 1 fois par Repos long » pour 'long-rest'. Absent : la Compétence se rejoue sans attendre de repos.",
      ),
    energy: z
      .number()
      .int()
      .min(0)
      .max(5)
      .optional()
      .describe(
        "Pastille ÉNERGIE. Zéro est une valeur réelle et se distingue d'une Compétence sans coût : elle affiche « 0 énergie ».",
      ),
    karma: z
      .number()
      .int()
      .min(1)
      .max(3)
      .optional()
      .describe(
        "Pastille KARMA. Une créature en garde 3 au plus et n'en récupère à aucun repos, alors une Compétence qui en coûte pèse lourd.",
      ),
    life: z
      .string()
      .regex(LIFE_COST)
      .optional()
      .describe('Pastille PDV : un coût payé en Points de vie, en dés (1d6) ou en nombre fixe.'),
    evolvesFrom: z
      .string()
      .regex(SKILL_ID)
      .optional()
      .describe(
        'Compétence dérivée : identifiant de la base, rendu « ▲ <titre> ». Réservé aux nœuds rattachés à une base, jamais aux améliorations imbriquées.',
      ),
    tags: z
      .object({
        practice: tagKey
          .optional()
          .describe(
            'Pratique : la manière dont la Compétence se pratique, une clé de practices. Une au plus.',
          ),
        school: tagKey
          .optional()
          .describe(
            "École : la famille d'effets de la Compétence, une clé de schools. Une au plus, et elle doit accepter la Pratique quand les deux sont posées.",
          ),
        specials: z
          .array(tagKey)
          .min(1)
          .optional()
          .describe('Spéciales : une ou plusieurs clés de specials, sans doublon.'),
      })
      .strict()
      .refine(
        (value) =>
          value.practice !== undefined ||
          value.school !== undefined ||
          value.specials !== undefined,
        { message: "une Compétence sans étiquette s'écrit en omettant la clé tags." },
      )
      .refine((value) => new Set(value.specials).size === (value.specials ?? []).length, {
        message: 'une Spéciale ne se répète pas.',
        path: ['specials'],
      })
      .optional()
      .describe(
        "Étiquettes rendues en pied d'entrée, dans l'ordre Pratique, École, Spéciales, chacune avec sa définition au survol. Aucune n'est obligatoire : une Compétence ne porte que celles qui servent l'équilibre, la saveur ou les combinaisons.",
      ),
    description: z
      .string()
      .min(1)
      .describe(
        "Texte de règle. Les retours à la ligne sont respectés, une ligne vide sépare deux paragraphes. Balisage : ***gras***, [[Nom d'état]], {{Nom de compétence}}, et [[[Nom d'état]]] pour un marqueur retiré du rendu.",
      ),
    upgrades: z
      .array(upgrade)
      .min(1)
      .optional()
      .describe('Améliorations imbriquées, rendues sous la carte par niveau croissant.'),
  })
  .strict()
  .refine(
    (value) => !(value.type === 'passive' && value.energy !== undefined && value.energy > 0),
    {
      message:
        "une Compétence passive ne coûte pas d'Énergie. energy: 0 reste permis pour marquer explicitement une absence de coût.",
      path: ['energy'],
    },
  )

export const placement = z
  .object({
    skill: skillId.describe('Identifiant de la Compétence posée, définie dans data/skills/.'),
    pos: position
      .optional()
      .describe(
        "Absent : la Compétence est listée avec l'arbre mais n'a pas de pastille sur la planche.",
      ),
    linked: z
      .array(z.union([z.string().regex(SKILL_ID), z.literal('CORE')]))
      .min(1)
      .optional()
      .describe(
        "Parents visuels vers lesquels tracer un trait. 'CORE' vise le cœur de l'arbre. Déclaré d'un seul côté : jamais de doublon inverse.",
      ),
  })
  .strict()

export const skillTree = z
  .object({
    id: z.string().regex(MACHINE_KEY).describe("Identifiant de l'arbre, qui devient son URL."),
    status: contentStatus.optional(),
    name: z.string().min(1).describe('Titre rendu sur la planche.'),
    subtitle: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Devise de l'arbre, rendue en italique sous le titre sur la page et sur la couverture du livret. Absente, le titre reste seul.",
      ),
    treeType: z
      .enum(['species', 'archetype', 'domain'])
      .describe('Rendu en sous-titre : Espèce, Archétype ou Domaine.'),
    size: z
      .union([z.literal(8), z.literal(16)])
      .describe('Nombre de Compétences que la planche est dessinée pour tenir.'),
    cover: mediaFile
      .optional()
      .describe(
        "Couverture au rapport 3:4, dans data/media/art/ : la planche verticale que porte la carte de l'arbre. Absente, la carte retombe sur la bannière, puis sur la planche 3:4 par défaut.",
      ),
    banner: mediaFile
      .optional()
      .describe(
        'Bannière au rapport 16:9, dans data/media/art/ : le bandeau derrière le héros et la vignette sociale. Absente, le héros retombe sur la planche 16:9 par défaut.',
      ),
    backCover: mediaFile
      .optional()
      .describe(
        'Quatrième de couverture au rapport 3:4, dans data/media/art/ : la planche verticale au dos du livret imprimé. Absente, le dos retombe sur la bannière recadrée en portrait.',
      ),
    core: z
      .object({
        label: z.string().min(1),
        sublabel: z.string().optional(),
        domains: z.array(domainKey).max(2).optional().describe("Bordure de l'emblème."),
        pos: position.optional().describe('Défaut : 50, 50.81.'),
      })
      .strict()
      .optional()
      .describe("Cœur de l'arbre. Absent : un nœud tient le centre."),
    placements: z
      .array(placement)
      .max(16)
      .describe(
        "Les Compétences de l'arbre et leur mise en page. L'ordre n'a pas d'effet au rendu. Vide : l'arbre est annoncé mais sa planche est encore nue, ce que seul un brouillon peut être.",
      ),
  })
  .strict()
  .refine((value) => value.placements.length > 0 || value.status === 'draft', {
    message: "un arbre sans Compétence ne peut être qu'un brouillon.",
    path: ['placements'],
  })

const stat = z.object({ label: z.string().min(1), value: z.string().min(1) }).strict()

const nameList = z.array(z.string().min(1)).min(1)

const subspecies = z
  .object({
    id: z
      .string()
      .regex(MACHINE_KEY)
      .describe(
        "Identifiant de la sous-espèce, unique dans son Espèce, et l'ancre de sa présentation.",
      ),
    name: z.string().min(1).describe('Nom rendu en intertitre. Il ne se traduit pas.'),
    text: z
      .string()
      .min(1)
      .describe("Présentation de la sous-espèce, même balisage qu'une Compétence."),
    names: z
      .object({
        masculine: nameList.describe('Prénoms masculins, dans leur ordre.'),
        feminine: nameList.describe('Prénoms féminins, dans leur ordre.'),
        family: nameList.describe('Noms de famille, dans leur ordre.'),
      })
      .strict()
      .optional()
      .describe(
        "Les noms que porte la sous-espèce. Ils ne se traduisent pas. Absent : elle n'en déclare pas encore.",
      ),
    offered: z
      .array(skillId)
      .describe(
        "Compétences que la sous-espèce ajoute à celles de son Espèce, définies dans data/skills/. Elles portent la sous-espèce en Prérequis. [] : elle n'en ajoute encore aucune.",
      ),
  })
  .strict()
  .describe(
    "Une sous-espèce : un nom, une présentation, ses noms et les Compétences qu'elle ajoute.",
  )

const roleplay = z
  .object({
    adulthood: z
      .string()
      .min(1)
      .optional()
      .describe("Âge auquel un membre de l'Espèce devient adulte."),
    lifespan: z.string().min(1).optional().describe("Durée de vie d'un membre de l'Espèce."),
    height: z
      .string()
      .min(1)
      .optional()
      .describe('Stature, en mètres. Distincte de la catégorie de taille, qui est une règle.'),
    text: z
      .string()
      .min(1)
      .optional()
      .describe("Ce qu'un joueur lit avant d'incarner l'Espèce, même balisage qu'une Compétence."),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'un bloc roleplay vide ne dit rien : omettez-le.',
  })

export const species = z
  .object({
    id: z.string().regex(MACHINE_KEY).describe("Identifiant de l'Espèce, qui devient son URL."),
    status: contentStatus.optional(),
    name: z.string().min(1).describe('Nom rendu en titre.'),
    subtitle: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Devise de l'Espèce, rendue en italique sous le titre. Absente, le titre reste seul.",
      ),
    cover: mediaFile
      .optional()
      .describe(
        "Couverture au rapport 3:4, dans data/media/art/ : la planche verticale que porte la carte de l'Espèce. Absente, la carte retombe sur la bannière, puis sur la planche 3:4 par défaut.",
      ),
    banner: mediaFile
      .optional()
      .describe(
        'Bannière au rapport 16:9, dans data/media/art/ : le bandeau derrière le héros et la vignette sociale. Absente, le héros retombe sur la planche 16:9 par défaut.',
      ),
    movement: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Déplacement de l'Espèce, quand il s'écarte des 9 mètres par défaut. Absent : 9 mètres.",
      ),
    types: z
      .array(creatureTypeKey)
      .min(1)
      .optional()
      .describe(
        "Type(s) de créature de l'Espèce. La plupart sont Humanoïdes ; un peuple façonné en cumule deux, Humanoïde et Artificiel. Absent : l'Espèce n'en déclare pas encore.",
      ),
    size: z
      .array(sizeKey)
      .min(1)
      .optional()
      .describe(
        "Catégorie(s) de taille. Plusieurs valent un choix laissé au joueur à la création, jamais un cumul. Absente : l'Espèce n'en déclare pas encore, ou elle la tient de son origine.",
      ),
    derivedFrom: z
      .enum(['origin', 'parents'])
      .optional()
      .describe(
        "D'où l'Espèce tient sa taille et son Déplacement quand elle ne les fixe pas elle-même : 'origin' pour une Espèce qui en était une autre avant, 'parents' pour une Espèce née de deux autres. Exclut `size` et `movement`, qui ne sont alors pas fixés.",
      ),
    languages: z
      .array(languageKey)
      .min(1)
      .optional()
      .describe(
        "Langue(s) que l'Espèce parle, lit et écrit. Absent : l'Espèce n'en déclare pas encore.",
      ),
    offered: z
      .array(skillId)
      .describe(
        "Compétences d'Espèce proposées au choix, définies dans data/skills/. Le personnage en retient deux à la création : elles sont Mémorisées sans occuper de Mémoire, ne coûtent pas de PX et ne se changent plus ensuite. Il peut acheter les autres plus tard, au prix imprimé. Une sous-espèce ajoute les siennes à celles-ci. [] : l'Espèce n'en propose encore aucune.",
      ),
    subspecies: z
      .array(subspecies)
      .min(1)
      .optional()
      .describe(
        "Les sous-espèces de l'Espèce, présentées sur sa page et jamais sur une page à elles. Le personnage en choisit une à la création. Absent : l'Espèce n'en compte aucune.",
      ),
    roleplay: roleplay
      .optional()
      .describe(
        "Ce qui sert à incarner l'Espèce plutôt qu'à la jouer mécaniquement. Absent : l'Espèce n'en déclare rien encore.",
      ),
  })
  .strict()
  .refine(
    (value) =>
      value.derivedFrom === undefined || (value.size === undefined && value.movement === undefined),
    {
      message:
        "une Espèce qui tient sa taille et son Déplacement de son origine n'en fixe aucun des deux.",
      path: ['derivedFrom'],
    },
  )

export const skillList = z
  .object({
    name: z.string().min(1),
    subtitle: z.string().optional(),
    note: z.string().optional(),
    skills: z.array(skillId).min(1).describe("Identifiants, dans l'ordre d'impression."),
  })
  .strict()

export const equipmentItem = z
  .object({
    name: z.string().min(1),
    status: contentStatus.optional(),
    section: z
      .string()
      .regex(MACHINE_KEY)
      .describe('Clé de la section du catalogue où la pièce est imprimée.'),
    position: z.number().int().min(0).describe('Rang dans sa section.'),
    kind: z
      .string()
      .min(1)
      .describe("Nature de l'objet, rendue avec la rareté : Armure, Arme de mêlée."),
    rarity: z.string().describe('Clé de rareté, déclarée dans data/meta/rarities.json.'),
    art: mediaFile
      .optional()
      .describe(
        "Illustration au rapport 1:1, dans data/media/items/. Plusieurs pièces peuvent partager la même. Absente, la fiche retombe sur l'illustration 1:1 par défaut.",
      ),
    price: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        "Prix en pièces de bronze, la plus petite pièce : 100 bronze font 1 argent, 100 argent font 1 or. Un seul nombre. Absent : l'objet ne s'achète pas.",
      ),
    set: z
      .string()
      .optional()
      .describe("Identifiant d'une Panoplie déclarée dans data/equipment/sets/."),
    headlines: z
      .array(stat)
      .min(1)
      .describe(
        "Les valeurs par lesquelles l'entrée est consultée : CA et sa formule pour une armure, Dégâts pour une arme. L'entrée nomme elle-même son intitulé, le gabarit ne connaît aucun type d'objet.",
      ),
    stats: z.array(stat).optional().describe('Cellules sous le bandeau.'),
    properties: z
      .array(z.object({ name: z.string().min(1), text: z.string().min(1) }).strict())
      .optional()
      .describe("Règles nommées portées par l'objet. Le nom porte sa ponctuation : « Finesse. »"),
    craft: z
      .object({
        discipline: z.string().describe('Clé déclarée dans data/meta/disciplines.json.'),
        cost: z.number().int().min(1).describe('Valeur de matière totale à atteindre.'),
        materials: z
          .array(z.string())
          .min(1)
          .describe('Types de matière acceptés. Chacun doit être représenté.'),
        sequence: z
          .array(z.string())
          .min(1)
          .describe("La fabrication dans l'ordre. Le travail physique précède le savoir."),
      })
      .strict()
      .optional()
      .describe("Absent : l'objet ne se fabrique pas."),
    grants: z
      .array(skillId)
      .min(1)
      .optional()
      .describe('Compétences accordées par la pièce, définies dans data/skills/.'),
    text: z.string().optional().describe("Corps de l'entrée : ce que fait l'objet."),
    description: z
      .string()
      .min(1)
      .describe('Une à deux phrases, rendues en italique sous le filet de pied.'),
  })
  .strict()

export const equipmentSet = z
  .object({
    id: z.string().min(1).describe("Identifiant, celui qu'une pièce nomme dans 'set'."),
    status: contentStatus.optional(),
    name: z.string().min(1),
    bonuses: z
      .array(
        z
          .object({
            pieces: z
              .number()
              .int()
              .min(2)
              .describe(
                'Combien de pièces doivent être portées ensemble. Deux au minimum : un palier à une pièce est une propriété de cette pièce.',
              ),
            text: z.string().min(1),
            grants: z.array(skillId).min(1).optional(),
          })
          .strict(),
      )
      .min(1)
      .describe('Les paliers, par nombre de pièces croissant.'),
  })
  .strict()

export const equipmentCatalogue = z
  .object({
    id: z.string().regex(MACHINE_KEY),
    name: z.string().min(1),
    shortName: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Titre court, pour les en-têtes courants et le pied de page où le titre complet ne tient pas. Absent, c'est 'name' qui sert.",
      ),
    subtitle: z.string().optional(),
    cover: mediaFile
      .optional()
      .describe(
        'Couverture au rapport 3:4, dans data/media/art/ : la planche verticale au recto du livret imprimé. Absente, la couverture retombe sur la planche 3:4 par défaut.',
      ),
    banner: mediaFile
      .optional()
      .describe(
        "Bannière au rapport 16:9, dans data/media/art/ : le bandeau derrière le héros de l'index d'équipement. Absente, le héros retombe sur la planche 16:9 par défaut.",
      ),
    backCover: mediaFile
      .optional()
      .describe(
        'Quatrième de couverture au rapport 3:4, dans data/media/art/ : la planche verticale au dos du livret imprimé. Absente, le dos retombe sur la planche 16:9 par défaut.',
      ),
    families: z
      .array(z.object({ key: z.string().regex(MACHINE_KEY), title: z.string().min(1) }).strict())
      .min(1)
      .describe(
        "Les grandes familles dans l'ordre de lecture. Le livret ouvre une feuille par famille, à l'intérieur de chaque rareté.",
      ),
    sections: z
      .array(
        z
          .object({
            key: z.string().regex(MACHINE_KEY),
            title: z.string().min(1),
            family: z.string().regex(MACHINE_KEY).describe("Clé d'une famille déclarée au dessus."),
            slot: z
              .string()
              .regex(MACHINE_KEY)
              .optional()
              .describe(
                "Clé d'un emplacement déclaré dans data/meta/slots.json : où la pièce se porte. Son glyphe ouvre le titre de section et répond aux cases de la fiche. Absent pour ce qui ne se porte pas.",
              ),
          })
          .strict(),
      )
      .min(1)
      .describe(
        "Les regroupements dans l'ordre de lecture. Une pièce nomme sa section par sa clé.",
      ),
  })
  .strict()

export const state = z
  .object({
    key: z
      .string()
      .regex(MACHINE_KEY)
      .describe("Identifiant machine, employé par l'ancre de la planche."),
    name: z
      .string()
      .min(1)
      .describe(
        "Nom imprimé, et ce qu'un texte de règle écrit entre doubles crochets. Il doit être unique.",
      ),
    forms: z
      .array(z.string().min(1))
      .optional()
      .describe(
        'Autres formes écrites du nom, accord et pluriel compris, reconnues dans un texte de règle. Le nom imprimé reste celui de name.',
      ),
    kind: z
      .enum(['buff', 'debuff', 'neutral'])
      .describe("Couleur de la pastille : ce que l'état fait à qui le porte."),
    icon: z
      .string()
      .regex(ICON_NAME_PATTERN)
      .describe(
        "Nom Iconify. Sans fichier correspondant dans data/media/icons/, l'état se rend sans icône.",
      ),
    color: z
      .string()
      .regex(HEX)
      .optional()
      .describe("Encre propre, lorsque les crans d'une même famille doivent se suivre à l'œil."),
    stacks: z
      .number()
      .int()
      .min(2)
      .max(10)
      .optional()
      .describe("Plafond d'accumulation. Absent : l'état est présent ou absent, sans compteur."),
    description: z
      .string()
      .min(1)
      .describe(
        "Ce que l'état fait et comment il prend fin. Quand il n'en fixe pas la durée, le DD ou les dégâts, la Compétence ou l'objet qui l'applique les indique.",
      ),
  })
  .strict()

const chapterFile = z
  .string()
  .regex(CHAPTER_FILE)
  .describe(
    'Fichier markdown à côté de book.json, sans extension. Le préfixe chiffré tient le dossier en ordre de lecture.',
  )

export const bookChapter = z
  .object({
    slug: z
      .string()
      .regex(MACHINE_KEY)
      .describe("Segment d'URL du chapitre. Il ne change pas quand le livre est réordonné."),
    file: chapterFile,
  })
  .strict()
  .describe(
    'Un chapitre est une page entière. Ses parties sont les titres markdown de son corps, pas des fichiers séparés.',
  )

export const book = z
  .object({
    id: z.string().regex(MACHINE_KEY).describe('Identifiant du livre, qui devient son URL.'),
    order: z
      .number()
      .int()
      .min(0)
      .describe('Rang du livre dans le menu et sur la page des livres.'),
    title: z.string().min(1),
    description: z.string().min(1),
    cover: mediaFile
      .optional()
      .describe(
        'Couverture au rapport 3:4, dans data/media/art/. Absente, la carte retombe sur la bannière, puis sur la planche 16:9 par défaut.',
      ),
    banner: mediaFile
      .optional()
      .describe(
        'Bannière au rapport 16:9, dans data/media/art/. Absente, le héros retombe sur la planche 16:9 par défaut.',
      ),
    backCover: mediaFile
      .optional()
      .describe(
        'Quatrième de couverture au rapport 3:4, dans data/media/art/ : la planche verticale au dos du livre imprimé. Absente, le dos retombe sur la bannière recadrée en portrait.',
      ),
    chapters: z
      .array(bookChapter)
      .describe(
        "Les chapitres du livre, dans l'ordre. Vide : le livre est un téléchargement seul.",
      ),
  })
  .strict()

export const vocabulary = z
  .array(
    z
      .object({
        key: z.string().regex(MACHINE_KEY),
        color: z.string().regex(HEX).optional(),
        iconName: z.string().regex(ICON_NAME_PATTERN).optional(),
        shapeKey: z.enum(['circle', 'square', 'concave']).optional(),
        bronzeValue: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            'Ce que vaut une pièce en bronze, la plus petite. Propre à data/meta/coins.json : un prix est un entier de bronze, et les pièces le découpent de la plus grande à la plus petite.',
          ),
        places: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            "Combien d'emplacements indépendants de ce genre une créature porte. Propre à data/meta/slots.json : tous valent 1 sauf le Bijou, qui vaut 2.",
          ),
        labelFr: z.string().min(1),
        labelEn: z.string().min(1),
        formsFr: z
          .array(z.string().min(1))
          .optional()
          .describe(
            'Autres formes écrites de labelFr, accord et pluriel compris, reconnues dans un texte de règle.',
          ),
        formsEn: z
          .array(z.string().min(1))
          .optional()
          .describe('Autres formes écrites de labelEn, pluriel compris.'),
        definitionFr: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Texte de l'infobulle du mot, en clair et sans balisage. Propre aux vocabulaires dont les mots portent une infobulle : les Caractéristiques et les Aptitudes.",
          ),
        definitionEn: z
          .string()
          .min(1)
          .optional()
          .describe("Texte anglais de l'infobulle, écrit avec definitionFr."),
      })
      .strict()
      .refine(
        (entry) => (entry.definitionFr === undefined) === (entry.definitionEn === undefined),
        {
          message: "une définition s'écrit dans les deux langues ou pas du tout.",
          path: ['definitionEn'],
        },
      ),
  )
  .min(1)

const tagWords = {
  labelFr: z.string().min(1),
  labelEn: z.string().min(1),
  definitionFr: z
    .string()
    .min(1)
    .describe("Texte de l'infobulle de l'étiquette, en clair et sans balisage."),
  definitionEn: z.string().min(1).describe("Texte anglais de l'infobulle."),
}

const practiceTag = z.object({ key: tagKey, ...tagWords }).strict()

const schoolTag = z
  .object({
    key: tagKey,
    practices: z
      .array(tagKey)
      .min(1)
      .describe(
        "Les Pratiques que cette École accepte : la matrice Pratique x École. Ouvrir une case est une décision d'équilibrage.",
      ),
    ...tagWords,
  })
  .strict()

const specialTag = z.object({ key: tagKey, ...tagWords }).strict()

export const TAG_KINDS = ['practice', 'school', 'special'] as const

export const TAG_TAXONOMY_FILE = 'tags.json'

export const tagTaxonomy = z
  .object({
    practices: z
      .array(practiceTag)
      .min(1)
      .describe('Pratiques : la manière dont une Compétence se pratique.'),
    schools: z.array(schoolTag).min(1).describe("Écoles : les familles d'effets."),
    specials: z
      .array(specialTag)
      .min(1)
      .describe('Spéciales : les particularités qui portent ou porteront une règle.'),
  })
  .strict()
  .superRefine((value, context) => {
    const entries = [...value.practices, ...value.schools, ...value.specials]
    const seen = { key: new Set<string>(), labelFr: new Set<string>(), labelEn: new Set<string>() }
    for (const entry of entries) {
      for (const field of ['key', 'labelFr', 'labelEn'] as const) {
        if (seen[field].has(entry[field])) {
          context.addIssue({
            code: 'custom',
            message: `${field} ${entry[field]} est déclaré deux fois.`,
          })
        }
        seen[field].add(entry[field])
      }
    }
    const practices = new Set(value.practices.map((entry) => entry.key))
    const accepted = new Set<string>()
    for (const school of value.schools) {
      if (new Set(school.practices).size !== school.practices.length) {
        context.addIssue({
          code: 'custom',
          message: `${school.key} nomme deux fois la même Pratique.`,
        })
      }
      for (const key of school.practices) {
        if (!practices.has(key)) {
          context.addIssue({
            code: 'custom',
            message: `${school.key} accepte ${key}, qui n'est pas une Pratique.`,
          })
        }
        accepted.add(key)
      }
    }
    for (const key of practices) {
      if (!accepted.has(key)) {
        context.addIssue({ code: 'custom', message: `aucune École n'accepte la Pratique ${key}.` })
      }
    }
  })

export const aubaineVersion = z.object({ version: z.string().min(1) }).strict()

export const policy = z
  .object({
    kind: z
      .enum(POLICY_KINDS)
      .optional()
      .describe(
        "Route que cette page occupe, déclarée par le fichier canonique seul. Une surcharge de langue l'omet : elle hérite de la route du fichier qu'elle traduit.",
      ),
    title: z.string().min(1).describe('Titre imprimé en h1 et dans le lien de pied de page.'),
    description: z
      .string()
      .min(1)
      .describe('Résumé d’une phrase, servant de meta description et de chapeau.'),
  })
  .strict()

export const pdfRelease = z
  .object({
    slug: z
      .string()
      .regex(MACHINE_KEY)
      .describe("Identifiant de l'arbre, du livre ou du catalogue dont ce PDF est le livret."),
    kind: z
      .enum(BOOKLET_KINDS)
      .describe(
        "Gabarit imprimé : 'tree' pour un livret d'arbre, 'book' pour un livre, 'equipment' pour le catalogue d'équipement.",
      ),
    locale: z.enum(LOCALES).describe('Langue du rendu.'),
    version: z
      .string()
      .regex(VERSION)
      .describe('Version du codex au moment du tirage, telle que data/aubaine.json la porte.'),
    styleHash: z
      .string()
      .regex(SHORT_HASH)
      .describe(
        "Empreinte de la présentation : les octets de tout ce qui décide de l'apparence imprimée. Elle bouge pour tous les livrets à la fois.",
      ),
    contentHash: z
      .string()
      .regex(SHORT_HASH)
      .describe(
        'Empreinte du contenu : les octets de ce que ce livret précis rend, la langue comprise. Elle ne bouge que pour lui.',
      ),
    file: z
      .string()
      .regex(RELEASE_FILE)
      .describe('Nom du fichier dans data/media/pdf/. Il porte les deux empreintes.'),
    archive: z
      .string()
      .regex(ARCHIVE_FILE)
      .optional()
      .describe(
        'Archive de data/media/pdf-archive/ qui garde ce fichier une fois la génération dépassée. Absente, le PDF est encore posé seul dans data/media/pdf/.',
      ),
    bytes: z.number().int().min(1).describe('Taille du fichier, pour la page des archives.'),
    pages: z.number().int().min(1).describe('Nombre de feuilles imprimées.'),
    generatedAt: z
      .string()
      .regex(TIMESTAMP)
      .describe(
        "Date du tirage, en UTC. Elle n'entre dans aucune empreinte : deux tirages du même contenu portent le même nom.",
      ),
  })
  .strict()
  .describe(
    "Un tirage. Le registre garde tout : un nouveau tirage s'ajoute, il ne remplace pas. Seule la génération courante reste posée fichier par fichier ; les précédentes passent en archive.",
  )

export const pdfReleases = z
  .object({ releases: z.array(pdfRelease) })
  .strict()
  .describe('Registre des tirages, écrit par pnpm pdf. Ne pas le modifier à la main.')

export const pdfNote = z
  .object({
    version: z.string().regex(VERSION).describe('Version du codex que cette note décrit.'),
    date: z.string().regex(DATE).describe('Date de la version, en AAAA-MM-JJ.'),
    fr: z.string().min(1).describe('Ce qui a changé, en français.'),
    en: z.string().min(1).describe('Ce qui a changé, en anglais.'),
  })
  .strict()
  .describe(
    'Une note de version, écrite à la main. Le registre dit quels livrets ont bougé ; la note dit ce qui a changé.',
  )

export const pdfNotes = z
  .object({ notes: z.array(pdfNote) })
  .strict()
  .describe('Le journal des versions, de la plus récente à la plus ancienne.')

export const mediaCaption = z
  .object({
    file: z
      .string()
      .regex(MEDIA_CAPTION_FILE)
      .describe(
        "Chemin du fichier sous data/media/, le dossier compris : 'items/dague-1_1-og.png'. Une entrée par fichier, jamais deux.",
      ),
    title: z
      .string()
      .min(1)
      .describe(
        "Nom de l'image, sans le studio. La signature « · Aubaine » est ajoutée à la gravure, ne l'écrivez pas ici.",
      ),
    description: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Ce que l'image montre, en français, en une phrase : « Dague à lame courbe et garde dorée, sur fond bleu. » Elle décrit les pixels, jamais la règle, et elle ne se déduit pas d'un texte de jeu. Absente, le fichier est gravé sans description.",
      ),
    keywords: z
      .array(z.string().min(1))
      .max(6)
      .optional()
      .describe(
        'Mots-clés propres à cette image, ajoutés après ceux que toute image porte : « arme », « objet ». Ils entrent dans dc:subject.',
      ),
  })
  .strict()
  .describe(
    "Ce qu'une image dit d'elle-même une fois gravée. Le bloc légal n'est pas ici : il est le même pour tout ce que le studio possède et vit dans src/lib/rights/claim.ts.",
  )

export const mediaCaptions = z
  .object({ captions: z.array(mediaCaption) })
  .strict()
  .describe(
    'Les légendes gravées dans les masters de data/media/. Écrit à la main, relu par pnpm media:stamp à chaque gravure.',
  )

const localized = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict()

export const overlays = {
  skill: localized({
    title: z.string().optional(),
    prerequisite: z.string().optional(),
    activation: z.string().optional(),
    range: z.string().optional(),
    duration: z.string().optional(),
    description: z.string().optional(),
    upgrades: z
      .record(
        z.string(),
        localized({ title: z.string().optional(), description: z.string().optional() }),
      )
      .optional()
      .describe('Améliorations traduites, keyées par leur niveau sous forme de chaîne.'),
  }),
  skillTree: localized({
    name: z.string().optional(),
    core: localized({ label: z.string().optional(), sublabel: z.string().optional() }).optional(),
  }),
  species: localized({
    name: z.string().optional(),
    subtitle: z.string().optional(),
    movement: z.string().optional(),
    subspecies: z
      .record(z.string(), localized({ text: z.string().optional() }))
      .optional()
      .describe("Présentations traduites, keyées par l'identifiant de la sous-espèce."),
    roleplay: localized({
      adulthood: z.string().optional(),
      lifespan: z.string().optional(),
      height: z.string().optional(),
      text: z.string().optional(),
    }).optional(),
  }),
  skillList: localized({
    name: z.string().optional(),
    subtitle: z.string().optional(),
    note: z.string().optional(),
  }),
  equipmentItem: localized({
    name: z.string().optional(),
    kind: z.string().optional(),
    headlines: z.array(stat).optional(),
    stats: z.array(stat).optional(),
    properties: z.array(z.object({ name: z.string(), text: z.string() }).strict()).optional(),
    craft: localized({
      materials: z.array(z.string()).optional(),
      sequence: z.array(z.string()).optional(),
    }).optional(),
    text: z.string().optional(),
    description: z.string().optional(),
  }),
  equipmentSet: localized({
    name: z.string().optional(),
    bonuses: z.record(z.string(), localized({ text: z.string().optional() })).optional(),
  }),
  equipmentCatalogue: localized({
    name: z.string().optional(),
    subtitle: z.string().optional(),
    sections: z.record(z.string(), z.string()).optional(),
  }),
  state: localized({
    name: z.string().optional(),
    forms: z.array(z.string()).optional(),
    description: z.string().optional(),
  }),
  book: localized({ title: z.string().optional(), description: z.string().optional() }),
}

export type ContentStatus = z.infer<typeof contentStatus>
export type Skill = z.infer<typeof skill>
export type Upgrade = z.infer<typeof upgrade>
export type Placement = z.infer<typeof placement>
export type SkillTree = z.infer<typeof skillTree>
export type Species = z.infer<typeof species>
export type Subspecies = z.infer<typeof subspecies>
export type SkillList = z.infer<typeof skillList>
export type EquipmentItem = z.infer<typeof equipmentItem>
export type EquipmentSet = z.infer<typeof equipmentSet>
export type EquipmentCatalogue = z.infer<typeof equipmentCatalogue>
export type GameState = z.infer<typeof state>
export type BookChapter = z.infer<typeof bookChapter>
export type Book = z.infer<typeof book>
export type Vocabulary = z.infer<typeof vocabulary>
export type VocabularyEntry = Vocabulary[number]
export type TagTaxonomy = z.infer<typeof tagTaxonomy>
export type TagKind = (typeof TAG_KINDS)[number]
export type SkillTags = NonNullable<Skill['tags']>
export type PdfRelease = z.infer<typeof pdfRelease>
export type PdfNote = z.infer<typeof pdfNote>
export type MediaCaption = z.infer<typeof mediaCaption>
