import { createHash } from 'node:crypto'
import type { Dirent } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

import type { Corpus, ResolvedBook, ResolvedTree } from '../game/build.ts'
import type { EquipmentCatalogue, GameState, Skill } from '../game/schema.ts'
import type { Locale } from '../i18n/locales.ts'
import { stripJpeg } from '../rights/jpeg.ts'
import { stripPng } from '../rights/png.ts'
import type { Release } from './release.ts'

const HASH_LENGTH = 8

const STYLE_DIRECTORIES = ['styles', 'components/primitives', 'components/print', 'scripts']

type Blobs = Map<string, Uint8Array>

const EMPTY = new Uint8Array()

function digest(blobs: Blobs): string {
  const payload = createHash('sha256')
  for (const key of [...blobs.keys()].sort()) {
    payload.update(key)
    payload.update('\0')
    payload.update(
      createHash('sha256')
        .update(blobs.get(key) ?? EMPTY)
        .digest('hex'),
    )
    payload.update('\0')
  }
  return payload.digest('hex').slice(0, HASH_LENGTH)
}

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true }).catch(
    (): Dirent[] => [],
  )
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
}

async function addFile(blobs: Blobs, key: string, path: string): Promise<void> {
  const bytes = await readFile(path).catch(() => undefined)
  blobs.set(key, bytes ?? EMPTY)
}

export async function styleHash(root: string): Promise<string> {
  const source = resolve(root, 'src')
  const blobs: Blobs = new Map()
  for (const directory of STYLE_DIRECTORIES) {
    for (const path of await filesUnder(resolve(source, directory))) {
      await addFile(blobs, relative(source, path).split(sep).join('/'), path)
    }
  }
  return digest(blobs)
}

function statesUsedBy(descriptions: string[], states: GameState[]): GameState[] {
  const text = descriptions.join('\n').toLowerCase()
  return states.filter((state) =>
    [state.name, ...(state.forms ?? [])].some((form) => text.includes(form.toLowerCase())),
  )
}

export function treeDescriptions(tree: ResolvedTree): string[] {
  const out: string[] = []
  for (const placement of tree.placements) {
    out.push(placement.skill.description)
    for (const upgrade of placement.skill.upgrades ?? []) out.push(upgrade.description)
  }
  return out
}

export function treeStates(tree: ResolvedTree, corpus: Corpus): GameState[] {
  return statesUsedBy(treeDescriptions(tree), corpus.states)
}

export function catalogueSkills(corpus: Corpus): Skill[] {
  const granted: string[] = []
  for (const item of corpus.items) granted.push(...(item.grants ?? []))
  for (const set of corpus.sets.values()) {
    for (const bonus of set.bonuses) granted.push(...(bonus.grants ?? []))
  }
  const seen = new Set<string>()
  const out: Skill[] = []
  for (const id of granted) {
    if (seen.has(id)) continue
    seen.add(id)
    const skill = corpus.skills.get(id)
    if (skill) out.push(skill)
  }
  return out
}

export function catalogueDescriptions(corpus: Corpus): string[] {
  const out: string[] = []
  for (const item of corpus.items) {
    out.push(item.description)
    if (item.text) out.push(item.text)
    for (const property of item.properties ?? []) out.push(property.text)
  }
  for (const set of corpus.sets.values()) {
    for (const bonus of set.bonuses) out.push(bonus.text)
  }
  for (const skill of catalogueSkills(corpus)) {
    out.push(skill.description)
    for (const upgrade of skill.upgrades ?? []) out.push(upgrade.description)
  }
  return out
}

export function catalogueStates(corpus: Corpus): GameState[] {
  return statesUsedBy(catalogueDescriptions(corpus), corpus.states)
}

async function addMeta(blobs: Blobs, root: string, locale: Locale): Promise<void> {
  for (const path of await filesUnder(resolve(root, 'data/meta'))) {
    await addFile(blobs, `meta/${relative(resolve(root, 'data/meta'), path)}`, path)
  }
  await addFile(blobs, 'aubaine.json', resolve(root, 'data/aubaine.json'))
  blobs.set('@locale', Buffer.from(locale))
}

async function addPicture(blobs: Blobs, key: string, path: string): Promise<void> {
  const bytes = await readFile(path).catch(() => undefined)
  if (bytes === undefined) {
    blobs.set(key, EMPTY)
    return
  }
  const pixels = new Uint8Array(bytes)
  blobs.set(key, key.endsWith('.png') ? stripPng(pixels) : stripJpeg(pixels))
}

async function addArt(blobs: Blobs, root: string, files: (string | undefined)[]): Promise<void> {
  for (const file of files) {
    if (!file) continue
    await addPicture(blobs, `art/${file}`, resolve(root, 'data/media/art', file))
  }
}

async function addItemArt(
  blobs: Blobs,
  root: string,
  files: (string | undefined)[],
): Promise<void> {
  for (const file of files) {
    if (!file) continue
    await addPicture(blobs, `items/${file}`, resolve(root, 'data/media/items', file))
  }
}

async function addOverlay(blobs: Blobs, key: string, path: string): Promise<void> {
  const bytes = await readFile(path).catch(() => undefined)
  if (bytes !== undefined) blobs.set(key, bytes)
}

