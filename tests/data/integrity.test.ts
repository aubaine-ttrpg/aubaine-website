import type { Dirent } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { parseFrontmatter } from '@astrojs/markdown-remark'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { latestRelease, notes, releases } from '../../src/lib/booklet/manifest'
import {
  originSkills,
  ruleBrowseEntries,
  skillBrowseEntries,
} from '../../src/lib/game/browse-entries'
import { type Corpus, definition, label } from '../../src/lib/game/build'
import {
  characteristicKey,
  SPECIES_PLATE_ICONS,
  SPECIES_SKILL_CHOICES,
  showsXp,
  skillTags,
  speciesPool,
  subspeciesSkills,
  VARIABLE_CHARACTERISTIC,
} from '../../src/lib/game/derive'
import { readCorpus, readSources } from '../../src/lib/game/fs-sources'
import { overlays } from '../../src/lib/game/schema'
import { LOCALES } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'
import { PLACEHOLDER_BANNER, PLACEHOLDER_COVER, PLACEHOLDER_SQUARE } from '../../src/lib/media'
import { FONT_FAMILIES, ICON_SETS } from '../../src/lib/rights/attribution'
import { indexCaptions } from '../../src/lib/rights/captions'
import { HOLDER, LICENCE, licenceClaim, pictureClaim, YEAR } from '../../src/lib/rights/claim'
import { stampJpeg, stripJpeg } from '../../src/lib/rights/jpeg'
import { mp4IsStamped } from '../../src/lib/rights/mp4'
import {
  FOREIGN_DIRECTORIES,
  FOREIGN_PROVENANCE,
  GENERATED_DIRECTORIES,
  OWNED_DIRECTORIES,
  OWNED_FILES,
  STRIPPED_DIRECTORIES,
} from '../../src/lib/rights/ownership'
import { pdfIsStamped } from '../../src/lib/rights/pdf'
import { readPngText, stampPng, stripPng } from '../../src/lib/rights/png'
import { stampSvg } from '../../src/lib/rights/svg'
import { stampWebp } from '../../src/lib/rights/webp'

const root = resolve(import.meta.dirname, '../..')

const fr = await readCorpus(root, 'fr')
const en = await readCorpus(root, 'en')
const sources = await readSources(root)
const captions = indexCaptions(
  JSON.parse(await readFile(resolve(root, 'data/media-captions.json'), 'utf8')),
)

const CALLOUT = /\[\[\[([^\]]+)\]\]\]/g
const STATE_REF = /\[\[([^\]]+)\]\]/g
const SKILL_REF = /\{\{([^}]+)\}\}/g
const MEDIA_FILE =
  /^[a-z0-9]+(?:-[a-z0-9]+)*-(\d{1,2})_(\d{1,2})-(?:og|cleaned|upscaled_[24])\.(?:png|jpg)$/
const VIDEO_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*-(\d{1,2})_(\d{1,2})-(?:og|compressed)\.mp4$/

const RATIO_TOLERANCE = 0.01

const EN_DASH = String.fromCodePoint(0x2013)
const EM_DASH = String.fromCodePoint(0x2014)
const BANNED_DASHES = [EN_DASH, EM_DASH]
const FOREIGN_TYPOGRAPHY = [0x2018, 0x2019, 0x201c, 0x201d, 0x00a0, 0x202f].map((code) =>
  String.fromCodePoint(code),
)
const APOSTROPHE = `['${String.fromCodePoint(0x2019)}]`
const ANTITHESIS = new RegExp(
  `n${APOSTROPHE}est pas\\b[^.;!?]{1,80}[,:]\\s*c${APOSTROPHE}est\\b` +
    `|\\bis not\\b[^.;!?]{1,80}[,:]\\s*it is\\b`,
  'iu',
)
const ASTERISK_RUN = /\*+/g

const BANNED_PHRASES = [
  'in a world where',
  'delve into',
  'it is important to note',
  'at its core',
  'in conclusion',
  'in summary',
  'more than just',
  'not merely',
  'serves as a reminder',
  'stands as a testament',
  'a testament to',
  'a tapestry of',
  'rich tapestry',
  'a beacon of',
  'shrouded in mystery',
  'steeped in history',
  'whether you are',
  'ever-evolving',
  'in today',
  'navigate the',
  'perfect for any',
  'forgotten ages',
  'whispered secrets',
  'ancient powers',
  'woven destinies',
  'unknowable darkness',
  'game-changer',
  "à l'ère de",
  'tirer parti',
  'sans précédent',
  'dans un monde',
  'il est crucial',
  'il est essentiel',
  'il est important de noter',
  'plonger dans',
  'plongez dans',
  'en conclusion',
  'pour résumer',
  'une tapisserie de',
  'depuis des temps immémoriaux',
  'enveloppé de mystère',
  'secrets murmurés',
  'âges oubliés',
]

function codePointOf(glyph: string): string {
  return (glyph.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')
}

function jsonStrings(
  value: unknown,
  path: string,
  out: { path: string; value: string }[],
): { path: string; value: string }[] {
  if (typeof value === 'string') {
    out.push({ path, value })
    return out
  }
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) jsonStrings(entry, `${path}[${index}]`, out)
    return out
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      jsonStrings(entry, path === '' ? key : `${path}.${key}`, out)
    }
  }
  return out
}

function bannedPhrasePattern(phrase: string): RegExp {
  return new RegExp(
    `(?<![\\p{L}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`,
    'iu',
  )
}

function allRuleText(corpus: Corpus = fr): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  for (const skill of corpus.skills.values()) {
    out.push({ where: `skills/${skill.id}`, text: skill.description })
    for (const upgrade of skill.upgrades ?? []) {
      out.push({ where: `skills/${skill.id} upgrade ${upgrade.level}`, text: upgrade.description })
    }
  }
  for (const state of corpus.states) {
    out.push({ where: `states/${state.key}`, text: state.description })
  }
  for (const item of corpus.items) {
    if (item.text) out.push({ where: `items/${item.name}`, text: item.text })
    out.push({ where: `items/${item.name}`, text: item.description })
  }
  for (const set of corpus.sets.values()) {
    for (const bonus of set.bonuses) out.push({ where: `sets/${set.id}`, text: bonus.text })
  }
  for (const entry of corpus.species) {
    for (const sub of entry.subspecies) {
      out.push({ where: `species/${entry.id} sub-species ${sub.id}`, text: sub.text })
    }
    for (const [field, text] of Object.entries(entry.roleplay ?? {})) {
      if (text !== undefined) out.push({ where: `species/${entry.id} roleplay ${field}`, text })
    }
  }
  return out
}

const everyRuleText = [...allRuleText(fr), ...allRuleText(en)]

