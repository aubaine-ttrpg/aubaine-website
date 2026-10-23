import { z } from 'astro/zod'

import {
  ALOFT_LANDMARK_KINDS,
  BUILDING_STYLES,
  CAVE_KINDS,
  GROUND_LANDMARK_KINDS,
  ISLE_FEATURES,
  LAND_LEVELS,
  MAP_KINDS,
  NATURAL_FEATURES,
  NATURAL_KINDS,
  PACES,
  RELIEF_KINDS,
  ROCKS,
  ROUTE_KINDS,
  SETTINGS,
  SETTLEMENT_FEATURES,
  TILE_TYPES,
  VESSELS,
  WATER_DEPTHS,
} from '../atlas/vocabulary.ts'
import { MAX_TILES } from '../atlas/world/grid.ts'
import { ARCHIVE_FILE, BOOKLET_KINDS, RELEASE_FILE } from '../booklet/release.ts'
import { LOCALES } from '../i18n/locales.ts'
import { POLICY_KINDS } from '../i18n/routes.ts'
import { ICON_NAME_PATTERN } from '../rights/attribution.ts'

const SKILL_ID = /^[A-Z0-9]{6}-[0-9]{3}$/
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
    "Identité d'une Compétence : six caractères tirés de son titre français, ceux de sa base pour une Compétence dérivée, puis un numéro à trois chiffres, 001 sauf pour une Compétence dérivée, selon docs/runbooks/choose-a-skill-id.md. Deux Compétences ne peuvent pas la partager, même dans deux arbres différents. Elle suit le titre tant que la Compétence est un brouillon, puis ne change plus.",
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
        "Nom imprimé, et libellé par défaut d'une référence {{clé}} vers cette Compétence, dont la clé est l'identifiant.",
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
    limit: z
      .object({
        times: z
          .number()
          .int()
          .min(1)
          .max(3)
          .describe('Combien de fois la Compétence se joue avant que sa limite ne la rende.'),
        per: z
          .enum(['turn', 'combat', 'hour', 'short-rest', 'long-rest'])
          .describe(
            "Ce qui la rend : chaque tour, chaque combat, chaque heure, un Repos court, qu'un Repos long rend aussi, ou un Repos long.",
          ),
      })
      .strict()
      .optional()
      .describe(
        "Limite d'usage, rendue sur la ligne de stats avec la flèche en boucle : « 1 fois par tour », « 2 fois par Repos long ». Jamais écrite dans la description. Absent : la Compétence se rejoue sans limite.",
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
        practices: z
          .array(tagKey)
          .min(1)
          .max(2)
          .optional()
          .describe(
            'Pratiques : la ou les manières dont la Compétence se pratique, une ou deux clés de practices, sans doublon.',
          ),
        schools: z
          .array(tagKey)
          .min(1)
          .max(2)
          .optional()
          .describe(
            "Écoles : la ou les familles d'effets de la Compétence, une ou deux clés de schools, sans doublon. Chacune doit accepter chaque Pratique posée.",
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
          value.practices !== undefined ||
          value.schools !== undefined ||
          value.specials !== undefined,
        { message: "une Compétence sans étiquette s'écrit en omettant la clé tags." },
      )
      .refine((value) => new Set(value.practices).size === (value.practices ?? []).length, {
        message: 'une Pratique ne se répète pas.',
        path: ['practices'],
      })
      .refine((value) => new Set(value.schools).size === (value.schools ?? []).length, {
        message: 'une École ne se répète pas.',
        path: ['schools'],
      })
      .refine((value) => new Set(value.specials).size === (value.specials ?? []).length, {
        message: 'une Spéciale ne se répète pas.',
        path: ['specials'],
      })
      .optional()
      .describe(
        "Étiquettes rendues en pied d'entrée, dans l'ordre Pratique, Écoles, Spéciales, chacune avec sa définition au survol. Aucune n'est obligatoire : une Compétence ne porte que celles qui servent l'équilibre, la saveur ou les combinaisons.",
      ),
    grants: z
      .array(skillId)
      .min(1)
      .optional()
      .describe(
        "Compétences que celle-ci accorde, définies dans data/skills/ : elles ne se jouent que tant que celle-ci dure. Elles ne s'achètent pas, ne figurent dans aucune liste ni aucune Espèce, et tiennent leur statut de la Compétence qui les accorde. Absent : elle n'en accorde aucune.",
      ),
    description: z
      .string()
      .min(1)
      .describe(
        'Texte de règle. Les retours à la ligne sont respectés, une ligne vide sépare deux paragraphes. Balisage : ***gras***, *italique*, et {{clé}} ou {{clé|texte}} pour lier un terme de règle, une Caractéristique, une Aptitude, un état ou une Compétence par sa clé. Un mot écrit sans balise reste du texte.',
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
        "Parents vers lesquels tracer un trait. Le trait compte au jeu : une Compétence ne s'achète que reliée à une Compétence déjà Apprise, et seul le cœur, sans lien, s'achète en premier. 'CORE' vise le cœur de l'arbre. Déclaré d'un seul côté : jamais de doublon inverse.",
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
        "Couverture au rapport 3:4, dans data/media/art/ : l'unique illustration de l'arbre, sur sa carte, dans son héros, sur la couverture de son livret et dans sa vignette sociale. Absente, la planche 3:4 par défaut.",
      ),
    backCover: mediaFile
      .optional()
      .describe(
        'Quatrième de couverture au rapport 3:4, dans data/media/art/ : la planche verticale au dos du livret imprimé. Absente, le dos retombe sur la planche commune que nomme src/lib/booklet/back-cover.ts.',
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

export const SUBSPECIES_LABELS = ['regional-origins', 'subspecies'] as const

const subspecies = z
  .object({
    id: z
      .string()
      .regex(MACHINE_KEY)
      .describe(
        "Identifiant de la sous-espèce, unique dans son Espèce, et l'ancre de sa présentation.",
      ),
    name: z
      .string()
      .min(1)
      .describe(
        "Nom rendu en intertitre. L'overlay anglais le traduit quand c'est un nom commun, comme Fantôme, et le laisse tel quel quand c'est un nom propre, comme Landenheit.",
      ),
    text: z
      .string()
      .min(1)
      .describe("Présentation de la sous-espèce, même balisage qu'une Compétence."),
    names: z
      .object({
        masculine: nameList.optional().describe('Prénoms masculins, dans leur ordre.'),
        feminine: nameList.optional().describe('Prénoms féminins, dans leur ordre.'),
        given: nameList
          .optional()
          .describe(
            "Prénoms d'une sous-espèce qui ne les range pas par genre, dans leur ordre. Absent : ses prénoms sont masculins et féminins.",
          ),
        family: nameList.optional().describe('Noms de famille, dans leur ordre.'),
      })
      .strict()
      .refine((names) => Object.values(names).some((list) => list !== undefined), {
        message: "une sous-espèce sans nom s'écrit en omettant la clé names.",
      })
      .optional()
      .describe(
        "Les noms que porte la sous-espèce, chaque liste dans son ordre. Ils ne se traduisent pas. Absent : elle n'en déclare pas encore.",
      ),
    imposed: skillId
      .optional()
      .describe(
        "Compétence que la sous-espèce impose, définie dans data/skills/ : l'une des deux Compétences d'Espèce que le personnage garde à la création, sans la choisir. Il choisit la seconde parmi celles de son Espèce et de sa sous-espèce. Elle porte la sous-espèce en Prérequis, n'appartient qu'à cette sous-espèce et ne figure dans aucun offered. Absente : le personnage choisit ses deux Compétences.",
      ),
    offered: z
      .array(skillId)
      .describe(
        "Compétences que la sous-espèce ajoute à celles de son Espèce, définies dans data/skills/. Elles portent la sous-espèce en Prérequis. [] : elle n'en ajoute encore aucune.",
      ),
  })
  .strict()
  .describe(
    "Une sous-espèce : un nom, une présentation, ses noms, la Compétence qu'elle impose et celles qu'elle ajoute.",
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
        "Couverture au rapport 3:4, dans data/media/art/ : l'unique illustration de l'Espèce, sur sa carte, dans son héros et dans sa vignette sociale. Absente, la planche 3:4 par défaut.",
      ),
    movement: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Vitesse de l'Espèce, quand elle s'écarte des 9 mètres par défaut. Absente : 9 mètres.",
      ),
    types: z
      .array(creatureTypeKey)
      .min(1)
      .optional()
      .describe(
        "Type(s) de créature de l'Espèce. La plupart sont Humanoïdes ; un peuple peut en cumuler deux, comme les Cindersöhls, Humanoïdes et Artificiels, ou les Nnors, Humanoïdes et Bêtes. Absent : l'Espèce n'en déclare pas encore, ou elle les tient de l'une de ses Espèces parentes.",
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
        "D'où l'Espèce tient sa taille et sa Vitesse quand elle ne les fixe pas elle-même : 'origin' pour une Espèce qui en était une autre avant, 'parents' pour une Espèce née de deux autres. Exclut `size` et `movement`, qui ne sont alors pas fixés.",
      ),
    languages: z
      .array(languageKey)
      .min(1)
      .optional()
      .describe(
        "Langue(s) que l'Espèce parle, lit et écrit. Absent : l'Espèce n'en déclare pas encore, ou elle les tient de son origine ou de l'une de ses Espèces parentes, selon derivedFrom.",
      ),
    offered: z
      .array(skillId)
      .describe(
        "Compétences d'Espèce proposées au choix, définies dans data/skills/. Le personnage en retient deux à la création : elles sont Mémorisées sans occuper de Mémoire, ne coûtent pas de PX et ne se changent plus ensuite. Il peut acheter les autres plus tard, au prix imprimé. Une sous-espèce ajoute les siennes à celles-ci, et peut imposer l'une des deux. [] : l'Espèce n'en propose encore aucune.",
      ),
    subspeciesLabel: z
      .enum(SUBSPECIES_LABELS)
      .optional()
      .describe(
        "Le nom que l'Espèce donne à ses sous-espèces, celui que le lecteur lit en intertitre, dans le sommaire, dans la table Jouer et sur le filtre : 'regional-origins' pour « Origines régionales », 'subspecies' pour « Sous-espèces ». Absent : 'regional-origins'. Ne s'écrit qu'avec subspecies.",
      ),
    familyNames: nameList
      .optional()
      .describe(
        "Les noms de famille que portent toutes ses sous-espèces, dans leur ordre, rendus avec ceux de chacune. Une sous-espèce qui déclare names.family remplace cette liste. Absent : chaque sous-espèce déclare les siens, ou n'en a pas. Ne s'écrit qu'avec subspecies.",
      ),
    familyNamesLabel: z
      .string()
      .min(1)
      .optional()
      .describe(
        "L'intitulé de ses noms de famille, ceux de familyNames comme ceux de ses sous-espèces, quand le peuple ne parle pas de noms de famille : « Yurtas » pour les Nnors, qui portent le nom de leur Yurta. Absent : « Noms de famille ». Ne s'écrit qu'avec des noms de famille.",
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
        "une Espèce qui tient sa taille et sa Vitesse de son origine n'en fixe aucune des deux.",
      path: ['derivedFrom'],
    },
  )
  .refine((value) => value.subspeciesLabel === undefined || value.subspecies !== undefined, {
    message: "une Espèce sans sous-espèce n'a pas à les nommer : omettez subspeciesLabel.",
    path: ['subspeciesLabel'],
  })
  .refine((value) => value.familyNames === undefined || value.subspecies !== undefined, {
    message:
      "une Espèce sans sous-espèce n'a personne à qui donner ses noms de famille : omettez familyNames.",
    path: ['familyNames'],
  })
  .refine(
    (value) =>
      value.familyNamesLabel === undefined ||
      value.familyNames !== undefined ||
      (value.subspecies ?? []).some((sub) => sub.names?.family !== undefined),
    {
      message: "une Espèce sans nom de famille n'a pas à les intituler : omettez familyNamesLabel.",
      path: ['familyNamesLabel'],
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
    position: z
      .number()
      .int()
      .min(0)
      .describe('Rang dans sa section, parmi les pièces de même rareté.'),
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
    prerequisite: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Condition à remplir pour équiper la pièce, rendue sous son nom : une Caractéristique et son seuil, une Espèce ou une sous-espèce. Absente : n'importe qui peut la porter.",
      ),
    headlines: z
      .array(stat)
      .min(1)
      .optional()
      .describe(
        "Les valeurs par lesquelles l'entrée est consultée : CA et sa formule pour une armure, Dégâts pour une arme. L'entrée nomme elle-même son intitulé, le gabarit ne connaît aucun type d'objet. Absent : l'entrée n'a pas de bandeau, son texte suffit.",
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
          .describe(
            "La fabrication dans l'ordre, un Jet par étape : le nom de la Caractéristique puis son DD. Le travail physique précède le savoir.",
          ),
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
    description: z
      .string()
      .min(1)
      .describe(
        "Présentation de la panoplie, imprimée sous son nom : d'où elle vient et à quoi elle ressemble. Aucune règle n'y figure.",
      ),
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

export const material = z
  .object({
    name: z.string().min(1).describe('Nom imprimé du matériau.'),
    status: contentStatus.optional(),
    types: z
      .array(z.string().regex(MACHINE_KEY))
      .min(1)
      .describe(
        "Types de matière, des clés déclarées dans data/meta/material-types.json. Dans une même fabrication, le matériau ne compte que pour l'un d'eux.",
      ),
    value: z
      .number()
      .int()
      .min(1)
      .describe(
        "Valeur de matière : ce que le matériau apporte au coût d'une recette, et ce qu'il rapporte revendu, en pièces d'argent.",
      ),
    description: z
      .string()
      .min(1)
      .describe("Une phrase de saveur : l'allure du matériau, là où on le trouve. Aucune règle."),
  })
  .strict()

export const environment = z
  .object({
    name: z.string().min(1).describe("Nom imprimé de l'environnement."),
    status: contentStatus.optional(),
    icon: z
      .string()
      .regex(ICON_NAME_PATTERN)
      .describe("Nom Iconify de l'icône, dessinée devant le nom de l'environnement."),
    die: z
      .number()
      .int()
      .min(2)
      .describe(
        'Nombre de faces du Dé de butin de cet environnement, que lance la Compétence Récolter.',
      ),
    description: z
      .string()
      .min(1)
      .describe(
        "Une phrase : ce que l'environnement recouvre et ce qu'on y ramasse. Aucune règle.",
      ),
    loot: z
      .array(
        z
          .object({
            from: z.number().int().min(1).describe('Premier résultat du dé qui donne cette ligne.'),
            to: z.number().int().min(1).describe('Dernier résultat du dé qui donne cette ligne.'),
            material: z
              .string()
              .regex(MACHINE_KEY)
              .describe('Matériau obtenu, le nom de son fichier dans data/materials/.'),
            quantity: z.number().int().min(1).describe('Combien de ce matériau la ligne donne.'),
          })
          .strict(),
      )
      .min(1)
      .describe(
        'La Table de butin, du plus petit résultat au plus grand. Les lignes couvrent chaque face du dé, une seule fois chacune.',
      ),
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
        "Les grandes familles dans l'ordre de lecture. Le livret les imprime à la suite, sans saut de page, et le titre de chaque page nomme la famille en cours à son sommet.",
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
      .describe(
        "Identifiant machine, employé par l'ancre de la planche et par {{clé}} dans un texte de règle.",
      ),
    name: z
      .string()
      .min(1)
      .describe(
        "Nom imprimé, et libellé par défaut d'une référence {{clé}} vers cet état. Il doit être unique.",
      ),
    kind: z
      .enum(['buff', 'debuff', 'neutral'])
      .describe("Couleur de la pastille : ce que l'état fait à qui le porte."),
    follows: z
      .string()
      .regex(MACHINE_KEY)
      .optional()
      .describe(
        "Clé de l'état dont celui-ci est le cran suivant, comme poisse-solide après poisse-liquide. Les états se rangent par ordre alphabétique, et une chaîne de crans se range à la place de son premier cran, dans l'ordre des crans.",
      ),
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
      .describe(
        "Encre propre de l'état, que portent son titre et chaque pastille qui le nomme, par exemple pour distinguer les crans d'une même famille.",
      ),
    description: z
      .string()
      .min(1)
      .describe(
        "Ce que l'état fait, jusqu'où il s'accumule s'il s'accumule, et comment il prend fin. Quand il n'en fixe pas la durée, le DD ou les dégâts, la Compétence ou l'objet qui l'applique les indique.",
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
        definitionFr: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Texte de l'infobulle du mot. Il peut citer une entrée par {{clé}} ou {{clé|texte}} : la page des règles en fait un lien, l'infobulle n'en garde que le texte imprimé. Propre aux vocabulaires dont les mots portent une infobulle : les Caractéristiques et les Aptitudes.",
          ),
        definitionEn: z
          .string()
          .min(1)
          .optional()
          .describe("Texte anglais de l'infobulle, écrit avec definitionFr."),
        referenceFr: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Ce qu'une référence à ce type montre au joueur : « Dégâts de Feu » pour le type Feu. Le mot-clé reste le type, de la sorte Dégâts, sous la clé {{degats-feu}}. Propre à data/meta/damage-types.json.",
          ),
        referenceEn: z
          .string()
          .min(1)
          .optional()
          .describe('Texte anglais de la référence, écrit avec referenceFr : « Fire damage ».'),
      })
      .strict()
      .refine(
        (entry) => (entry.definitionFr === undefined) === (entry.definitionEn === undefined),
        {
          message: "une définition s'écrit dans les deux langues ou pas du tout.",
          path: ['definitionEn'],
        },
      )
      .refine((entry) => (entry.referenceFr === undefined) === (entry.referenceEn === undefined), {
        message: "une référence s'écrit dans les deux langues ou pas du tout.",
        path: ['referenceEn'],
      }),
  )
  .min(1)