export async function treeContentHash(
  root: string,
  tree: ResolvedTree,
  corpus: Corpus,
  locale: Locale,
): Promise<string> {
  const blobs: Blobs = new Map()
  await addFile(
    blobs,
    `skill-trees/${tree.id}.json`,
    resolve(root, `data/skill-trees/${tree.id}.json`),
  )
  await addOverlay(
    blobs,
    `skill-trees/${tree.id}.${locale}.json`,
    resolve(root, `data/skill-trees/${tree.id}.${locale}.json`),
  )
  for (const placement of tree.placements) {
    const id = placement.skill.id
    await addFile(blobs, `skills/${id}.json`, resolve(root, `data/skills/${id}.json`))
    await addOverlay(
      blobs,
      `skills/${id}.${locale}.json`,
      resolve(root, `data/skills/${id}.${locale}.json`),
    )
  }
  for (const state of treeStates(tree, corpus)) {
    await addFile(blobs, `states/${state.key}.json`, resolve(root, `data/states/${state.key}.json`))
    await addOverlay(
      blobs,
      `states/${state.key}.${locale}.json`,
      resolve(root, `data/states/${state.key}.${locale}.json`),
    )
  }
  await addArt(blobs, root, [tree.cover, tree.banner, tree.backCover])
  await addMeta(blobs, root, locale)
  return digest(blobs)
}

export async function bookContentHash(
  root: string,
  book: ResolvedBook,
  locale: Locale,
): Promise<string> {
  const blobs: Blobs = new Map()
  const directory = resolve(root, 'data/books', book.id)
  await addFile(blobs, `books/${book.id}/book.json`, join(directory, 'book.json'))
  await addOverlay(
    blobs,
    `books/${book.id}/book.${locale}.json`,
    join(directory, `book.${locale}.json`),
  )
  for (const chapter of book.chapters) {
    await addFile(
      blobs,
      `books/${book.id}/${chapter.file}.md`,
      join(directory, `${chapter.file}.md`),
    )
    await addOverlay(
      blobs,
      `books/${book.id}/${chapter.file}.${locale}.md`,
      join(directory, `${chapter.file}.${locale}.md`),
    )
  }
  await addArt(blobs, root, [book.cover, book.banner, book.backCover])
  await addMeta(blobs, root, locale)
  return digest(blobs)
}

export async function equipmentContentHash(
  root: string,
  catalogue: EquipmentCatalogue,
  corpus: Corpus,
  locale: Locale,
): Promise<string> {
  const blobs: Blobs = new Map()
  await addFile(blobs, 'equipment/catalogue.json', resolve(root, 'data/equipment/catalogue.json'))
  await addOverlay(
    blobs,
    `equipment/catalogue.${locale}.json`,
    resolve(root, `data/equipment/catalogue.${locale}.json`),
  )
  await addFile(blobs, 'equipment/guide.md', resolve(root, 'data/equipment/guide.md'))
  await addOverlay(
    blobs,
    `equipment/guide.${locale}.md`,
    resolve(root, `data/equipment/guide.${locale}.md`),
  )
  for (const slug of [...corpus.itemsBySlug.keys()].sort()) {
    await addFile(
      blobs,
      `equipment/items/${slug}.json`,
      resolve(root, `data/equipment/items/${slug}.json`),
    )
    await addOverlay(
      blobs,
      `equipment/items/${slug}.${locale}.json`,
      resolve(root, `data/equipment/items/${slug}.${locale}.json`),
    )
  }
  for (const id of [...corpus.sets.keys()].sort()) {
    await addFile(
      blobs,
      `equipment/sets/${id}.json`,
      resolve(root, `data/equipment/sets/${id}.json`),
    )
    await addOverlay(
      blobs,
      `equipment/sets/${id}.${locale}.json`,
      resolve(root, `data/equipment/sets/${id}.${locale}.json`),
    )
  }
  for (const skill of catalogueSkills(corpus)) {
    await addFile(blobs, `skills/${skill.id}.json`, resolve(root, `data/skills/${skill.id}.json`))
    await addOverlay(
      blobs,
      `skills/${skill.id}.${locale}.json`,
      resolve(root, `data/skills/${skill.id}.${locale}.json`),
    )
  }
  for (const state of catalogueStates(corpus)) {
    await addFile(blobs, `states/${state.key}.json`, resolve(root, `data/states/${state.key}.json`))
    await addOverlay(
      blobs,
      `states/${state.key}.${locale}.json`,
      resolve(root, `data/states/${state.key}.${locale}.json`),
    )
  }
  await addItemArt(
    blobs,
    root,
    corpus.items.map((item) => item.art),
  )
  await addArt(blobs, root, [catalogue.cover, catalogue.backCover])
  await addMeta(blobs, root, locale)
  return digest(blobs)
}

export type BookletTarget =
  | { kind: 'tree'; entry: ResolvedTree }
  | { kind: 'book'; entry: ResolvedBook }
  | { kind: 'equipment'; entry: EquipmentCatalogue }

async function contentHashFor(
  root: string,
  target: BookletTarget,
  corpus: Corpus,
  locale: Locale,
): Promise<string> {
  switch (target.kind) {
    case 'tree':
      return treeContentHash(root, target.entry, corpus, locale)
    case 'book':
      return bookContentHash(root, target.entry, locale)
    case 'equipment':
      return equipmentContentHash(root, target.entry, corpus, locale)
  }
}

export async function releaseFor(
  root: string,
  target: BookletTarget,
  corpus: Corpus,
  locale: Locale,
  version: string,
  style: string,
): Promise<Release> {
  const contentHash = await contentHashFor(root, target, corpus, locale)
  return {
    slug: target.entry.id,
    kind: target.kind,
    locale,
    version,
    styleHash: style,
    contentHash,
  }
}
