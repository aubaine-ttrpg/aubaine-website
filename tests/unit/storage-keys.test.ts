import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')
const SOURCE_FILE = /\.(ts|tsx|astro)$/
const STORAGE_CALL = /localStorage\.(?:getItem|setItem|removeItem)\(\s*'([^']+)'/g
const KEY_CONSTANT = /const [A-Z_]+_KEY = '([^']+)'/g
const PRIVACY_PAGES = ['confidentialite.md', 'confidentialite.en.md']

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return SOURCE_FILE.test(entry.name) ? [path] : []
  })
}

function storageKeys(): Set<string> {
  const keys = new Set<string>()
  for (const file of sourceFiles(join(root, 'src'))) {
    const text = readFileSync(file, 'utf8')
    for (const pattern of [STORAGE_CALL, KEY_CONSTANT]) {
      for (const [, key] of text.matchAll(pattern)) if (key) keys.add(key)
    }
  }
  return keys
}

describe('the keys the site keeps in the browser', () => {
  const keys = storageKeys()

  it('are found in the sources', () => {
    expect([...keys].sort()).toContain('aubaine.theme')
  })

  it.each(PRIVACY_PAGES)('are each named on %s', (page) => {
    const text = readFileSync(join(root, 'src/content/policies', page), 'utf8')
    expect([...keys].filter((key) => !text.includes(`\`${key}\``))).toEqual([])
  })
})
