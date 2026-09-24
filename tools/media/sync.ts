import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const PASSTHROUGH = ['icons', 'flags', 'pdf', 'video', 'fonts'] as const

const EMPTY_UNTIL_A_GENERATION_IS_SUPERSEDED = ['pdf-archive'] as const

async function main(): Promise<void> {
  for (const dir of [...PASSTHROUGH, ...EMPTY_UNTIL_A_GENERATION_IS_SUPERSEDED]) {
    const from = resolve(root, 'data/media', dir)
    const to = resolve(root, 'public', dir)
    await rm(to, { recursive: true, force: true })
    await mkdir(dirname(to), { recursive: true })
    if (EMPTY_UNTIL_A_GENERATION_IS_SUPERSEDED.some((name) => name === dir)) {
      await mkdir(from, { recursive: true })
    }
    await cp(from, to, { recursive: true })
  }
  await cp(resolve(root, 'data/media/aubaine-logo.svg'), resolve(root, 'public/aubaine-logo.svg'))
  console.log(
    `media: synced ${[...PASSTHROUGH, ...EMPTY_UNTIL_A_GENERATION_IS_SUPERSEDED].join(', ')} and the logo into public/`,
  )
}

await main()