const tagWords = {
  labelFr: z.string().min(1),
  labelEn: z.string().min(1),
  definitionFr: z
    .string()
    .min(1)
    .describe(
      "Texte de l'infobulle de l'étiquette. Il peut citer une entrée par {{clé}} ou {{clé|texte}} : la page des règles en fait un lien, l'infobulle n'en garde que le texte imprimé.",
    ),
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
      .describe("Version d'Aubaine au moment du tirage, telle que data/aubaine.json la porte."),
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
    version: z.string().regex(VERSION).describe("Version d'Aubaine que cette note décrit."),
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

const LAYER_CHAR = /^[!-\-/-~]$/

const atlasId = z
  .string()
  .regex(MACHINE_KEY)
  .describe(
    "Identifiant d'un lieu, d'un lieu remarquable, d'une voie ou d'un établissement de l'Atlas.",
  )

const atlasTile = z
  .object({
    column: z
      .number()
      .int()
      .min(0)
      .describe("Colonne du hex, comptée depuis zéro à partir de l'ouest."),
    row: z
      .number()
      .int()
      .min(0)
      .describe(
        "Rangée du hex, comptée depuis zéro à partir du nord. Les rangées impaires sont décalées d'un demi-hex vers l'est.",
      ),
  })
  .strict()
  .describe('Un hex de la grille du monde.')

const atlasLayer = <V extends z.ZodType>(value: V, meaning: string) =>
  z
    .object({
      legend: z
        .record(z.string().regex(LAYER_CHAR), value)
        .describe(
          `Ce que chaque caractère des rangées veut dire : ${meaning}. Un caractère imprimable, jamais le point, qui marque un hex vide.`,
        ),
      rows: z
        .array(z.string().min(1))
        .min(1)
        .describe(
          "Une chaîne par rangée de la grille, du nord au sud, et un caractère par hex, d'ouest en est.",
        ),
    })
    .strict()

export const atlasWorld = z
  .object({
    name: z.string().min(1).describe('Nom du monde, imprimé sur le cartouche de la carte.'),
    status: contentStatus,
    kind: z
      .enum(MAP_KINDS)
      .describe(
        "La catégorie de la carte dans le sélecteur : une contrée (land), une étendue que l'on parcourt, ou une zone (area), un lieu à l'échelle d'une scène : donjon, intérieur, champ de bataille.",
      ),
    columns: z.number().int().min(2).describe('Nombre de hex par rangée.'),
    rows: z.number().int().min(2).describe('Nombre de rangées.'),
    hexKm: z
      .number()
      .positive()
      .describe("Largeur d'un hex, d'un bord au bord opposé, en kilomètres."),
    featured: z
      .object({
        places: z
          .array(atlasId)
          .describe("Lieux proposés quand rien n'est sélectionné, dans l'ordre."),
        landmarks: z
          .array(atlasId)
          .describe("Lieux remarquables proposés à leur suite, dans l'ordre."),
      })
      .strict(),
    emblem: z
      .string()
      .regex(/^[a-z0-9-]+-emblem\.svg$/)
      .optional()
      .describe(
        "L'emblème du monde, un SVG de data/media/ dessiné dans l'hexagone qui le représente. Sans emblème, le monde prend le logo d'Aubaine.",
      ),
  })
  .strict()
  .refine((world) => world.columns * world.rows <= MAX_TILES, {
    message: `la grille compte au plus ${MAX_TILES} hex.`,
    path: ['rows'],
  })
  .describe("Un monde de l'Atlas : son nom, sa maturité et sa grille.")

export const atlasSurface = z
  .object({
    height: atlasLayer(
      z
        .number()
        .int()
        .min(Math.min(...WATER_DEPTHS))
        .max(LAND_LEVELS.highest)
        .refine((level) => level !== 0, { message: "le palier 0 n'existe pas." }),
      `pour la terre, le palier d'altitude de ${LAND_LEVELS.lowest} à ${LAND_LEVELS.highest}, chacun de 160 m ; pour un lac, le palier de sa surface ; pour la mer, la profondeur de -1, le haut-fond, à ${Math.min(...WATER_DEPTHS)}, l'abysse`,
    ),
    type: atlasLayer(
      z.enum(TILE_TYPES),
      'le type de tuile, déclaré dans data/atlas/vocabularies.json',
    ),
    landmass: atlasLayer(
      atlasId,
      "le continent ou l'île, un lieu de data/atlas/<monde>/places.json",
    ),
    political: atlasLayer(
      atlasId,
      "la plus petite division politique, une région ou un pays sans région ; le pays d'une région est son parent",
    ),
    settlement: atlasLayer(atlasId, "le quartier, ou le village quand il n'a pas de quartier"),
    sea: atlasLayer(atlasId, "la mer ou l'océan"),
    relief: atlasLayer(
      atlasId,
      `le lieu naturel de relief, d'un genre parmi ${RELIEF_KINDS.join(', ')}`,
    ),
    cover: atlasLayer(
      atlasId,
      `le plus petit lieu naturel d'un autre genre que ${RELIEF_KINDS.join(', ')} qui couvre le hex, une forêt, un désert, un lac ; ses parents le couvrent aussi`,
    ),
    caves: z
      .array(
        z
          .object({
            tile: atlasTile,
            edge: z
              .number()
              .int()
              .min(0)
              .max(5)
              .describe(
                "Le côté du hex où s'ouvre la grotte : 0 à l'est, puis dans le sens des aiguilles d'une montre, 1 au sud-est, jusqu'à 5 au nord-est. Il doit donner sur une falaise.",
              ),
            kind: z.enum(CAVE_KINDS).describe("Ce que la lueur de l'entrée laisse deviner."),
          })
          .strict(),
      )
      .describe('Les entrées de grottes taillées dans les falaises.'),
  })
  .strict()
  .describe("La surface d'un monde, en couches d'une valeur par hex.")

const placeBase = {
  id: atlasId,
  parent: atlasId
    .optional()
    .describe(
      "Le lieu qui contient celui-ci. Un hex d'un lieu appartient aussi à tous ses parents.",
    ),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
}

const population = z.number().int().min(1).describe("Nombre d'habitants.")

const mapFeatures = <const T extends readonly [string, ...string[]]>(values: T, meaning: string) =>
  z
    .array(z.enum(values))
    .min(1)
    .refine((list) => new Set(list).size === list.length, {
      message: 'chaque élément une seule fois.',
    })
    .describe(meaning)
const ruler = z.string().min(1).describe('Qui gouverne.')

export const atlasPlace = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('continent'), ...placeBase }).strict(),
  z
    .object({
      kind: z.literal('country'),
      ...placeBase,
      color: z.string().regex(HEX).describe('Couleur du pays, dans la liste des lieux.'),
      capital: atlasId.optional().describe('La ville capitale.'),
      ruler: ruler.optional(),
      government: z.string().min(1).optional().describe('Le régime.'),
      population: population.optional(),
    })
    .strict(),
  z.object({ kind: z.literal('region'), ...placeBase }).strict(),
  z
    .object({
      kind: z.enum(['city', 'village']),
      ...placeBase,
      style: z.enum(BUILDING_STYLES).describe('Le style de ses maisons sur la carte.'),
      population: population.optional(),
      features: mapFeatures(
        SETTLEMENT_FEATURES,
        'Ce que la carte dessine autour du lieu : walls, des remparts.',
      ).optional(),
    })
    .strict(),
  z.object({ kind: z.literal('quarter'), ...placeBase }).strict(),
  z
    .object({
      kind: z.literal('natural'),
      ...placeBase,
      subtype: z.enum(NATURAL_KINDS).describe('Le genre de lieu naturel.'),
      features: mapFeatures(
        NATURAL_FEATURES,
        'Ce que la carte sème sur ses champs : windmills, des moulins plus nombreux.',
      ).optional(),
    })
    .strict(),
  z.object({ kind: z.literal('sea'), ...placeBase }).strict(),
  z.object({ kind: z.enum(['realm', 'network', 'cavern', 'hold-quarter']), ...placeBase }).strict(),
  z
    .object({
      kind: z.literal('hold'),
      ...placeBase,
      ruler: ruler.optional(),
      population: population.optional(),
    })
    .strict(),
])

