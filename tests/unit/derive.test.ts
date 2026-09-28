import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  cataloguePanoplies,
  collator,
  formatNumber,
  formatPrice,
  frame,
  inCranOrder,
  initialOf,
  priceInCoins,
  primeCharacteristics,
  SUBSPECIES_SECTIONS,
  showsXp,
  skillTags,
  slugify,
  speciesPool,
  subspeciesAnchor,
  subspeciesSkills,
  treeDomains,
  xpOf,
} from '../../src/lib/game/derive'
import type {
  EquipmentItem,
  EquipmentSet,
  GameState,
  Skill,
  SkillTree,
} from '../../src/lib/game/schema'
import {
  bookChapterRef,
  NAV_SECTIONS,
  pathFor,
  sectionFor,
  segmentsFor,
  TREE_ANCHOR,
  treeNodeHref,
  treeRef,
  VIEW_KINDS,
  type ViewKind,
} from '../../src/lib/i18n/routes'

const COINS = [
  { key: 'or', bronzeValue: 10000, labelFr: 'or', labelEn: 'gold' },
  { key: 'argent', bronzeValue: 100, labelFr: 'argent', labelEn: 'silver' },
  { key: 'bronze', bronzeValue: 1, labelFr: 'bronze', labelEn: 'bronze' },
]

const root = resolve(import.meta.dirname, '../..')

type Reference = Record<
  string,
  { domains: string[]; prime: string[]; xpTotal: number; upgrades: number }
>

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(root, path), 'utf8')) as T
}

async function loadSkills(): Promise<Map<string, Skill>> {
  const dir = resolve(root, 'data/skills')
  const files = (await readdir(dir)).filter(
    (name) => name.endsWith('.json') && !/\.[a-z]{2}\.json$/.test(name),
  )
  const entries = await Promise.all(
    files.map(async (name) => {
      const skill = await readJson<Skill>(`data/skills/${name}`)
      return [skill.id, skill] as const
    }),
  )
  return new Map(entries)
}

async function loadTrees(): Promise<SkillTree[]> {
  const dir = resolve(root, 'data/skill-trees')
  const files = (await readdir(dir)).filter(
    (name) => name.endsWith('.json') && !/\.[a-z]{2}\.json$/.test(name),
  )
  return Promise.all(files.map((name) => readJson<SkillTree>(`data/skill-trees/${name}`)))
}

const reference = await readJson<Reference>('tests/fixtures/design-derived.json')
const skills = await loadSkills()
const trees = await loadTrees()

describe('tree derivations match the design', () => {
  it('still carries every tree the design measured', () => {
    const present = new Set(trees.map((tree) => tree.id))
    for (const id of Object.keys(reference)) {
      expect(present.has(id), `${id} left the repo but the design still measures it`).toBe(true)
    }
  })

  for (const tree of trees) {
    it(`${tree.id} resolves every placement`, () => {
      for (const placement of tree.placements) {
        expect(skills.get(placement.skill), `${tree.id} -> ${placement.skill}`).toBeDefined()
      }
    })

    const expected = reference[tree.id]
    if (!expected) continue

    it(`${tree.id} keeps the design's dominant domains`, () => {
      const resolved = tree.placements.map((placement) => skills.get(placement.skill) as Skill)
      expect(treeDomains(resolved, tree.core?.domains ?? [])).toEqual(expected.domains)
    })

    it(`${tree.id} keeps the design's primary characteristics`, () => {
      const resolved = tree.placements.map((placement) => skills.get(placement.skill) as Skill)
      expect(primeCharacteristics(resolved)).toEqual(expected.prime)
    })

    it(`${tree.id} keeps the design's XP total and upgrade count`, () => {
      const resolved = tree.placements.map((placement) => skills.get(placement.skill) as Skill)
      const xpTotal = resolved.reduce(
        (total, skill) => total + (showsXp(skill) ? xpOf(skill) : 0),
        0,
      )
      const upgrades = resolved.reduce((total, skill) => total + (skill.upgrades?.length ?? 0), 0)
      expect({ xpTotal, upgrades }).toEqual({
        xpTotal: expected.xpTotal,
        upgrades: expected.upgrades,
      })
    })
  }
})