describe('vocabulary references', () => {
  it('uses only declared domain keys', () => {
    for (const skill of fr.skills.values()) {
      for (const key of skill.domains) {
        expect(fr.domains.has(key), `${skill.id} domain ${key}`).toBe(true)
      }
      for (const upgrade of skill.upgrades ?? []) {
        for (const key of upgrade.domains ?? []) {
          expect(fr.domains.has(key), `${skill.id} upgrade domain ${key}`).toBe(true)
        }
      }
    }
    for (const tree of fr.trees) {
      for (const key of tree.core?.domains ?? []) {
        expect(fr.domains.has(key), `${tree.id} core domain ${key}`).toBe(true)
      }
    }
  })

  it('uses only declared creature type, size and language keys', () => {
    for (const entry of fr.species) {
      for (const key of entry.types ?? []) {
        expect(fr.creatureTypes.has(key), `${entry.id} creature type ${key}`).toBe(true)
      }
      for (const key of entry.size ?? []) {
        expect(fr.sizes.has(key), `${entry.id} size ${key}`).toBe(true)
      }
      for (const key of entry.languages ?? []) {
        expect(fr.languages.has(key), `${entry.id} language ${key}`).toBe(true)
      }
    }
  })

  it('uses only declared characteristic keys', () => {
    for (const skill of fr.skills.values()) {
      for (const key of skill.characteristics ?? []) {
        expect(
          fr.characteristics.has(characteristicKey(key)),
          `${skill.id} characteristic ${key}`,
        ).toBe(true)
      }
    }
  })

  it('uses only declared rarities and craft disciplines', () => {
    for (const item of fr.items) {
      expect(fr.rarities.has(item.rarity), `${item.name} rarity ${item.rarity}`).toBe(true)
      if (item.craft) {
        expect(
          fr.disciplines.has(item.craft.discipline),
          `${item.name} craft ${item.craft.discipline}`,
        ).toBe(true)
      }
    }
  })
})

describe('cross references', () => {
  it('resolves every tree placement and link', () => {
    for (const tree of fr.trees) {
      const placed = new Set(tree.placements.map((placement) => placement.skill.id))
      for (const placement of tree.placements) {
        for (const target of placement.linked ?? []) {
          if (target === 'CORE') {
            expect(tree.core, `${tree.id} links to CORE without a core`).toBeDefined()
            continue
          }
          expect(placed.has(target), `${tree.id}: ${placement.skill.id} links to ${target}`).toBe(
            true,
          )
        }
      }
    }
  })

  it('resolves every evolvesFrom', () => {
    for (const skill of fr.skills.values()) {
      if (!skill.evolvesFrom) continue
      expect(fr.skills.has(skill.evolvesFrom), `${skill.id} evolvesFrom ${skill.evolvesFrom}`).toBe(
        true,
      )
    }
  })

  it('resolves every granted skill and declared set', () => {
    for (const item of fr.items) {
      for (const id of item.grants ?? []) {
        expect(fr.skills.has(id), `${item.name} grants ${id}`).toBe(true)
      }
      if (item.set) expect(fr.sets.has(item.set), `${item.name} set ${item.set}`).toBe(true)
    }
    for (const set of fr.sets.values()) {
      for (const bonus of set.bonuses) {
        for (const id of bonus.grants ?? []) {
          expect(fr.skills.has(id), `set ${set.id} grants ${id}`).toBe(true)
        }
      }
    }
  })

  it('offers and imposes only skills that exist from every species and sub-species', () => {
    for (const entry of sources.speciesEntries) {
      const named = [
        ...entry.data.offered,
        ...(entry.data.subspecies ?? []).flatMap((sub) => [
          ...sub.offered,
          ...(sub.imposed ? [sub.imposed] : []),
        ]),
      ]
      for (const id of named) {
        expect(fr.skills.has(id), `${entry.data.id} offers or imposes ${id}`).toBe(true)
      }
    }
  })

  it('gives every sub-species an id unique within its species', () => {
    for (const entry of sources.speciesEntries) {
      const ids = (entry.data.subspecies ?? []).map((sub) => sub.id)
      expect(new Set(ids).size, `${entry.data.id} repeats a sub-species id`).toBe(ids.length)
    }
  })

  it('offers or imposes each skill once across a species and its sub-species', () => {
    for (const entry of sources.speciesEntries) {
      const named = [
        ...entry.data.offered,
        ...(entry.data.subspecies ?? []).flatMap((sub) => [
          ...sub.offered,
          ...(sub.imposed ? [sub.imposed] : []),
        ]),
      ]
      expect(new Set(named).size, `${entry.data.id} names a skill twice`).toBe(named.length)
    }
  })

  it('leaves every character either nothing yet or a real choice at creation', () => {
    for (const entry of fr.species) {
      const pools =
        entry.subspecies.length === 0
          ? [{ who: entry.id, skills: entry.offeredSkills, imposed: 0 }]
          : entry.subspecies.map((sub) => ({
              who: `${entry.id} ${sub.id}`,
              skills: speciesPool(entry.offeredSkills, sub.offeredSkills),
              imposed: sub.imposedSkill ? 1 : 0,
            }))
      for (const { who, skills, imposed } of pools) {
        const needed = SPECIES_SKILL_CHOICES - imposed
        expect(
          (skills.length === 0 && imposed === 0) || skills.length >= needed,
          `${who} offers ${skills.length} skills beside ${imposed} imposed, fewer than the ${needed} a character still picks`,
        ).toBe(true)
      }
    }
  })

  it('lists on the page the species skills first, then each sub-species imposed and own, once each', () => {
    for (const entry of fr.species) {
      const expected = [
        ...entry.offeredSkills,
        ...entry.subspecies.flatMap((sub) => subspeciesSkills(sub)),
      ].map((skill) => skill.id)
      expect(
        entry.pool.map((skill) => skill.id),
        `${entry.id} lists its pool out of order`,
      ).toEqual([...new Set(expected)])
    }
  })

  it('lists every sub-species name once within its list', () => {
    for (const entry of sources.speciesEntries) {
      for (const sub of entry.data.subspecies ?? []) {
        for (const [list, names] of Object.entries(sub.names ?? {})) {
          expect(new Set(names).size, `${entry.data.id} ${sub.id} repeats a ${list} name`).toBe(
            names.length,
          )
        }
      }
    }
  })

  it('names only skills that exist in every skill list', () => {
    for (const list of [fr.basic, fr.bank]) {
      expect(list.resolved.length, `${list.name} has unresolved ids`).toBe(list.skills.length)
    }
  })
})