export const atlasPlaces = z
  .object({ places: z.array(atlasPlace).min(1) })
  .strict()
  .describe("Tous les lieux nommés d'un monde, en surface, dans le ciel et sous terre.")

const landmarkBase = {
  id: atlasId,
  name: z.string().min(1),
  place: atlasId.optional().describe('Le lieu auquel il appartient.'),
  tile: atlasTile,
  height: z.number().int().min(1).optional().describe('Hauteur approximative, en mètres.'),
  length: z.number().int().min(1).optional().describe('Longueur approximative, en mètres.'),
  description: z.string().min(1).optional(),
}

export const atlasLandmarks = z
  .object({
    landmarks: z.array(
      z.discriminatedUnion('kind', [
        z
          .object({
            kind: z.enum(ALOFT_LANDMARK_KINDS),
            ...landmarkBase,
            altitude: z
              .number()
              .int()
              .min(1)
              .describe("Altitude de l'île volante, en mètres. Elle fixe sa hauteur sur la carte."),
            features: mapFeatures(
              ISLE_FEATURES,
              "Ce que la carte pose sur l'île : watchtower, une tour de guet ; standing-stones, un cercle de pierres levées ; chains, les chaînes qui la retiennent au sol.",
            ).optional(),
          })
          .strict(),
        z
          .object({
            kind: z.enum(GROUND_LANDMARK_KINDS),
            ...landmarkBase,
            footprint: z
              .number()
              .positive()
              .describe(
                "Rayon de son emprise autour du hex, en rayons de hex. Un hex mesure deux rayons d'une pointe à l'autre.",
              ),
            altitude: z
              .number()
              .int()
              .min(1)
              .optional()
              .describe('Altitude approximative de son sommet, en mètres.'),
          })
          .strict(),
      ]),
    ),
  })
  .strict()
  .describe("Les lieux remarquables d'un monde, posés hors de la grille des hex.")

