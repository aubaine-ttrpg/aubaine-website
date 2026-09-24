import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseFrontmatter } from '@astrojs/markdown-remark'
import { describe, expect, it } from 'vitest'

import config from '../../astro.config.mjs'

const root = resolve(import.meta.dirname, '../..')

const processor = config.markdown?.processor
if (!processor) throw new Error('astro.config.mjs declares no markdown processor')
const renderer = await processor.createRenderer({})

async function markdownIn(directory: string): Promise<string[]> {
  const entries = await readdir(resolve(root, directory), {
    recursive: true,
    withFileTypes: true,
  })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort()
}

const chapters = await markdownIn('data/books')
const guides = await markdownIn('data/equipment')
const lore = await markdownIn('data/lore')
const policies = await markdownIn('src/content/policies')

async function renderFile(path: string) {
  const { content, frontmatter } = parseFrontmatter(await readFile(path, 'utf8'))
  return renderer.render(content, { fileURL: pathToFileURL(path), frontmatter })
}

describe('authored prose renders', () => {
  for (const path of [...chapters, ...guides, ...lore, ...policies]) {
    it(`${relative(root, path)} produces a body`, async () => {
      const { code } = await renderFile(path)
      expect(code.trim()).not.toBe('')
    })
  }

  for (const path of [...chapters, ...lore]) {
    it(`${relative(root, path)} produces an outline`, async () => {
      const { metadata } = await renderFile(path)
      const sections = metadata.headings.filter((heading) => heading.depth === 2)
      expect(sections.length).toBeGreaterThan(1)
    })
  }
})