describe('imposed skills', () => {
  it('imposes each skill from one sub-species only, across every species', () => {
    const named = sources.speciesEntries.flatMap((entry) => [
      ...entry.data.offered,
      ...(entry.data.subspecies ?? []).flatMap((sub) => [
        ...sub.offered,
        ...(sub.imposed ? [sub.imposed] : []),
      ]),
    ])
    for (const entry of sources.speciesEntries) {
      for (const sub of entry.data.subspecies ?? []) {
        if (!sub.imposed) continue
        expect(
          named.filter((id) => id === sub.imposed).length,
          `${entry.data.id} ${sub.id} imposes ${sub.imposed}, which another list also names`,
        ).toBe(1)
      }
    }
  })

  it('names the sub-species in the provenance of the skill it imposes', () => {
    for (const entry of fr.species) {
      for (const sub of entry.subspecies) {
        if (!sub.imposedSkill) continue
        expect(
          fr.origins.get(sub.imposedSkill.id)?.species,
          `${entry.id} ${sub.id}`,
        ).toContainEqual({
          id: entry.id,
          name: entry.name,
          subspecies: { id: sub.id, name: sub.name },
        })
      }
    }
  })

  it('hands the species status down to the skill a sub-species imposes', () => {
    for (const entry of fr.species) {
      for (const sub of entry.subspecies) {
        const skill = sub.imposedSkill
        if (!skill || (fr.origins.get(skill.id)?.trees.length ?? 0) > 0) continue
        expect(fr.skillStatus.get(skill.id), `${entry.id} ${sub.id} ${skill.id}`).toBe(
          skill.status ?? entry.status,
        )
      }
    }
  })

  it('keeps an imposed skill unpriced and out of the Banque Commune', () => {
    const banked = new Set(fr.bank.resolved.map((skill) => skill.id))
    for (const entry of fr.species) {
      for (const sub of entry.subspecies) {
        const skill = sub.imposedSkill
        if (!skill) continue
        expect(
          banked.has(skill.id),
          `${entry.id} ${sub.id} imposes ${skill.id}, which the Banque Commune lists`,
        ).toBe(false)
        expect(
          showsXp(skill),
          `${entry.id} ${sub.id} imposes ${skill.id}, which shows a price`,
        ).toBe(false)
      }
    }
  })

  it('reserves an imposed skill to its sub-species by its prerequisite, in both locales', () => {
    for (const built of [fr, en]) {
      for (const entry of built.species) {
        for (const sub of entry.subspecies) {
          const skill = sub.imposedSkill
          if (!skill) continue
          expect(skill.prerequisite ?? '', `${built.locale} ${entry.id} ${sub.id}`).toContain(
            sub.name,
          )
        }
      }
    }
  })
})

describe('rule text markup', () => {
  const texts = allRuleText()

  it('names only known states between double brackets', () => {
    for (const { where, text } of texts) {
      const withoutCallouts = text.replace(CALLOUT, (_match, inner: string) => {
        expect(
          fr.statesByName.has(inner.trim().toLowerCase()),
          `${where} callout [[[${inner}]]]`,
        ).toBe(true)
        return ''
      })
      for (const match of withoutCallouts.matchAll(STATE_REF)) {
        const name = (match[1] ?? '').trim().toLowerCase()
        expect(fr.statesByName.has(name), `${where} state [[${match[1]}]]`).toBe(true)
      }
    }
  })

  it('names only known skills between double braces', () => {
    const titles = new Set<string>()
    for (const skill of fr.skills.values()) titles.add(skill.title.toLowerCase())
    for (const { where, text } of texts) {
      for (const match of text.matchAll(SKILL_REF)) {
        const name = (match[1] ?? '').trim().toLowerCase()
        expect(titles.has(name), `${where} skill {{${match[1]}}}`).toBe(true)
      }
    }
  })
})

describe('media', () => {
  it('keeps on disk the default plate every empty picture slot falls back to', async () => {
    const art = new Set(await readdir(resolve(root, 'data/media/art')))
    const items = new Set(await readdir(resolve(root, 'data/media/items')))
    expect(art.has(PLACEHOLDER_COVER), `art/${PLACEHOLDER_COVER}`).toBe(true)
    expect(art.has(PLACEHOLDER_BANNER), `art/${PLACEHOLDER_BANNER}`).toBe(true)
    expect(items.has(PLACEHOLDER_SQUARE), `items/${PLACEHOLDER_SQUARE}`).toBe(true)
  })

  it('points every tree at a cover, a banner and a back cover that exist', async () => {
    const files = new Set(await readdir(resolve(root, 'data/media/art')))
    for (const tree of fr.trees) {
      for (const [field, file] of [
        ['cover', tree.cover],
        ['banner', tree.banner],
        ['backCover', tree.backCover],
      ] as const) {
        if (!file) continue
        expect(files.has(file), `${tree.id} ${field} ${file}`).toBe(true)
      }
    }
  })

  it('keeps every icon the species plates name on disk', async () => {
    for (const icon of Object.values(SPECIES_PLATE_ICONS)) {
      const [set, name] = icon.split(':')
      await expect(
        readFile(resolve(root, `data/media/icons/${set}/${name}.svg`)),
      ).resolves.toBeDefined()
    }
  })

  it('points every species at art that exists', async () => {
    const files = new Set(await readdir(resolve(root, 'data/media/art')))
    for (const entry of fr.species) {
      for (const [field, file] of [
        ['cover', entry.cover],
        ['banner', entry.banner],
      ] as const) {
        if (!file) continue
        expect(files.has(file), `${entry.id} ${field} ${file}`).toBe(true)
      }
    }
  })

  it('points every book at a cover, a banner and a back cover that exist', async () => {
    const art = new Set(await readdir(resolve(root, 'data/media/art')))
    for (const book of fr.books) {
      for (const [field, file] of [
        ['cover', book.cover],
        ['banner', book.banner],
        ['backCover', book.backCover],
      ] as const) {
        if (!file) continue
        expect(art.has(file), `${book.id} ${field} ${file}`).toBe(true)
      }
    }
  })

  it('points the catalogue at a cover, a banner and a back cover that exist', async () => {
    const art = new Set(await readdir(resolve(root, 'data/media/art')))
    for (const [field, file] of [
      ['cover', fr.catalogue.cover],
      ['banner', fr.catalogue.banner],
      ['backCover', fr.catalogue.backCover],
    ] as const) {
      if (!file) continue
      expect(art.has(file), `catalogue ${field} ${file}`).toBe(true)
    }
  })

  it('points every skill at art that exists', async () => {
    const files = new Set(await readdir(resolve(root, 'data/media/skills')).catch(() => []))
    for (const skill of fr.skills.values()) {
      if (!skill.art) continue
      expect(files.has(skill.art), `${skill.id} art ${skill.art}`).toBe(true)
    }
  })

  it('points every equipment item at art that exists', async () => {
    const files = new Set(await readdir(resolve(root, 'data/media/items')))
    for (const item of fr.items) {
      if (!item.art) continue
      expect(files.has(item.art), `${item.name} art ${item.art}`).toBe(true)
    }
  })

  it('names every image for the aspect ratio it actually has', async () => {
    for (const [directory, ratios] of [
      ['data/media/art', ['16_9', '3_4']],
      ['data/media/skills', ['1_1']],
      ['data/media/items', ['1_1']],
    ] as const) {
      for (const file of await readdir(resolve(root, directory)).catch(() => [])) {
        if (file.startsWith('.')) continue
        const match = MEDIA_FILE.exec(file)
        expect(match, `${directory}/${file} does not follow the image naming convention`).not.toBe(
          null,
        )
        if (!match) continue
        const ratio = `${match[1]}_${match[2]}`
        expect(ratios as readonly string[], `${directory}/${file} ratio ${ratio}`).toContain(ratio)
        const { width, height } = await sharp(resolve(root, directory, file)).metadata()
        const declared = Number(match[1]) / Number(match[2])
        const actual = (width as number) / (height as number)
        expect(
          Math.abs(declared - actual) / declared,
          `${directory}/${file} declares ${ratio} but is ${width}x${height}`,
        ).toBeLessThan(RATIO_TOLERANCE)
      }
    }
  })

  it('names every video for the aspect ratio the hero gives it', async () => {
    for (const file of await readdir(resolve(root, 'data/media/video')).catch(() => [])) {
      if (file.startsWith('.')) continue
      const match = VIDEO_FILE.exec(file)
      expect(
        match,
        `data/media/video/${file} does not follow the media naming convention`,
      ).not.toBe(null)
      if (!match) continue
      expect(`${match[1]}_${match[2]}`, `data/media/video/${file} ratio`).toBe('16_9')
    }
  })

  it('lists only book chapters that exist on disk', async () => {
    for (const book of fr.books) {
      const files = new Set(await readdir(resolve(root, 'data/books', book.id)))
      for (const chapter of book.chapters) {
        expect(files.has(`${chapter.file}.md`), `${book.id} chapter ${chapter.file}`).toBe(true)
      }
    }
  })

  it('serves every markdown file a book folder holds', async () => {
    for (const book of fr.books) {
      const listed = new Set(book.chapters.map((chapter) => chapter.file))
      for (const file of await readdir(resolve(root, 'data/books', book.id))) {
        const match = /^(.+)\.md$/.exec(file)
        if (!match) continue
        const base = (match[1] as string).replace(/\.[a-z]{2}$/, '')
        expect(listed.has(base), `${book.id}/${file} is on disk but no chapter lists it`).toBe(true)
      }
    }
  })

  it('gives every chapter and section a slug that is unique within its book', () => {
    for (const book of fr.books) {
      const slugs = book.chapters.map((chapter) => chapter.slug)
      expect(new Set(slugs).size, `${book.id} has a duplicate chapter slug`).toBe(slugs.length)
    }
  })

  it('keeps the numeric prefixes in reading order', () => {
    for (const book of fr.books) {
      const prefixes = book.chapters.map((chapter) => chapter.file)
      const sorted = [...prefixes].sort()
      expect(prefixes, `${book.id} reads in a different order than its filenames sort`).toEqual(
        sorted,
      )
    }
  })
})