const laneEnd = z.union([
  z.object({ landmark: atlasId }).strict(),
  z.object({ place: atlasId }).strict(),
])

export const atlasRoutes = z
  .object({
    routes: z.array(
      z
        .object({
          id: atlasId,
          kind: z.enum(ROUTE_KINDS),
          name: z.string().min(1),
          start: atlasTile.describe('Le premier hex de la voie.'),
          steps: z
            .string()
            .regex(/^[0-5]+$/)
            .describe(
              "Le chemin, un chiffre par pas vers le hex voisin : 0 à l'est, puis dans le sens des aiguilles d'une montre, 1 au sud-est, jusqu'à 5 au nord-est.",
            ),
          description: z.string().min(1).optional(),
        })
        .strict(),
    ),
    skyLanes: z
      .array(z.object({ from: laneEnd, to: laneEnd }).strict())
      .describe(
        "Les voies célestes des dirigeables, d'un lieu ou d'un lieu remarquable à un autre.",
      ),
  })
  .strict()
  .describe(
    "Les routes, sentiers, lignes, routes maritimes, rivières et voies célestes d'un monde.",
  )

export const atlasEstablishments = z
  .object({
    establishments: z.array(
      z
        .object({
          id: atlasId,
          kind: z
            .string()
            .regex(MACHINE_KEY)
            .describe("Genre d'établissement, déclaré dans data/atlas/vocabularies.json."),
          name: z.string().min(1),
          place: atlasId.describe("Le quartier, le village ou la caverne qui l'abrite."),
          tile: atlasTile.describe('Le hex où il se trouve, dans ce lieu et à son niveau.'),
          description: z.string().min(1).optional(),
        })
        .strict(),
    ),
  })
  .strict()
  .describe("Les établissements d'un monde : tavernes, temples, forges.")

