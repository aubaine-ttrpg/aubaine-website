import { readdir, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const distDir = resolve(root, 'dist')

const MIB = 1024 * 1024

const WORKERS_ASSET_LIMIT_BYTES = 25 * MIB

async function main(): Promise<void> {
  const oversized: string[] = []
  for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const path = join(entry.parentPath, entry.name)
    const { size } = await stat(path)
    if (size > WORKERS_ASSET_LIMIT_BYTES) {
      oversized.push(`${relative(root, path)} is ${(size / MIB).toFixed(1)} MiB`)
    }
  }

  if (oversized.length === 0) {
    console.log(
      `asset-limit: every file in dist/ fits the ${WORKERS_ASSET_LIMIT_BYTES / MIB} MiB Workers limit`,
    )
    return
  }

  for (const line of oversized) console.log(`asset-limit: ${line}`)
  console.log(
    `\n${oversized.length} file(s) exceed the ${WORKERS_ASSET_LIMIT_BYTES / MIB} MiB Workers asset limit, and wrangler deploy will refuse them.`,
  )
  process.exitCode = 1
}

await main()
