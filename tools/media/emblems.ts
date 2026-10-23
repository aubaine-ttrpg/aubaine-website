import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { frameEmblem } from '../../src/lib/emblem-frame.ts'
import { stripSvg } from '../../src/lib/rights/svg.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const directory = resolve(root, 'data/media/emblems')
const checking = process.argv.includes('--check')

async function main(): Promise<void> {
  const files = (await readdir(directory)).filter((file) => file.endsWith('.svg')).sort()
  const unframed: string[] = []
  for (const file of files) {
    const path = resolve(directory, file)
    const bare = stripSvg(await readFile(path, 'utf8'))
    const framed = frameEmblem(bare)
    if (framed === bare) continue
    unframed.push(file)
    if (!checking) await writeFile(path, framed)
  }
  if (checking && unframed.length > 0) {
    console.error(`emblems: not framed: ${unframed.join(', ')}. Run: pnpm media:emblems`)
    process.exitCode = 1
    return
  }
  const verb = checking ? 'checked' : 'framed'
  console.log(`emblems: ${verb} ${files.length}, rewrote ${checking ? 0 : unframed.length}`)
  if (!checking && unframed.length > 0) console.log('emblems: now run pnpm media:stamp')
}

await main()