describe('skill identity', () => {
  it('gives every skill a unique file and id', () => {
    expect(skills.size).toBe(371)
    for (const [id, skill] of skills) expect(skill.id).toBe(id)
  })

  it('places every skill that a tree references, and references no ghost', () => {
    const placed = new Set(
      trees.flatMap((tree) => tree.placements.map((placement) => placement.skill)),
    )
    for (const id of placed) expect(skills.has(id)).toBe(true)
  })

  it('links only to placements inside the same tree', () => {
    for (const tree of trees) {
      const inTree = new Set(tree.placements.map((placement) => placement.skill))
      for (const placement of tree.placements) {
        for (const target of placement.linked ?? []) {
          if (target === 'CORE') {
            expect(tree.core, `${tree.id} links to CORE without a core`).toBeDefined()
            continue
          }
          expect(inTree.has(target), `${tree.id}: ${placement.skill} links to ${target}`).toBe(true)
        }
      }
    }
  })
})

describe('xp', () => {
  it('reads five per tier unless overridden', () => {
    expect(xpOf({ tier: 1 })).toBe(5)
    expect(xpOf({ tier: 10 })).toBe(50)
    expect(xpOf({ tier: 10, xpOverride: 100 })).toBe(100)
    expect(xpOf({ tier: 4, xpOverride: 0 })).toBe(0)
  })

  it('treats a missing showXp as visible', () => {
    expect(showsXp({})).toBe(true)
    expect(showsXp({ showXp: false })).toBe(false)
  })
})

describe('skill tags', () => {
  it('reads the slots in card order: Pratique, each École, then each Spéciale', () => {
    expect(
      skillTags({
        specials: ['graft', 'lifesteal'],
        schools: ['healing', 'necromancy'],
        practice: 'technique',
      }),
    ).toEqual([
      { key: 'technique', kind: 'practice' },
      { key: 'healing', kind: 'school' },
      { key: 'necromancy', kind: 'school' },
      { key: 'graft', kind: 'special' },
      { key: 'lifesteal', kind: 'special' },
    ])
  })

  it('leaves out a slot the skill does not fill', () => {
    expect(skillTags({ schools: ['illusion'] })).toEqual([{ key: 'illusion', kind: 'school' }])
  })

  it('reads nothing from a skill without tags', () => {
    expect(skillTags(undefined)).toEqual([])
  })
})

describe('species pools', () => {
  const skill = (id: string): Skill => ({
    id,
    title: id,
    type: 'passive',
    tier: 5,
    domains: [],
    description: id,
  })
  const ids = (pool: Skill[]): string[] => pool.map((entry) => entry.id)

  it('puts the species first and adds the sub-species after it', () => {
    const base = [skill('ESPHUM-001'), skill('AMIXXX-001')]
    expect(ids(speciesPool(base, [skill('PREHER-001')]))).toEqual([
      'ESPHUM-001',
      'AMIXXX-001',
      'PREHER-001',
    ])
  })

  it('never lists a skill twice', () => {
    const base = [skill('ESPHUM-001')]
    expect(ids(speciesPool(base, [skill('ESPHUM-001'), skill('ACVEEC-001')]))).toEqual([
      'ESPHUM-001',
      'ACVEEC-001',
    ])
  })

  it('puts a sub-species imposed skill ahead of the ones it offers', () => {
    expect(
      ids(
        subspeciesSkills({
          imposedSkill: skill('PASMUR-001'),
          offeredSkills: [skill('DEPOUI-001')],
        }),
      ),
    ).toEqual(['PASMUR-001', 'DEPOUI-001'])
    expect(
      ids(subspeciesSkills({ imposedSkill: undefined, offeredSkills: [skill('PREHER-001')] })),
    ).toEqual(['PREHER-001'])
  })

  it('anchors a sub-species at origine-<id> whatever its Espèce calls it', () => {
    expect(subspeciesAnchor('fantome')).toBe('origine-fantome')
  })

  it('names the sub-species section after the word its Espèce uses', () => {
    expect(SUBSPECIES_SECTIONS).toEqual({
      'regional-origins': 'origines-regionales',
      subspecies: 'sous-especes',
    })
  })
})