describe('booklet releases', () => {
  it('carries a catalogue booklet in every locale', () => {
    for (const locale of LOCALES) {
      const release = latestRelease('equipment', fr.catalogue.id, locale)
      expect(release, `no equipment booklet for ${locale}. Run pnpm pdf`).toBeDefined()
    }
  })

  it('keeps every release file on disk', async () => {
    const loose = new Set(await readdir(resolve(root, 'data/media/pdf')))
    const bundled = new Set(
      await readdir(resolve(root, 'data/media/pdf-archive')).catch(() => [] as string[]),
    )
    for (const release of releases()) {
      const held = release.archive ? bundled.has(release.archive) : loose.has(release.file)
      expect(held, `${release.file} is listed but neither loose nor archived`).toBe(true)
    }
  })

  it('lists every pdf on disk in the manifest', async () => {
    const listed = new Set(releases().map((release) => release.file))
    for (const file of await readdir(resolve(root, 'data/media/pdf'))) {
      if (file.startsWith('.')) continue
      expect(
        listed.has(file),
        `data/media/pdf/${file} is on disk but absent from data/pdf/releases.json`,
      ).toBe(true)
    }
  })

  it('keeps one printing per booklet per version', () => {
    const seen = new Map<string, string>()
    for (const release of releases()) {
      const key = `${release.kind}/${release.slug}/${release.locale}/${release.version}`
      const first = seen.get(key)
      expect(
        first,
        `${key} was printed twice, as ${first} and ${release.file}. Run: pnpm pdf:archive`,
      ).toBeUndefined()
      seen.set(key, release.file)
    }
  })

  it('gives every booklet slug one kind, so an archive url is unambiguous', () => {
    const kinds = new Map<string, string>()
    for (const release of releases()) {
      const known = kinds.get(release.slug)
      expect(
        known === undefined || known === release.kind,
        `slug ${release.slug} is both a ${known} and a ${release.kind}, so /archives/${release.slug} is ambiguous`,
      ).toBe(true)
      kinds.set(release.slug, release.kind)
    }
  })
})

describe('release notes', () => {
  it('carries an authored note for every version the manifest holds', () => {
    const authored = new Set(notes().map((note) => note.version))
    for (const version of new Set(releases().map((release) => release.version))) {
      expect(authored.has(version), `v${version} has no note. Add it to data/pdf/notes.json`).toBe(
        true,
      )
    }
  })

  it('authors no note for a version no booklet carries', () => {
    const printed = new Set(releases().map((release) => release.version))
    for (const note of notes()) {
      expect(printed.has(note.version), `the note for v${note.version} names no release`).toBe(true)
    }
  })

  it('dates every note with a real calendar day', () => {
    for (const note of notes()) {
      expect(
        new Date(`${note.date}T00:00:00Z`).toISOString().slice(0, 10),
        `the note for v${note.version} is dated ${note.date}`,
      ).toBe(note.date)
    }
  })
})

describe('uniqueness', () => {
  it('gives every state a unique printed name', () => {
    expect(fr.statesByName.size).toBe(fr.states.length)
  })

  it('gives every equipment item a unique slug and a known section', () => {
    const sections = new Set(fr.catalogue.sections.map((section) => section.key))
    for (const [slug, item] of fr.itemsBySlug) {
      expect(sections.has(item.section), `${slug} section ${item.section}`).toBe(true)
    }
    expect(fr.items.length).toBe(fr.itemsBySlug.size)
  })
})

