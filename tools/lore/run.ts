import { execFile } from 'node:child_process'
import { access, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { readCorpus } from '../../src/lib/game/fs-sources.ts'
import { type LoreTarget, renderSurvey, resolveTarget, surveyPage } from './survey.ts'
import { LORE_DIR, loreTargets, printedPage, targetArgumentsOf } from './targets.ts'

const run = promisify(execFile)

type Neighbour = { file: string; hits: number; changed: string }

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  )
}

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter((entry) => entry.isFile() && /\.(md|json)$/.test(entry.name))
    .map((entry) => resolve(entry.parentPath, entry.name))
}

function namePattern(target: LoreTarget): RegExp {
  const words = [target.id, ...target.names].map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )
  return new RegExp(`(?<!\\p{L})(?:${words.join('|')})[sx]?(?!\\p{L})`, 'giu')
}

async function neighbours(root: string, target: LoreTarget, own: string[]): Promise<Neighbour[]> {
  const pattern = namePattern(target)
  const files = (await filesUnder(resolve(root, 'data'))).filter(
    (file) => !file.includes('/data/media/') && !own.includes(file),
  )
  const found = await Promise.all(
    files.map(async (file) => {
      const hits = (await readFile(file, 'utf8')).match(pattern)?.length ?? 0
      if (hits === 0) return undefined
      const { stdout } = await run('git', ['log', '-1', '--format=%cs', '--', file], { cwd: root })
      return { file: relative(root, file), hits, changed: stdout.trim() || 'uncommitted' }
    }),
  )
  return found
    .filter((entry): entry is Neighbour => entry !== undefined)
    .sort((a, b) => b.changed.localeCompare(a.changed) || b.hits - a.hits)
}

async function localeSurvey(
  root: string,
  target: LoreTarget,
  locale: 'fr' | 'en',
): Promise<string | undefined> {
  const suffix = locale === 'fr' ? '' : `.${locale}`
  const page = resolve(root, 'data/lore', LORE_DIR[target.kind], `${target.id}${suffix}.md`)
  if (!(await exists(page))) return undefined
  const corpus = await readCorpus(root, locale)
  const species = target.kind === 'species' ? corpus.speciesById.get(target.id) : undefined
  const parts = printedPage(await readFile(page, 'utf8'), corpus, species)
  return renderSurvey(`${relative(root, page)} (${locale})`, surveyPage(parts))
}

const USAGE = 'usage: pnpm lore:survey <id or name> [--out <file>]'

type Arguments = { query: string | undefined; out: string | undefined }

export function argumentsOf(args: string[]): Arguments | Error {
  const parsed = targetArgumentsOf(args, { out: { type: 'string' } })
  return parsed instanceof Error ? parsed : { query: parsed.query, out: parsed.values.out }
}

async function main(): Promise<void> {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const parsed = argumentsOf(process.argv.slice(2))
  if (parsed instanceof Error) {
    console.error(`lore:survey: ${parsed.message}\n${USAGE}`)
    process.exitCode = 1
    return
  }
  const { query, out } = parsed
  const candidates = await loreTargets(root)
  if (query === undefined) {
    console.error(USAGE)
    process.exitCode = 1
    return
  }
  const target = resolveTarget(query, candidates)
  if (target === undefined) {
    console.error(`lore:survey: no species or tree is called « ${query} ». Candidates:`)
    for (const candidate of candidates) {
      console.error(`  ${candidate.kind} ${candidate.id}: ${candidate.names.join(' / ')}`)
    }
    process.exitCode = 1
    return
  }
  const dir = resolve(root, 'data/lore', LORE_DIR[target.kind])
  const own = [
    resolve(dir, `${target.id}.md`),
    resolve(dir, `${target.id}.en.md`),
    resolve(root, 'data', LORE_DIR[target.kind], `${target.id}.json`),
    resolve(root, 'data', LORE_DIR[target.kind], `${target.id}.en.json`),
  ]
  const surveys = (
    await Promise.all([localeSurvey(root, target, 'fr'), localeSurvey(root, target, 'en')])
  ).filter((survey): survey is string => survey !== undefined)
  const near = await neighbours(root, target, own)
  const report = [
    `# Lore survey: ${target.kind} ${target.id} (${target.names.join(' / ')})`,
    '',
    ...(surveys.length === 0 ? ['No lore page yet.', ''] : surveys),
    '## Pages that name it',
    '',
    '| Last change | Hits | File |',
    '| --- | --- | --- |',
    ...near.map((entry) => `| ${entry.changed} | ${entry.hits} | ${entry.file} |`),
    '',
  ].join('\n')
  if (out === undefined) {
    console.log(report)
    return
  }
  await writeFile(resolve(process.cwd(), out), report)
  console.log(`lore:survey: wrote ${out}`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