describe('frames', () => {
  it('paints one domain flat and two as a split', () => {
    expect(frame([])).toBe('#2a2a2e')
    expect(frame(['#c0392b'])).toBe('#c0392b')
    expect(frame(['#c0392b', '#1f7fc0'])).toBe(
      'linear-gradient(135deg,#c0392b 0 50%,#1f7fc0 50% 100%)',
    )
  })
})

describe('text helpers', () => {
  it('slugifies the way the design does', () => {
    expect(slugify('Myxo-Catalyseur')).toBe('myxo-catalyseur')
    expect(slugify('Rapière de duel')).toBe('rapiere-de-duel')
    expect(slugify('Armes · Mêlée')).toBe('armes-melee')
  })

  it('buckets initials', () => {
    expect(initialOf('Épée')).toBe('E')
    expect(initialOf('3 dés')).toBe('0\u20139')
    expect(initialOf('·')).toBe('#')
  })

  it('formats numbers per locale', () => {
    expect(formatNumber(1500, 'en')).toBe('1,500')
    expect(formatNumber(1500, 'fr')).toBe('1\u202f500')
  })

  it('sorts with a locale collator', () => {
    expect(['Éclat', 'Eau', 'Zone'].sort(collator('fr').compare)).toEqual(['Eau', 'Éclat', 'Zone'])
  })

  it('splits a price into coins, largest first, dropping the empty ones', () => {
    expect(priceInCoins(10400, COINS).map((part) => [part.key, part.amount])).toEqual([
      ['or', 1],
      ['argent', 4],
    ])
    expect(priceInCoins(10001, COINS).map((part) => [part.key, part.amount])).toEqual([
      ['or', 1],
      ['bronze', 1],
    ])
    expect(priceInCoins(300, COINS).map((part) => [part.key, part.amount])).toEqual([['argent', 3]])
    expect(priceInCoins(undefined, COINS)).toEqual([])
  })

  it('writes a price in the local coin names', () => {
    expect(formatPrice(10400, COINS, 'fr')).toBe('1\u00a0or 4\u00a0argent')
    expect(formatPrice(10400, COINS, 'en')).toBe('1\u00a0gold 4\u00a0silver')
    expect(formatPrice(1, COINS, 'fr')).toBe('1\u00a0bronze')
    expect(formatPrice(undefined, COINS, 'fr')).toBeUndefined()
  })
})

describe('route slugs', () => {
  it('never uses a segment that a static host resolves as a directory index', () => {
    const reserved = new Set(['index', 'index.html'])
    for (const locale of ['fr', 'en'] as const) {
      for (const kind of VIEW_KINDS) {
        for (const segment of segmentsFor(kind, locale, {
          species: 's',
          tree: 't',
          node: 'N',
          book: 'b',
          chapter: 'c',
          slug: 's',
        })) {
          expect(
            reserved.has(segment),
            `${locale} ${kind} uses the reserved segment ${segment}`,
          ).toBe(false)
        }
      }
    }
  })

  it('keeps every locale pair distinct and prefixed', () => {
    for (const kind of VIEW_KINDS) {
      const fr = pathFor(kind, 'fr')
      const en = pathFor(kind, 'en')
      expect(fr.startsWith('/fr')).toBe(true)
      expect(en.startsWith('/en')).toBe(true)
    }
  })

  it('hangs every booklet history off the archives section', () => {
    expect(pathFor('archives', 'fr')).toBe('/fr/archives')
    expect(pathFor('archives', 'en')).toBe('/en/archives')
    expect(pathFor('archive', 'fr', { slug: 'feu' })).toBe('/fr/archives/feu')
    expect(pathFor('archive', 'en', { slug: 'livre-du-joueur' })).toBe(
      '/en/archives/livre-du-joueur',
    )
    expect(segmentsFor('archive', 'fr', { slug: 'equipement' })).toEqual(['archives', 'equipement'])
  })

  it('never lets an archive path be read as a book chapter', () => {
    expect(bookChapterRef('/fr/archives/livre-du-joueur')).toBeUndefined()
    expect(bookChapterRef('/en/archives/livre-du-joueur')).toBeUndefined()
  })
})