describe('authoring hygiene', () => {
  async function jsonFiles(dir: string): Promise<string[]> {
    const entries = await readdir(resolve(root, dir), { recursive: true, withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => resolve(entry.parentPath, entry.name))
  }

  it('never writes an explicit null', async () => {
    for (const file of await jsonFiles('data')) {
      const raw = await readFile(file, 'utf8')
      expect(raw.includes(': null'), `${file} contains an explicit null`).toBe(false)
    }
  })

  it('keeps every data file deterministically formatted', async () => {
    for (const file of await jsonFiles('data')) {
      const raw = await readFile(file, 'utf8')
      expect(raw, file).toBe(`${JSON.stringify(JSON.parse(raw), null, 2)}\n`)
    }
  })

  it('keeps the en dash out of data, and the em dash to a whole stat value', async () => {
    for (const file of await jsonFiles('data')) {
      const parsed: unknown = JSON.parse(await readFile(file, 'utf8'))
      for (const { path, value } of jsonStrings(parsed, '', [])) {
        expect(value.includes(EN_DASH), `${file} ${path} contains an en dash`).toBe(false)
        expect(
          !value.includes(EM_DASH) || value === EM_DASH,
          `${file} ${path} writes an em dash inside prose. It is a display token only when it is the whole value of a stat field`,
        ).toBe(true)
      }
    }
  })

  it('writes the straight apostrophe and the ordinary space under data', async () => {
    for (const file of await jsonFiles('data')) {
      const raw = await readFile(file, 'utf8')
      for (const glyph of FOREIGN_TYPOGRAPHY) {
        expect(
          raw.includes(glyph),
          `${file} carries U+${codePointOf(glyph)}, which breaks keyword matching invisibly`,
        ).toBe(false)
      }
    }
  })

  it('keeps authored source free of en dash and em dash', async () => {
    const dirs = ['src', 'tools', 'tests', 'docs']
    const banned = BANNED_DASHES
    for (const dir of dirs) {
      let entries: Dirent[]
      try {
        entries = await readdir(resolve(root, dir), { recursive: true, withFileTypes: true })
      } catch {
        continue
      }
      for (const entry of entries) {
        if (!entry.isFile()) continue
        if (!/\.(ts|tsx|astro|css|md|mjs|json)$/.test(entry.name)) continue
        const raw = await readFile(resolve(entry.parentPath, entry.name), 'utf8')
        const hit = banned.find((dash) => raw.includes(dash))
        expect(hit, `${entry.parentPath}/${entry.name} contains a banned dash`).toBeUndefined()
      }
    }
  })
})

type Prose = { where: string; path: string; text: string; locale: 'fr' | 'en' }

async function proseIn(dir: string, label: string): Promise<Prose[]> {
  const out: Prose[] = []
  for (const file of await readdir(resolve(root, dir))) {
    if (!file.endsWith('.md')) continue
    const path = resolve(root, dir, file)
    out.push({
      where: `${label}/${file}`,
      path,
      text: parseFrontmatter(await readFile(path, 'utf8')).content,
      locale: file.endsWith('.en.md') ? 'en' : 'fr',
    })
  }
  return out
}

async function lorePages(): Promise<Prose[]> {
  return [
    ...(await proseIn('data/lore/species', 'lore/species')),
    ...(await proseIn('data/lore/skill-trees', 'lore/skill-trees')),
  ]
}

async function authoredProse(): Promise<Prose[]> {
  const out: Prose[] = []
  for (const book of fr.books) {
    out.push(...(await proseIn(`data/books/${book.id}`, `books/${book.id}`)))
  }
  out.push(...(await proseIn('data/equipment', 'equipment')))
  out.push(...(await lorePages()))
  return out
}

describe('authored prose markup', () => {
  it('points every lore picture at art that exists', async () => {
    const art = resolve(root, 'data/media/art')
    for (const { where, path, text } of await lorePages()) {
      for (const match of text.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)) {
        const target = resolve(dirname(path), match[1] ?? '')
        expect(dirname(target), `${where} points outside data/media/art`).toBe(art)
        await expect(readFile(target), `${where} ${match[1]}`).resolves.toBeDefined()
      }
    }
  })

  it('names only states and skills the reader can reach', async () => {
    const built = { fr, en }
    const titles = {
      fr: new Set(built.fr.terms.map.keys()),
      en: new Set(built.en.terms.map.keys()),
    }
    for (const { where, text, locale } of await authoredProse()) {
      for (const match of text.matchAll(STATE_REF)) {
        const name = (match[1] ?? '').trim().toLowerCase()
        expect(built[locale].statesByName.has(name), `${where} state [[${match[1]}]]`).toBe(true)
      }
      for (const match of text.matchAll(SKILL_REF)) {
        const name = (match[1] ?? '').trim().toLowerCase()
        expect(titles[locale].has(name), `${where} skill {{${match[1]}}} is not in the index`).toBe(
          true,
        )
      }
    }
  })

  it('writes a quote source only as the closing line of a blockquote', async () => {
    for (const { where, text } of await authoredProse()) {
      const lines = text.split('\n')
      lines.forEach((line, index) => {
        if (!line.includes(':source[')) return
        expect(
          /^> :source\[.+\]$/.test(line),
          `${where} writes :source[ outside a blockquote line of its own`,
        ).toBe(true)
        expect(
          lines[index + 1]?.startsWith('>') ?? false,
          `${where} continues the blockquote after its :source[`,
        ).toBe(false)
      })
    }
  })

  it('opens every chapter body at the second heading level', async () => {
    for (const { where, text } of await authoredProse()) {
      const stray = /^# /m.exec(text)
      expect(stray, `${where} uses a level one heading; the title comes from the frontmatter`).toBe(
        null,
      )
    }
  })
})

describe('prose hygiene', () => {
  async function siteCopy(): Promise<{ where: string; text: string }[]> {
    const out: { where: string; text: string }[] = []
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(strings(locale))) {
        if (typeof value !== 'string') continue
        out.push({ where: `strings.ts ${locale}.${key}`, text: value })
      }
    }
    const dir = 'src/content/policies'
    for (const file of await readdir(resolve(root, dir))) {
      if (!file.endsWith('.md')) continue
      out.push({ where: `${dir}/${file}`, text: await readFile(resolve(root, dir, file), 'utf8') })
    }
    return out
  }

  it('writes none of the phrases the editorial rules refuse', async () => {
    const chapters = (await authoredProse()).map(({ where, text }) => ({ where, text }))
    for (const { where, text } of [...everyRuleText, ...chapters, ...(await siteCopy())]) {
      for (const phrase of BANNED_PHRASES) {
        expect(
          bannedPhrasePattern(phrase).test(text),
          `${where} writes "${phrase}", which editorial-style.md refuses`,
        ).toBe(false)
      }
    }
  })

  it('writes no antithesis outside a book chapter', async () => {
    for (const { where, text } of [...everyRuleText, ...(await siteCopy())]) {
      expect(
        ANTITHESIS.test(text),
        `${where} writes the antithesis. Outside a book chapter, write the contrast as a plain statement or as two sentences`,
      ).toBe(false)
    }
  })

  it('marks emphasis with the three asterisks the renderer parses', () => {
    for (const { where, text } of everyRuleText) {
      for (const run of text.match(ASTERISK_RUN) ?? []) {
        expect(
          run.length,
          `${where} writes a run of ${run.length} asterisks. MARKUP in richtext.ts parses only three, so the characters reach the page`,
        ).toBe(3)
      }
    }
  })
})

