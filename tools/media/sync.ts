import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ALMANACH_ASSETS } from '../../src/lib/art-effect/almanach-look.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const PASSTHROUGH = ['icons', 'flags', 'pdf', 'video', 'fonts'] as const

const ALMANACH_SOURCES = [
  { from: 'almanach', to: ALMANACH_ASSETS },
  { from: 'almanach-materials', to: `${ALMANACH_ASSETS}/materials` },
] as const

async function main(): Promise<void> {
  for (const dir of PASSTHROUGH) {
    const from = resolve(root, 'data/media', dir)
    const to = resolve(root, 'public', dir)
    await rm(to, { recursive: true, force: true })
    await mkdir(dirname(to), { recursive: true })
    await cp(from, to, { recursive: true })
  }
  await rm(resolve(root, `public${ALMANACH_ASSETS}`), { recursive: true, force: true })
  for (const { from, to } of ALMANACH_SOURCES) {
    await cp(resolve(root, 'data/media', from), resolve(root, `public${to}`), { recursive: true })
  }
  await cp(resolve(root, 'data/media/aubaine-logo.svg'), resolve(root, 'public/aubaine-logo.svg'))
  console.log(`media: synced ${PASSTHROUGH.join(', ')}, the almanach and the logo into public/`)
}

await main()
