import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { CLIENT_DIRECTIVES } from '../../src/scripts/island-directives'

const SOURCE = 'src'
const TEMPLATES = /\.(astro|mdx)$/
const DIRECTIVE = /\bclient:([a-z]+)/g

function templates(directory: string): string[] {
  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((path) => TEMPLATES.test(path))
    .map((path) => join(directory, path))
}

describe('islands reached through a swup visit', () => {
  it('only use client directives the shell registers on every page', () => {
    const used = new Set<string>()
    for (const file of templates(SOURCE)) {
      for (const [, name] of readFileSync(file, 'utf8').matchAll(DIRECTIVE)) {
        if (name) used.add(name)
      }
    }
    expect(used.size).toBeGreaterThan(0)
    for (const name of used) expect(Object.keys(CLIENT_DIRECTIVES)).toContain(name)
  })
})
