import { describe, expect, it } from 'vitest'

import { inlineScripts, withScriptHashes } from '../../src/lib/security/script-policy'

const READY = 'document.documentElement.dataset.ready = ""'
const READY_HASH = "'sha256-sF/YjlIwved9nRUukStcG19X45dg/jbwDN5pbAWWYO0='"
const EMPTY_HASH = "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='"

const HEADERS = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  "  Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'",
  '',
  '/_astro/*',
  '  Cache-Control: public, max-age=31536000, immutable',
].join('\n')

describe('inlineScripts', () => {
  it('collects the body of every inline script the browser would run', () => {
    const html = `<script>${READY}</script><script type="module">a()</script><script type="text/javascript">b()</script>`
    expect(inlineScripts(html)).toEqual([READY, 'a()', 'b()'])
  })

  it('leaves out scripts loaded from a file and data blocks', () => {
    const html = [
      '<script type="module" src="/_astro/page.js"></script>',
      '<script type="application/ld+json">{"@type":"WebSite"}</script>',
    ].join('')
    expect(inlineScripts(html)).toEqual([])
  })
})

describe('withScriptHashes', () => {
  it('allows a script by the SHA-256 of its exact body', () => {
    expect(withScriptHashes(HEADERS, [READY])).toContain(`script-src 'self' ${READY_HASH}`)
  })

  it('touches no directive other than script-src', () => {
    const result = withScriptHashes(HEADERS, [READY])
    expect(result).toContain("default-src 'self'; style-src 'self' 'unsafe-inline'; script-src")
    expect(result.split('\n').filter((line) => line.includes('sha256-'))).toHaveLength(1)
    expect(result).toContain('Cache-Control: public, max-age=31536000, immutable')
  })

  it('lists each script once, in a stable order', () => {
    const once = withScriptHashes(HEADERS, [READY, '', READY])
    expect(once).toContain(`script-src 'self' ${EMPTY_HASH} ${READY_HASH}`)
    expect(withScriptHashes(HEADERS, ['', READY])).toBe(once)
    expect(withScriptHashes(once, [READY])).toBe(once)
  })

  it('leaves the headers as written when the build emits no inline script', () => {
    expect(withScriptHashes(HEADERS, [])).toBe(HEADERS)
  })

  it('refuses a policy that does not restrict scripts', () => {
    const loose = HEADERS.replace("; script-src 'self'", '')
    expect(() => withScriptHashes(loose, [READY])).toThrow(/script-src/)
  })

  it('refuses headers that carry no policy at all', () => {
    expect(() => withScriptHashes('/*\n  X-Content-Type-Options: nosniff', [READY])).toThrow(
      /Content-Security-Policy/,
    )
  })
})
