import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ID_LETTERS = 6
const OWNER_LETTERS = 4
export const BASE_NUMBER = 1
const PADDING = 'X'

const FUNCTION_WORDS = new Set([
  'le',
  'la',
  'les',
  'l',
  'un',
  'une',
  'des',
  'du',
  'de',
  'd',
  'au',
  'aux',
  'à',
  'et',
  'ou',
  'en',
  'par',
  'pour',
  'sur',
  'sous',
  'avec',
  'dans',
  'je',
  'tu',
  'il',
  'elle',
  'on',
  'nous',
  'vous',
  'ils',
  'elles',
  'se',
  's',
])

type Share = { word: string; taken: number }

function unaccented(word: string): string {
  return word
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/œ/giu, 'oe')
    .replace(/æ/giu, 'ae')
    .toUpperCase()
}

export function titleWords(title: string): string[] {
  const words = title.split(/[^\p{L}\p{N}]+/u).filter((word) => word !== '')
  const meaningful = words.filter(
    (word) => word.length > 1 && !FUNCTION_WORDS.has(word.toLowerCase()),
  )
  return (meaningful.length > 0 ? meaningful : words).map(unaccented)
}

function share(words: string[], count: number): Share[] {
  const kept = words.slice(0, count)
  const shares = kept.map((word, index) => ({
    word,
    taken: Math.min(
      word.length,
      Math.floor(count / kept.length) + (index < count % kept.length ? 1 : 0),
    ),
  }))
  let missing = count - shares.reduce((total, entry) => total + entry.taken, 0)
  while (missing > 0 && shares.some((entry) => entry.taken < entry.word.length)) {
    for (const entry of shares) {
      if (missing === 0) break
      if (entry.taken < entry.word.length) {
        entry.taken += 1
        missing -= 1
      }
    }
  }
  return shares
}

function spell(shares: Share[], count: number): string {
  return shares
    .map((entry) => entry.word.slice(0, entry.taken))
    .join('')
    .padEnd(count, PADDING)
}

function letters(words: string[], count: number): string {
  return spell(share(words, count), count)
}

export function skillIdLetters(title: string): string {
  return letters(titleWords(title), ID_LETTERS)
}

export function sharedSkillIdLetters(title: string, owner: string): string {
  const words = titleWords(title)
  const [first = '', second] = words
  const concept = second === undefined ? first.slice(0, 2) : `${first[0]}${second[0]}`
  return `${concept.padEnd(2, PADDING)}${letters(titleWords(owner), OWNER_LETTERS)}`
}

export function collisionShifts(title: string): string[] {
  const shares = share(titleWords(title), ID_LETTERS)
  const plain = spell(shares, ID_LETTERS)
  const shifts: string[] = []
  for (let index = shares.length - 1; index >= 0; index -= 1) {
    const entry = shares[index]
    if (entry === undefined || entry.taken === 0) continue
    for (let next = entry.taken; next < entry.word.length; next += 1) {
      const shifted = shares.map((other, position) =>
        position === index
          ? `${other.word.slice(0, other.taken - 1)}${other.word[next]}`
          : other.word.slice(0, other.taken),
      )
      const candidate = shifted.join('').padEnd(ID_LETTERS, PADDING)
      if (candidate !== plain && !shifts.includes(candidate)) shifts.push(candidate)
    }
  }
  return shifts
}

export function skillId(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(3, '0')}`
}

export function idLetters(id: string): string {
  return id.slice(0, ID_LETTERS)
}

export function idNumber(id: string): number {
  return Number(id.slice(ID_LETTERS + 1))
}

export type HeldSkill = { id: string; title: string; evolvesFrom?: string | undefined }

export type Resolution =
  | { kind: 'free'; id: string }
  | { kind: 'existing'; id: string }
  | { kind: 'titled'; carriers: HeldSkill[] }
  | { kind: 'shifted'; id: string; holder: HeldSkill }
  | { kind: 'blocked'; holder: HeldSkill }

export function resolveSkillId(title: string, held: HeldSkill[], owner?: string): Resolution {
  const bases = held.filter((skill) => skill.evolvesFrom === undefined)
  const letters = owner === undefined ? skillIdLetters(title) : sharedSkillIdLetters(title, owner)
  const holderOf = (prefix: string): HeldSkill | undefined =>
    bases.find((skill) => idLetters(skill.id) === prefix)
  const holder = holderOf(letters)
  if (holder?.title === title) return { kind: 'existing', id: holder.id }
  const carriers = bases.filter((skill) => skill.title === title)
  if (owner === undefined && carriers.length > 0) return { kind: 'titled', carriers }
  if (holder === undefined) return { kind: 'free', id: skillId(letters, BASE_NUMBER) }
  const free = collisionShifts(title).find((candidate) => holderOf(candidate) === undefined)
  return free === undefined
    ? { kind: 'blocked', holder }
    : { kind: 'shifted', id: skillId(free, BASE_NUMBER), holder }
}

async function heldSkills(root: string): Promise<HeldSkill[]> {
  const dir = resolve(root, 'data/skills')
  const files = (await readdir(dir)).filter((file) => /^[A-Z0-9-]+\.json$/.test(file))
  return Promise.all(
    files.map(async (file) => {
      const { id, title, evolvesFrom } = JSON.parse(await readFile(resolve(dir, file), 'utf8'))
      return { id, title, evolvesFrom }
    }),
  )
}

function option(args: string[], name: string): string | undefined {
  const at = args.indexOf(name)
  return at === -1 ? undefined : args[at + 1]
}

function report(title: string, resolution: Resolution): void {
  switch (resolution.kind) {
    case 'free':
      console.log(resolution.id)
      return
    case 'existing':
      console.log(resolution.id)
      console.error(`« ${title} » is already the title of ${resolution.id}.`)
      return
    case 'shifted':
      console.log(
        `${idLetters(resolution.holder.id)} is held by ${resolution.holder.id} ${resolution.holder.title}`,
      )
      console.log(resolution.id)
      return
    case 'titled':
      console.error(
        `« ${title} » is already the title of ${resolution.carriers.map((skill) => skill.id).join(', ')}. ` +
          'A title several trees share takes --owner "<Arbre ou Espèce>", and only while every skill that carries it is a draft; otherwise choose another title.',
      )
      process.exitCode = 1
      return
    case 'blocked':
      console.error(
        `skill:id: every shift of « ${title} » is held, the first by ${resolution.holder.id}. Choose another title.`,
      )
      process.exitCode = 1
  }
}

async function main(): Promise<void> {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const args = process.argv.slice(2)
  const held = await heldSkills(root)

  const base = option(args, '--evolves')
  if (base !== undefined) {
    const family = held.filter((skill) => idLetters(skill.id) === idLetters(base))
    if (family.length === 0) {
      console.error(`skill:id: no skill holds ${base}`)
      process.exitCode = 1
      return
    }
    console.log(
      skillId(idLetters(base), Math.max(...family.map((skill) => idNumber(skill.id))) + 1),
    )
    return
  }

  const title = args.find((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--owner')
  if (title === undefined) {
    console.error('usage: pnpm skill:id "<titre>" [--owner "<Arbre ou Espèce>"] | --evolves <ID>')
    process.exitCode = 1
    return
  }
  report(title, resolveSkillId(title, held, option(args, '--owner')))
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