describe('the term index', () => {
  it('gives every icon it names a file on disk', async () => {
    const owned = new Set<string>()
    for (const { prefix: set } of ICON_SETS) {
      for (const file of await readdir(resolve(root, 'data/media/icons', set))) {
        owned.add(`${set}/${file.replace(/\.svg$/, '')}`)
      }
    }
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      for (const [key, record] of built.terms.map) {
        if (!record.icon) continue
        expect(owned.has(record.icon), `${locale} term ${key} icon ${record.icon}`).toBe(true)
      }
    }
  })

  it('registers every aptitude and every written form of a state', async () => {
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      const spelling = (word: string): string | undefined =>
        built.terms.map.get(word.toLowerCase())?.spelling
      for (const entry of built.aptitudes.values()) {
        const label = locale === 'en' ? entry.labelEn : entry.labelFr
        expect(spelling(label), `${locale} aptitude ${entry.key}`).toBe(label)
      }
      for (const state of built.states) {
        for (const word of [state.name, ...(state.forms ?? [])]) {
          expect(spelling(word), `${locale} state ${state.key} form ${word}`).toBe(word)
        }
      }
    }
  })

  it('links every skill a playable species page lists, imposed ones included', () => {
    for (const built of [fr, en]) {
      for (const entry of built.species) {
        if (entry.status === 'draft') continue
        for (const skill of entry.pool) {
          expect(
            built.terms.map.get(skill.title.toLowerCase())?.skillId,
            `${built.locale} ${entry.id} ${skill.title}`,
          ).toBe(skill.id)
        }
      }
    }
  })

  it('marks every keyword that rule text actually writes', () => {
    const missed: string[] = []
    for (const { where, text } of allRuleText()) {
      const bare = text.replace(CALLOUT, '').replace(STATE_REF, '').replace(SKILL_REF, '')
      for (const state of fr.states) {
        for (const word of [state.name, ...(state.forms ?? [])]) {
          const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${word}(?![\\p{L}\\p{N}])`, 'u')
          if (!pattern.test(bare)) continue
          if (fr.terms.map.get(word.toLowerCase())?.spelling !== word) {
            missed.push(`${where}: ${word}`)
          }
        }
      }
    }
    expect(missed, 'state words written in rule text that the index cannot mark').toEqual([])
  })
})

describe('definitions', () => {
  const GLOSSED_VOCABULARIES = new Set(['aptitudes', 'characteristics'])
  const DEFINED_FAMILIES = new Set(['rule', 'characteristic', 'aptitude'])

  it('gives every rule term, Caractéristique and Aptitude a definition of its own', async () => {
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      const byWord = new Map<string, string>()
      for (const record of built.terms.map.values()) {
        if (!DEFINED_FAMILIES.has(record.family)) continue
        expect(record.text.trim(), `${locale} ${record.family} ${record.title}`).not.toBe('')
        byWord.set(`${record.family} ${record.title}`, record.text)
      }
      const owners = new Map<string, string>()
      for (const [word, text] of byWord) {
        const owner = owners.get(text)
        expect(owner, `${locale} ${word} shares its definition with ${owner}`).toBeUndefined()
        owners.set(text, word)
      }
    }
  })

  it('defines the Banque Commune with the Common Bank note, in every locale', async () => {
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      for (const word of ['banque commune', 'common bank']) {
        const record = built.terms.map.get(word)
        expect(record?.family, `${locale} ${word}`).toBe('rule')
        expect(record?.text, `${locale} ${word}`).toBe(built.bank.note)
      }
    }
  })

  it('writes a definition only where a tooltip shows it', () => {
    for (const vocabulary of sources.vocabularies) {
      for (const entry of vocabulary.data.entries) {
        const glossed =
          GLOSSED_VOCABULARIES.has(vocabulary.id) && entry.key !== VARIABLE_CHARACTERISTIC
        expect(
          entry.definitionFr !== undefined,
          `meta/${vocabulary.id} ${entry.key} ${glossed ? 'needs' : 'takes no'} definition`,
        ).toBe(glossed)
      }
    }
  })

  it('keeps the variable Caractéristique out of the term index', () => {
    const entry = fr.characteristics.get(VARIABLE_CHARACTERISTIC)
    expect(entry, 'meta/characteristics any').toBeDefined()
    for (const word of [entry?.labelFr, entry?.labelEn]) {
      expect(fr.terms.map.get(String(word).toLowerCase()), `${word} is indexed`).toBeUndefined()
    }
  })

  it('writes every definition the index shows in the house typography and voice', async () => {
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      for (const record of built.terms.map.values()) {
        if (!DEFINED_FAMILIES.has(record.family)) continue
        const where = `${locale} ${record.family} ${record.title}`
        for (const glyph of [...BANNED_DASHES, ...FOREIGN_TYPOGRAPHY]) {
          expect(record.text.includes(glyph), `${where} writes U+${codePointOf(glyph)}`).toBe(false)
        }
        for (const phrase of BANNED_PHRASES) {
          expect(bannedPhrasePattern(phrase).test(record.text), `${where} writes "${phrase}"`).toBe(
            false,
          )
        }
        expect(ANTITHESIS.test(record.text), `${where} writes the antithesis`).toBe(false)
      }
    }
  })
})

describe('the rules index', () => {
  it('lists every defined word, every tag and every basic skill once, under ids both locales share', async () => {
    const idsOf = async (locale: (typeof LOCALES)[number]): Promise<string[]> =>
      ruleBrowseEntries(await readCorpus(root, locale), locale).map((entry) => entry.id)
    const ids = await idsOf('fr')
    expect(new Set(ids).size, 'rule ids are unique').toBe(ids.length)
    expect(new Set(await idsOf('en'))).toEqual(new Set(ids))

    const listed = new Set(ids)
    const ruleWords = new Set(
      [...fr.terms.map.values()].filter((record) => record.family === 'rule').map((r) => r.title),
    )
    expect(ids.filter((id) => id.startsWith('rule-')).length).toBe(ruleWords.size)
    for (const key of fr.characteristics.keys()) {
      if (key === VARIABLE_CHARACTERISTIC) continue
      expect(listed.has(`characteristic-${key}`), key).toBe(true)
    }
    for (const key of fr.aptitudes.keys()) expect(listed.has(`aptitude-${key}`), key).toBe(true)
    for (const state of fr.states) expect(listed.has(`state-${state.key}`), state.key).toBe(true)
    for (const skill of fr.basic.resolved)
      expect(listed.has(`basic-${skill.id}`), skill.id).toBe(true)

    const filedAsTags = ruleBrowseEntries(fr, 'fr').filter((entry) =>
      entry.attrs['data-facet-fam']?.split(' ').includes('tag'),
    )
    expect(filedAsTags.length).toBe(fr.tags.size)
  })

  it('lists Sort once, as a rule word that also files under the tags', () => {
    const entries = ruleBrowseEntries(fr, 'fr')
    const sort = entries.filter((entry) => entry.title === 'Sort')
    expect(sort.map((entry) => entry.id)).toEqual(['rule-sort'])
    expect(sort[0]?.attrs['data-facet-fam']).toBe('rule tag')
    expect(entries.some((entry) => entry.id === 'tag-spell')).toBe(false)
  })
})

describe('the basic skills', () => {
  it('offers every basic skill in the skills index, under a provenance with its own note', async () => {
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      expect(built.basic.note?.trim(), `${locale} basic-skills note`).toBeTruthy()
      const entries = new Map(
        skillBrowseEntries(originSkills(built), built, locale).map((entry) => [entry.id, entry]),
      )
      for (const skill of built.basic.resolved) {
        const entry = entries.get(skill.id)
        expect(entry?.attrs['data-facet-acq']?.split(' '), `${locale} ${skill.id}`).toContain(
          'basic',
        )
        expect(entry?.sources, `${locale} ${skill.id}`).toEqual([
          { kind: 'basic', title: built.basic.name },
        ])
      }
    }
    expect(en.basic.name).not.toBe(fr.basic.name)
    expect(en.basic.note).not.toBe(fr.basic.note)
  })

  it('sends the cross reference of a basic or Common Bank skill to its skills index entry', async () => {
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      for (const skill of [...built.basic.resolved, ...built.bank.resolved]) {
        expect(built.terms.map.get(skill.title.toLowerCase())?.href, `${locale} ${skill.id}`).toBe(
          `${pathFor('skills', locale)}#e-${skill.id}`,
        )
      }
    }
  })
})

