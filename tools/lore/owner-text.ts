import { access, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Corpus } from '../../src/lib/game/build.ts'
import { readCorpus } from '../../src/lib/game/fs-sources.ts'
import { type OwnerSource, provenance, renderProvenance } from './provenance.ts'
import { resolveTarget } from './survey.ts'
import { LORE_DIR, loreTargets, pagePrinter, printedPage, targetArgumentsOf } from './targets.ts'

const USAGE =
  'usage: pnpm lore:owner-text <id or name> --source <file> [--source <file> ...] [--out <file>]'

type Arguments = { query: string | undefined; sources: string[]; out: string | undefined }

export function argumentsOf(args: string[]): Arguments | Error {
  const parsed = targetArgumentsOf(args, {
    source: { type: 'string', multiple: true },
    out: { type: 'string' },
  })
  if (parsed instanceof Error) return parsed
  return { query: parsed.query, sources: parsed.values.source ?? [], out: parsed.values.out }
}

export function printedSources(sources: OwnerSource[], corpus: Corpus): OwnerSource[] {
  const printed = pagePrinter(corpus)
  return sources.map((source) => ({ ...source, text: printed(source.text) }))
}

async function main(): Promise<void> {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const parsed = argumentsOf(process.argv.slice(2))
  if (parsed instanceof Error) {
    console.error(`lore:owner-text: ${parsed.message}\n${USAGE}`)
    process.exitCode = 1
    return
  }
  const { query, sources, out } = parsed
  if (query === undefined || sources.length === 0) {
    console.error(USAGE)
    process.exitCode = 1
    return
  }
  const target = resolveTarget(query, await loreTargets(root))
  if (target === undefined) {
    console.error(`lore:owner-text: no species or tree is called « ${query} ». ${USAGE}`)
    process.exitCode = 1
    return
  }
  const page = resolve(root, 'data/lore', LORE_DIR[target.kind], `${target.id}.md`)
  const pageExists = await access(page).then(
    () => true,
    () => false,
  )
  if (!pageExists) {
    console.error(`lore:owner-text: ${target.kind} ${target.id} has no lore page yet.`)
    process.exitCode = 1
    return
  }
  const corpus = await readCorpus(root, 'fr')
  const species = target.kind === 'species' ? corpus.speciesById.get(target.id) : undefined
  const parts = printedPage(await readFile(page, 'utf8'), corpus, species)
  const owned = printedSources(
    await Promise.all(
      sources.map(async (file) => ({
        label: basename(file),
        text: await readFile(resolve(process.cwd(), file), 'utf8'),
      })),
    ),
    corpus,
  )
  const report = renderProvenance(
    `${target.kind} ${target.id}`,
    owned.map((source) => source.label),
    provenance(parts, owned),
  )
  if (out === undefined) {
    console.log(report)
    return
  }
  await writeFile(resolve(process.cwd(), out), report)
  console.log(`lore:owner-text: wrote ${out}`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