export const atlasSky = z
  .object({
    islands: z.array(
      z
        .object({
          landmark: atlasId.describe(
            "L'île volante, un lieu remarquable dont le hex est le centre.",
          ),
          tiles: z
            .array(
              z
                .object({
                  column: atlasTile.shape.column,
                  row: atlasTile.shape.row,
                  type: z.enum(TILE_TYPES),
                  place: atlasId.describe("Le quartier ou l'île auquel le hex appartient."),
                })
                .strict(),
            )
            .min(1),
        })
        .strict(),
    ),
  })
  .strict()
  .describe("Les îles volantes d'un monde, en hex posés au-dessus de la grille.")

export const atlasUnderground = z
  .object({
    levels: z.array(
      z
        .object({
          level: z.number().int().min(1).describe('La strate, 1 juste sous la surface.'),
          depth: z.number().int().min(1).describe('Profondeur approximative, en mètres.'),
          rock: atlasLayer(z.enum(ROCKS), 'la roche'),
          setting: atlasLayer(z.enum(SETTINGS), 'le milieu ; rock est la roche pleine'),
          floor: atlasLayer(
            z.number(),
            'la hauteur du sol sur la carte : 0,6 pour la roche pleine, moins pour une salle creusée',
          ),
          place: atlasLayer(atlasId, 'le plus petit lieu souterrain du hex'),
        })
        .strict(),
    ),
  })
  .strict()
  .describe("Les strates souterraines d'un monde, chacune avec ses couches.")