describe('nav sections', () => {
  it('groups every browsable kind under the nav item that owns it', () => {
    expect(sectionFor('home')).toBe('home')
    expect(sectionFor('books')).toBe('books')
    expect(sectionFor('book')).toBe('books')
    expect(sectionFor('almanach')).toBe('almanach')
    expect(sectionFor('tree')).toBe('almanach')
    expect(sectionFor('species')).toBe('almanach')
    expect(sectionFor('speciesEntry')).toBe('almanach')
    expect(sectionFor('skills')).toBe('almanach')
    expect(sectionFor('rules')).toBe('almanach')
  })

  it('leaves search and 404 outside the navigation', () => {
    expect(sectionFor('search')).toBeUndefined()
    expect(sectionFor('notFound')).toBeUndefined()
    expect(sectionFor('archives')).toBeUndefined()
    expect(sectionFor('archive')).toBeUndefined()
  })

  it('claims each kind for at most one section', () => {
    for (const kind of VIEW_KINDS) {
      const owners = NAV_SECTIONS.filter((section) =>
        (section.kinds as readonly ViewKind[]).includes(kind),
      )
      expect(owners.length, `${kind} is claimed by ${owners.length} sections`).toBeLessThanOrEqual(
        1,
      )
    }
  })
})

describe('retired routes', () => {
  it('sends the old states and base actions pages to the indexes that replaced them', async () => {
    const table = new Map<string, string>()
    for (const line of (await readFile(resolve(root, 'public/_redirects'), 'utf8')).split('\n')) {
      const [from, to, status] = line.trim().split(/\s+/)
      if (from && to && status === '301') table.set(from, to)
    }
    expect(table.get('/fr/etats')).toBe(pathFor('rules', 'fr'))
    expect(table.get('/en/states')).toBe(pathFor('rules', 'en'))
    expect(table.get('/fr/actions-de-base')).toBe(pathFor('skills', 'fr'))
    expect(table.get('/en/base-actions')).toBe(pathFor('skills', 'en'))
  })
})

describe('book chapter references', () => {
  it('names the book a chapter path belongs to in each locale', () => {
    expect(bookChapterRef('/fr/livres/livre-du-joueur/comment-jouer')).toBe('fr/livre-du-joueur')
    expect(bookChapterRef('/en/books/livre-du-joueur/comment-jouer')).toBe('en/livre-du-joueur')
  })

  it('matches two chapters of one book and separates everything else', () => {
    const chapter = bookChapterRef('/fr/livres/livre-du-joueur/comment-jouer')
    expect(bookChapterRef('/fr/livres/livre-du-joueur/creer-un-personnage')).toBe(chapter)
    expect(bookChapterRef('/fr/livres/livre-du-mj/menace-et-rencontres')).not.toBe(chapter)
    expect(bookChapterRef('/en/books/livre-du-joueur/comment-jouer')).not.toBe(chapter)
  })

  it('rejects paths that are not a book chapter', () => {
    expect(bookChapterRef('/fr/livres')).toBeUndefined()
    expect(bookChapterRef('/fr/livres/livre-du-joueur')).toBeUndefined()
    expect(bookChapterRef('/fr/arbre/berserker/RAGEXX-001')).toBeUndefined()
    expect(bookChapterRef('/de/livres/livre-du-joueur/comment-jouer')).toBeUndefined()
    expect(bookChapterRef('/livres/livre-du-joueur/comment-jouer')).toBeUndefined()
    expect(bookChapterRef('/fr/livres/livre-du-joueur/comment-jouer/extra')).toBeUndefined()
  })
})