describe('skill tags', () => {
  it('names only declared tags, each in its own slot', () => {
    for (const skill of fr.skills.values()) {
      for (const { key, kind } of skillTags(skill.tags)) {
        expect(fr.tags.get(key)?.kind, `${skill.id} ${kind} ${key}`).toBe(kind)
      }
    }
  })

  it('pairs an École only with a Pratique it accepts', () => {
    for (const skill of fr.skills.values()) {
      const { practice, school } = skill.tags ?? {}
      if (practice === undefined || school === undefined) continue
      expect(fr.tags.get(school)?.practices, `${skill.id} ${school} x ${practice}`).toContain(
        practice,
      )
    }
  })

  it('declares only tags some skill carries', () => {
    const carried = new Set(
      [...fr.skills.values()].flatMap((skill) => skillTags(skill.tags).map((slot) => slot.key)),
    )
    for (const key of fr.tags.keys()) {
      expect(carried.has(key), `data/meta/tags.json ${key} is carried by no skill`).toBe(true)
    }
  })

  it('defines Sort once, from its tag', async () => {
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      const spell = built.tags.get('spell')
      const word = label(spell, locale, 'spell')
      const record = built.terms.map.get(word.toLowerCase())
      expect(record?.family, `${locale} ${word}`).toBe('rule')
      expect(record?.title, `${locale} ${word} title`).toBe(word)
      expect(record?.text, `${locale} ${word} definition`).toBe(definition(spell, locale))
    }
  })

  it('cites only declared tags in French rule text', () => {
    const labels = [...fr.tags.values()]
      .map((tag) => tag.labelFr)
      .sort((a, b) => b.length - a.length)
    const citation = /l['’]étiquette (?=\p{Lu})/gu
    for (const { where, text } of allRuleText(fr)) {
      for (const match of text.matchAll(citation)) {
        let rest = text.slice((match.index ?? 0) + match[0].length)
        for (;;) {
          const cited = labels.find((name) => rest.startsWith(name))
          expect(cited, `${where} cites an undeclared tag: ${rest.slice(0, 30)}`).toBeDefined()
          rest = rest.slice(cited?.length ?? 0)
          const next = rest.match(/^ (?:ou|et) (?=\p{Lu})/u)
          if (!next) break
          rest = rest.slice(next[0].length)
        }
      }
    }
  })
})

describe('translation coverage', () => {
  it('builds every locale without an unresolved reference', async () => {
    for (const locale of LOCALES) {
      const built = await readCorpus(root, locale)
      expect(built.skills.size, `${locale} skills`).toBe(fr.skills.size)
      expect(built.trees.length, `${locale} trees`).toBe(fr.trees.length)
      expect(built.species.length, `${locale} species`).toBe(fr.species.length)
      expect(built.items.length, `${locale} items`).toBe(fr.items.length)
    }
  })

  it('carries only overlays that target a file that exists', () => {
    const known = new Set<string>()
    for (const entry of sources.skills) known.add(`skills/${entry.id}`)
    for (const entry of sources.skillTrees) known.add(`skill-trees/${entry.id}`)
    for (const entry of sources.skillLists) known.add(`skill-lists/${entry.id}`)
    for (const entry of sources.speciesEntries) known.add(`species/${entry.id}`)
    for (const entry of sources.states) known.add(`states/${entry.id}`)
    for (const entry of sources.equipmentItems) known.add(`equipment/items/${entry.id}`)
    for (const entry of sources.equipmentSets) known.add(`equipment/sets/${entry.id}`)
    for (const entry of sources.books) known.add(`books/${entry.id}`)
    known.add('equipment/catalogue')

    for (const overlay of sources.translations) {
      const target = overlay.id.replace(/\.[a-z]{2}$/, '')
      expect(known.has(target), `overlay ${overlay.id} targets nothing`).toBe(true)
    }
  })

  it('carries only overlay fields its kind allows', () => {
    const kinds = [
      ['skills/', overlays.skill],
      ['skill-trees/', overlays.skillTree],
      ['skill-lists/', overlays.skillList],
      ['species/', overlays.species],
      ['states/', overlays.state],
      ['equipment/items/', overlays.equipmentItem],
      ['equipment/sets/', overlays.equipmentSet],
      ['equipment/catalogue', overlays.equipmentCatalogue],
      ['books/', overlays.book],
    ] as const
    for (const overlay of sources.translations) {
      const kind = kinds.find(([prefix]) => overlay.id.startsWith(prefix))
      expect(kind, `overlay ${overlay.id} has no known kind`).toBeDefined()
      const parsed = kind?.[1].safeParse(overlay.data)
      expect(parsed?.success, `overlay ${overlay.id} carries a field its kind does not allow`).toBe(
        true,
      )
    }
  })

  it('translates only sub-species that exist', () => {
    const byId = new Map(sources.speciesEntries.map((entry) => [entry.data.id, entry.data]))
    for (const overlay of sources.translations) {
      if (!overlay.id.startsWith('species/')) continue
      const parsed = overlays.species.safeParse(overlay.data)
      if (!parsed.success) continue
      const target = byId.get(overlay.id.slice('species/'.length).replace(/\.[a-z]{2}$/, ''))
      const ids = new Set((target?.subspecies ?? []).map((sub) => sub.id))
      for (const id of Object.keys(parsed.data.subspecies ?? {})) {
        expect(ids.has(id), `overlay ${overlay.id} translates the unknown sub-species ${id}`).toBe(
          true,
        )
      }
    }
  })
})

