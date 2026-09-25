import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'

const SCRIPT_ELEMENT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
const SOURCE_ATTRIBUTE = /\bsrc\s*=/i
const TYPE_ATTRIBUTE = /\btype\s*=\s*["']?([^"'\s>]*)/i
const EXECUTABLE_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript'])
const POLICY_HEADER = /^(\s*Content-Security-Policy:\s*)(.*)$/i
const SCRIPT_DIRECTIVE = 'script-src'

export function inlineScripts(html: string): string[] {
  const bodies: string[] = []
  for (const [, attributes = '', body = ''] of html.matchAll(SCRIPT_ELEMENT)) {
    if (SOURCE_ATTRIBUTE.test(attributes)) continue
    const type = TYPE_ATTRIBUTE.exec(attributes)?.[1]?.toLowerCase() ?? ''
    if (EXECUTABLE_TYPES.has(type)) bodies.push(body)
  }
  return bodies
}

function hashSource(body: string): string {
  return `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`
}

function allowScripts(directive: string, sources: readonly string[]): string {
  const tokens = directive.split(/\s+/)
  const missing = sources.filter((source) => !tokens.includes(source))
  return [...tokens, ...missing].join(' ')
}

function allowScriptsInPolicy(policy: string, sources: readonly string[]): string {
  const directives = policy
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean)
  const index = directives.findIndex((directive) => directive.split(/\s+/)[0] === SCRIPT_DIRECTIVE)
  const directive = directives[index]
  if (directive === undefined) {
    throw new Error(`The Content-Security-Policy in _headers has no ${SCRIPT_DIRECTIVE} directive`)
  }
  directives[index] = allowScripts(directive, sources)
  return directives.join('; ')
}

export function withScriptHashes(headers: string, bodies: readonly string[]): string {
  const sources = [...new Set(bodies.map(hashSource))].sort()
  let policies = 0
  const lines = headers.split('\n').map((line) => {
    const match = POLICY_HEADER.exec(line)
    if (!match) return line
    policies += 1
    const [, name = '', policy = ''] = match
    return `${name}${allowScriptsInPolicy(policy, sources)}`
  })
  if (policies === 0) throw new Error('_headers declares no Content-Security-Policy')
  return lines.join('\n')
}

async function pagesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name))
}

export function inlineScriptPolicy(): AstroIntegration {
  return {
    name: 'aubaine:inline-script-policy',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir)
        const pages = await pagesUnder(root)
        const bodies = await Promise.all(
          pages.map(async (page) => inlineScripts(await readFile(page, 'utf8'))),
        )
        const headersFile = join(root, '_headers')
        const headers = await readFile(headersFile, 'utf8')
        await writeFile(headersFile, withScriptHashes(headers, bodies.flat()))
      },
    },
  }
}