describe('tree references', () => {
  it('names the tree of a plate and of each of its nodes', () => {
    expect(treeRef('/fr/arbre/berserker')).toBe('fr/berserker')
    expect(treeRef('/fr/arbre/berserker/')).toBe('fr/berserker')
    expect(treeRef('/fr/arbre/berserker/RAGEXX-001')).toBe('fr/berserker')
    expect(treeRef('/en/tree/berserker/TOURBI-001/')).toBe('en/berserker')
  })

  it('matches two nodes of one tree and separates everything else', () => {
    const tree = treeRef('/fr/arbre/berserker/RAGEXX-001')
    expect(treeRef('/fr/arbre/berserker/TOURBI-001')).toBe(tree)
    expect(treeRef('/fr/arbre/feu/SURCHA-001')).not.toBe(tree)
    expect(treeRef('/en/tree/berserker/RAGEXX-001')).not.toBe(tree)
  })

  it('rejects paths that are not a tree or a node', () => {
    expect(treeRef('/fr/arbres')).toBeUndefined()
    expect(treeRef('/fr/arbre')).toBeUndefined()
    expect(treeRef('/en/arbre/berserker')).toBeUndefined()
    expect(treeRef('/de/arbre/berserker')).toBeUndefined()
    expect(treeRef('/fr/competences/berserker')).toBeUndefined()
    expect(treeRef('/fr/arbre/berserker/RAGEXX-001/extra')).toBeUndefined()
  })

  it('links a node to the tree section of its own page', () => {
    expect(treeNodeHref('fr', 'berserker', 'RAGEXX-001')).toBe(
      `/fr/arbre/berserker/RAGEXX-001#${TREE_ANCHOR}`,
    )
    expect(treeNodeHref('en', 'berserker', 'RAGEXX-001')).toBe(
      '/en/tree/berserker/RAGEXX-001#arbre',
    )
  })
})

describe('state order', () => {
  const state = (key: string, name: string, follows?: string): GameState => ({
    key,
    name,
    kind: 'debuff',
    icon: 'mdi:circle',
    description: name,
    ...(follows === undefined ? {} : { follows }),
  })
  const compare = collator('fr').compare
  const names = (states: GameState[]): string[] => states.map((entry) => entry.name)

  it('keeps states alphabetical, and a chain of crans at the place of its first, in cran order', () => {
    const states = [
      state('trempe', 'Trempé'),
      state('poisse-explosive', 'Poisse explosive', 'poisse-solide'),
      state('agonie', 'Agonie'),
      state('poisse-solide', 'Poisse solide', 'poisse-liquide'),
      state('poisse-liquide', 'Poisse liquide'),
      state('entrave', 'Entravé'),
    ]
    expect(names(inCranOrder(states, compare))).toEqual([
      'Agonie',
      'Entravé',
      'Poisse liquide',
      'Poisse solide',
      'Poisse explosive',
      'Trempé',
    ])
  })

  it('refuses a cran that follows no state, or a chain that loops', () => {
    expect(() => inCranOrder([state('a', 'A', 'absent')], compare)).toThrow()
    expect(() => inCranOrder([state('a', 'A', 'b'), state('b', 'B', 'a')], compare)).toThrow()
  })
})

describe('panoply pages', () => {
  const rarities = ['common', 'uncommon', 'very-rare'].map((key) => ({
    key,
    labelFr: key,
    labelEn: key,
  }))
  const set = (id: string, name: string): EquipmentSet => ({
    id,
    name,
    description: name,
    bonuses: [{ pieces: 2, text: name }],
  })
  const piece = (name: string, setId: string, rarity: string): EquipmentItem => ({
    name,
    section: 'bijoux',
    position: 0,
    kind: 'Bijou',
    rarity,
    set: setId,
    description: name,
  })

  it('sorts panoplies by rarity, then alphabetically within a rarity', () => {
    const sets = [
      set('FAEBI', 'Panoplie des Faebies'),
      set('TRAQU', 'Panoplie du Traqueur'),
      set('BASTI', 'Panoplie du Bastion'),
      set('ECLAT', "Panoplie de l'Éclat"),
    ]
    const items = [
      piece('Boucle', 'FAEBI', 'very-rare'),
      piece('Capuche', 'TRAQU', 'uncommon'),
      piece('Heaume', 'BASTI', 'uncommon'),
      piece('Anneau', 'ECLAT', 'common'),
    ]
    expect(cataloguePanoplies(rarities, sets, items, 'fr').map((entry) => entry.set.id)).toEqual([
      'ECLAT',
      'BASTI',
      'TRAQU',
      'FAEBI',
    ])
  })

  it('keeps the pieces of a panoply in the order the catalogue gives them', () => {
    const items = [
      piece('Heaume', 'BASTI', 'uncommon'),
      piece('Dague', 'NONE', 'uncommon'),
      piece('Grèves', 'BASTI', 'uncommon'),
    ]
    const [bastion] = cataloguePanoplies(rarities, [set('BASTI', 'Bastion')], items, 'fr')
    expect(bastion?.pieces.map((entry) => entry.name)).toEqual(['Heaume', 'Grèves'])
  })
})
