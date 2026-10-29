import { execFile } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { z } from 'astro/zod'

import { ARCHIVE_FILE, releaseTag } from '../../src/lib/booklet/release.ts'
import { aubaineVersion, type PdfNote, pdfNotes } from '../../src/lib/game/schema.ts'

const run = promisify(execFile)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const archiveDir = resolve(root, 'data/media/pdf-archive')
const notesPath = resolve(root, 'data/pdf/notes.json')
const codexPath = 'data/aubaine.json'

const githubReleases = z.array(z.object({ tagName: z.string() }))

export type PendingRelease = {
  tag: string
  version: string
  files: string[]
}

type ReadyRelease = PendingRelease & { target: string; note: PdfNote }

export function planPublish(archives: string[], published: ReadonlySet<string>): PendingRelease[] {
  const byVersion = new Map<string, string[]>()
  for (const file of [...archives].sort()) {
    const version = ARCHIVE_FILE.exec(file)?.[1]
    if (version === undefined) continue
    byVersion.set(version, [...(byVersion.get(version) ?? []), file])
  }
  return [...byVersion]
    .map(([version, files]) => ({ tag: releaseTag(version), version, files }))
    .filter((release) => !published.has(release.tag))
}

async function git(...args: string[]): Promise<string> {
  const { stdout } = await run('git', args, { cwd: root })
  return stdout.trim()
}

async function gh(...args: string[]): Promise<string> {
  const { stdout } = await run('gh', args, { cwd: root })
  return stdout.trim()
}

async function publishedTags(): Promise<Set<string>> {
  const listed = githubReleases.parse(
    JSON.parse(await gh('release', 'list', '--limit', '1000', '--json', 'tagName')),
  )
  return new Set(listed.map((release) => release.tagName))
}

async function lastCommitNaming(version: string): Promise<string> {
  const commits = (await git('log', '--reverse', '--format=%H', '--', codexPath)).split('\n')
  let previous: string | undefined
  let movedOn: string | undefined
  for (const commit of commits) {
    const named = aubaineVersion.parse(JSON.parse(await git('show', `${commit}:${codexPath}`)))
    if (previous === version && named.version !== version) movedOn = commit
    previous = named.version
  }
  if (movedOn === undefined) {
    throw new Error(`${codexPath} never moved past ${version}, so no commit closes that generation`)
  }
  return git('rev-parse', `${movedOn}^`)
}

async function prepare(release: PendingRelease, notes: PdfNote[]): Promise<ReadyRelease> {
  const note = notes.find((candidate) => candidate.version === release.version)
  if (note === undefined) throw new Error(`no note for ${release.version} in data/pdf/notes.json`)
  return { ...release, target: await lastCommitNaming(release.version), note }
}

function releaseNotes(note: PdfNote): string {
  return `**Français**\n\n${note.fr}\n\n**English**\n\n${note.en}\n`
}

async function main(): Promise<void> {
  const check = process.argv.slice(2).includes('--check')
  const notes = pdfNotes.parse(JSON.parse(await readFile(notesPath, 'utf8'))).notes
  const pending = planPublish(await readdir(archiveDir), await publishedTags())

  if (pending.length === 0) {
    console.log('pdf-publish: nothing to do, every archive has its release')
    return
  }

  const ready: ReadyRelease[] = []
  for (const release of pending) {
    const prepared = await prepare(release, notes)
    ready.push(prepared)
    console.log(
      `pdf-publish: ${prepared.tag} at ${prepared.target.slice(0, 7)} carries ${prepared.files.join(', ')}`,
    )
  }

  if (check) {
    console.log(`\n${ready.length} release(s) not yet published. Run: pnpm pdf:publish`)
    process.exitCode = 1
    return
  }

  for (const release of ready) {
    await gh(
      'release',
      'create',
      release.tag,
      '--target',
      release.target,
      '--latest=false',
      '--title',
      `Aubaine ${release.tag}`,
      '--notes',
      releaseNotes(release.note),
      ...release.files.map((file) => join(archiveDir, file)),
    )
    console.log(`pdf-publish: published ${release.tag}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