describe('asset ownership', () => {
  const mediaDir = resolve(root, 'data/media')

  const owned = async (): Promise<string[]> => {
    const out: string[] = [...OWNED_FILES]
    for (const directory of OWNED_DIRECTORIES) {
      for (const file of await readdir(resolve(mediaDir, directory)).catch(() => [])) {
        if (!file.startsWith('.')) out.push(`${directory}/${file}`)
      }
    }
    return out.sort()
  }

  it('declares every directory and loose file under data/media', async () => {
    const declared = new Set<string>([
      ...OWNED_DIRECTORIES,
      ...STRIPPED_DIRECTORIES,
      ...FOREIGN_DIRECTORIES,
      ...GENERATED_DIRECTORIES,
    ])
    for (const entry of await readdir(mediaDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const known = entry.isDirectory()
        ? declared.has(entry.name)
        : (OWNED_FILES as readonly string[]).includes(entry.name)
      expect(known, `data/media/${entry.name} is not declared in src/lib/rights/ownership.ts`).toBe(
        true,
      )
    }
  })

  it('writes the current claim into every owned picture', async () => {
    for (const relative of await owned()) {
      if (!relative.endsWith('.png') && !relative.endsWith('.jpg')) continue
      const bytes = new Uint8Array(await readFile(resolve(mediaDir, relative)))
      const claim = pictureClaim(captions.get(relative))
      const next = relative.endsWith('.png')
        ? stampPng(stripPng(bytes), claim)
        : stampJpeg(stripJpeg(bytes), claim)
      expect(
        Buffer.from(next).equals(Buffer.from(bytes)),
        `${relative}. Run: pnpm media:stamp`,
      ).toBe(true)
    }
  })

  it('writes the current claim into every owned vector and the video', async () => {
    for (const relative of await owned()) {
      const path = resolve(mediaDir, relative)
      if (relative.endsWith('.svg')) {
        const source = await readFile(path, 'utf8')
        expect(stampSvg(source, pictureClaim(captions.get(relative))), relative).toBe(source)
      }
      if (relative.endsWith('.mp4')) {
        const bytes = new Uint8Array(await readFile(path))
        expect(
          mp4IsStamped(bytes, pictureClaim(captions.get(relative))),
          `${relative}. Run: pnpm media:stamp`,
        ).toBe(true)
      }
    }
  })

  it('carries no foreign provenance on anything the studio ships', async () => {
    const roots = [...OWNED_DIRECTORIES, ...STRIPPED_DIRECTORIES, ...GENERATED_DIRECTORIES]
    const paths = [...OWNED_FILES.map((file) => resolve(mediaDir, file))]
    for (const directory of roots) {
      for (const file of await readdir(resolve(mediaDir, directory)).catch(() => [])) {
        if (!file.startsWith('.')) paths.push(resolve(mediaDir, directory, file))
      }
    }
    for (const path of paths) {
      const text = (await readFile(path)).toString('latin1')
      for (const needle of FOREIGN_PROVENANCE) {
        expect(text.includes(needle), `${path} carries ${needle}`).toBe(false)
      }
    }
  })

  it('leaves the flags bare, claiming neither of them', async () => {
    for (const directory of STRIPPED_DIRECTORIES) {
      for (const file of await readdir(resolve(mediaDir, directory))) {
        if (file.startsWith('.')) continue
        const source = await readFile(resolve(mediaDir, directory, file), 'utf8')
        expect(source, `${directory}/${file} carries metadata`).not.toContain('<metadata')
        expect(source.length, `${directory}/${file} is ${source.length} bytes`).toBeLessThan(1000)
      }
    }
  })

  it('names a file on disk for every caption, and never twice', async () => {
    const files = new Set(await owned())
    for (const [file] of captions) {
      expect(files.has(file), `data/media-captions.json names ${file}, which is not owned`).toBe(
        true,
      )
    }
  })

  it('keeps no description that lives only inside a picture', async () => {
    for (const relative of await owned()) {
      if (!relative.endsWith('.png')) continue
      const text = readPngText(new Uint8Array(await readFile(resolve(mediaDir, relative))))
      const embedded = text.get('Description')
      if (embedded === undefined) continue
      expect(
        captions.get(relative)?.description,
        `${relative} describes itself off the record`,
      ).toBe(embedded)
    }
  })

  it('stamps a derivative without touching one pixel of it', async () => {
    const master = resolve(mediaDir, 'items/dague-1_1-og.png')
    const derivative = await sharp(master).resize(64).webp({ quality: 80 }).toBuffer()
    const stamped = stampWebp(new Uint8Array(derivative), licenceClaim())

    const before = await sharp(derivative).raw().toBuffer()
    const after = await sharp(Buffer.from(stamped)).raw().toBuffer()
    expect(before.equals(after), 'stamping a WebP changed its pixels').toBe(true)

    const { xmpAsString } = await sharp(Buffer.from(stamped)).metadata()
    expect(xmpAsString).toContain(`© ${YEAR} ${HOLDER}`)
    expect(xmpAsString).toContain(LICENCE.deed)
  })

  it('stamps every booklet as it is rendered', async () => {
    const files = (await readdir(resolve(root, 'data/media/pdf'))).filter((file) =>
      file.endsWith('.pdf'),
    )
    expect(files.length, 'no booklet on disk').toBeGreaterThan(0)
    for (const file of files) {
      const bytes = new Uint8Array(await readFile(resolve(root, 'data/media/pdf', file)))
      expect(pdfIsStamped(bytes), `${file}. Run: pnpm pdf --force`).toBe(true)
    }
  })

  it('says the same thing in the footer as it writes into the files', () => {
    for (const locale of LOCALES) {
      expect(strings(locale).copyright, `${locale} footer`).toBe(`© ${HOLDER}`)
      expect(strings(locale).creditsLicence(LICENCE.id), `${locale} colophon`).toContain(LICENCE.id)
    }
  })
})

describe('what the site credits', () => {
  it('declares every icon set that has a directory on disk, and no other', async () => {
    const onDisk = (await readdir(resolve(root, 'data/media/icons'), { withFileTypes: true }))
      .filter((entry: Dirent) => entry.isDirectory())
      .map((entry: Dirent) => entry.name)
      .sort()
    const declared = ICON_SETS.map((set) => set.prefix).sort()
    expect(declared, 'src/lib/rights/attribution.ts and data/media/icons/ disagree').toEqual(onDisk)
  })

  it('declares every font family that has a file on disk, and no other', async () => {
    const files = (await readdir(resolve(root, 'data/media/fonts'))).filter((file) =>
      file.endsWith('.woff2'),
    )
    expect(files.length, 'no font on disk').toBeGreaterThan(0)

    const declared = FONT_FAMILIES.map((family) => family.slug)
    for (const file of files) {
      const owner = declared.find((slug) => file.startsWith(`${slug}-`))
      expect(owner, `${file} is credited by no family in attribution.ts`).toBeDefined()
    }
    for (const slug of declared) {
      expect(
        files.some((file) => file.startsWith(`${slug}-`)),
        `attribution.ts credits ${slug}, which has no file on disk`,
      ).toBe(true)
    }
  })

  it('names the licence and its deed on the licences page, in both locales', async () => {
    for (const file of ['licences.md', 'licences.en.md']) {
      const body = await readFile(resolve(root, 'src/content/policies', file), 'utf8')
      expect(body, `${file} does not name ${LICENCE.id}`).toContain(LICENCE.id)
      expect(body, `${file} does not link ${LICENCE.deed}`).toContain(LICENCE.deed)
    }
  })

  it('writes no version into a user interface string', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(strings(locale))) {
        if (typeof value !== 'string') continue
        expect(value, `${locale}.${key} carries a version that cannot follow Aubaine`).not.toMatch(
          /\bv\d+\.\d+/i,
        )
      }
    }
  })
})