const atlasWord = {
  key: z.string().regex(MACHINE_KEY),
  labelFr: z.string().min(1),
  labelEn: z.string().min(1),
}
const atlasWords = z.array(z.object(atlasWord).strict()).min(1)

export const atlasVocabularies = z
  .object({
    tileTypes: z
      .array(
        z
          .object({
            ...atlasWord,
            descriptionFr: z.string().min(1).describe("Ce qu'on trouve sur ce type de tuile."),
            descriptionEn: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    rocks: atlasWords,
    settings: atlasWords,
    placeKinds: atlasWords,
    naturalKinds: atlasWords,
    landmarkKinds: atlasWords,
    routeKinds: atlasWords,
    establishmentKinds: atlasWords,
    vessels: atlasWords,
    terrains: atlasWords.describe(
      'Les terrains du voyage qui ne correspondent à aucun environnement de data/environments/.',
    ),
  })
  .strict()
  .describe("Les vocabulaires de l'Atlas, partagés par tous ses mondes.")

export const atlasTravel = z
  .object({
    hoursPerDay: z
      .number()
      .int()
      .min(1)
      .max(24)
      .describe('Heures de voyage dans une journée à bord, sans équipage en quarts.'),
    crewHoursPerDay: z
      .number()
      .int()
      .min(1)
      .max(24)
      .describe('Heures de voyage dans une journée à bord, avec un équipage en quarts.'),
    terrains: z
      .array(
        z
          .object({
            key: z.string().regex(MACHINE_KEY),
            environment: z
              .string()
              .regex(MACHINE_KEY)
              .optional()
              .describe("L'environnement de data/environments/ qui donne son nom au terrain."),
            maxPace: z
              .enum(PACES)
              .optional()
              .describe("L'allure la plus rapide possible à pied. Absente : on n'y marche pas."),
            maxPaceWithSkis: z
              .enum(PACES)
              .optional()
              .describe("L'allure la plus rapide possible avec des skis."),
          })
          .strict(),
      )
      .min(1),
    tileTerrains: z.record(z.enum(TILE_TYPES), z.string().regex(MACHINE_KEY)),
    undergroundTerrain: z
      .string()
      .regex(MACHINE_KEY)
      .describe('Le terrain de tout hex souterrain.'),
    road: z
      .object({
        step: z
          .number()
          .int()
          .min(1)
          .describe("Paliers d'allure gagnés quand une route relie deux hex."),
        tileTypes: z
          .array(z.enum(TILE_TYPES))
          .describe('Les types de tuile qui comptent comme une route.'),
      })
      .strict(),
    flight: z
      .object({
        kmhPerMetre: z
          .number()
          .positive()
          .describe(
            "Kilomètres par heure à l'allure normale pour chaque mètre de Vitesse de vol. Les autres allures suivent le rapport de leurs distances dans le Livre du joueur.",
          ),
      })
      .strict(),
    vessels: z
      .record(z.enum(VESSELS), z.number().positive())
      .describe('Vitesse de chaque navire, en km/h.'),
    dirigeableKmh: z.number().positive().describe("Vitesse d'un dirigeable, en km/h."),
    railKmh: z.number().positive().describe("Vitesse d'un train, en km/h."),
  })
  .strict()
  .describe("Les règles du calcul d'itinéraire, hors allures du Livre du joueur.")

const atlasStar = z
  .object({
    temperature: z
      .number()
      .positive()
      .describe(
        "La température effective de l'astre, en kelvins. Elle donne la couleur de sa lumière.",
      ),
    illuminance: z
      .number()
      .positive()
      .describe("L'éclairement direct de l'astre au zénith, en lux, à sa distance de référence."),
    diameter: z.number().positive().describe("Le diamètre apparent de l'astre, en degrés."),
  })
  .strict()

export const atlasStars = z
  .object({
    primary: atlasStar.describe("L'astre principal, autour duquel la planète tourne à 1 UA."),
    warm: atlasStar.describe('Le compagnon chaud du couple éloigné.'),
    hot: atlasStar
      .extend({
        tint: z
          .tuple([z.number().positive(), z.number().positive(), z.number().positive()])
          .optional()
          .describe(
            "Une teinte de direction artistique appliquée à sa lumière, en rouge, vert et bleu ; elle s'efface près de l'horizon.",
          ),
      })
      .strict()
      .describe('Le compagnon compact et très chaud du couple éloigné.'),
    pair: z
      .object({
        distance: z
          .number()
          .positive()
          .describe("La distance du barycentre du couple à l'astre principal, en UA."),
        separation: z.number().positive().describe('La distance entre les deux compagnons, en UA.'),
        orbitYears: z
          .number()
          .positive()
          .describe("La période du couple autour de l'astre principal, en années."),
        mutualDays: z
          .number()
          .positive()
          .describe("La période des deux compagnons l'un autour de l'autre, en jours."),
      })
      .strict()
      .describe("Le couple de compagnons, qui tourne loin autour de l'astre principal."),
  })
  .strict()
  .describe("Les trois astres du ciel d'Eden, partagés par tous les mondes de l'Atlas.")

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
    familyNamesLabel: z.string().optional(),
    subspecies: z
      .record(z.string(), localized({ name: z.string().optional(), text: z.string().optional() }))
      .optional()
      .describe(
        "Noms et présentations traduits, keyés par l'identifiant de la sous-espèce. Un nom ne se traduit que s'il est un nom commun.",
      ),
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
    prerequisite: z.string().optional(),
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
    description: z.string().optional(),
    bonuses: z.record(z.string(), localized({ text: z.string().optional() })).optional(),
  }),
  equipmentCatalogue: localized({
    name: z.string().optional(),
    subtitle: z.string().optional(),
    families: z.record(z.string(), z.string()).optional(),
    sections: z.record(z.string(), z.string()).optional(),
  }),
  material: localized({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
  environment: localized({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
  state: localized({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
  book: localized({ title: z.string().optional(), description: z.string().optional() }),
  atlasWorld: localized({ name: z.string().optional() }),
  atlasPlaces: localized({
    places: z
      .record(
        z.string(),
        localized({
          name: z.string().optional(),
          ruler: z.string().optional(),
          government: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .describe("Noms et textes traduits, keyés par l'identifiant du lieu."),
  }),
  atlasLandmarks: localized({
    landmarks: z
      .record(
        z.string(),
        localized({ name: z.string().optional(), description: z.string().optional() }),
      )
      .describe("Noms et textes traduits, keyés par l'identifiant du lieu remarquable."),
  }),
  atlasRoutes: localized({
    routes: z
      .record(
        z.string(),
        localized({ name: z.string().optional(), description: z.string().optional() }),
      )
      .describe("Noms et textes traduits, keyés par l'identifiant de la voie."),
  }),
  atlasEstablishments: localized({
    establishments: z
      .record(
        z.string(),
        localized({ name: z.string().optional(), description: z.string().optional() }),
      )
      .describe("Noms et textes traduits, keyés par l'identifiant de l'établissement."),
  }),
}

export type ContentStatus = z.infer<typeof contentStatus>
export type Skill = z.infer<typeof skill>
export type SkillLimit = NonNullable<Skill['limit']>
export type Upgrade = z.infer<typeof upgrade>
export type Placement = z.infer<typeof placement>
export type SkillTree = z.infer<typeof skillTree>
export type Species = z.infer<typeof species>
export type Subspecies = z.infer<typeof subspecies>
export type SubspeciesLabel = (typeof SUBSPECIES_LABELS)[number]
export type SkillList = z.infer<typeof skillList>
export type EquipmentItem = z.infer<typeof equipmentItem>
export type EquipmentSet = z.infer<typeof equipmentSet>
export type Material = z.infer<typeof material>
export type Environment = z.infer<typeof environment>
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
export type AtlasWorld = z.infer<typeof atlasWorld>
export type AtlasSurface = z.infer<typeof atlasSurface>
export type AtlasPlaces = z.infer<typeof atlasPlaces>
export type AtlasPlace = z.infer<typeof atlasPlace>
export type AtlasLandmarks = z.infer<typeof atlasLandmarks>
export type AtlasRoutes = z.infer<typeof atlasRoutes>
export type AtlasEstablishments = z.infer<typeof atlasEstablishments>
export type AtlasSky = z.infer<typeof atlasSky>
export type AtlasUnderground = z.infer<typeof atlasUnderground>
export type AtlasVocabularies = z.infer<typeof atlasVocabularies>
export type AtlasTravel = z.infer<typeof atlasTravel>
