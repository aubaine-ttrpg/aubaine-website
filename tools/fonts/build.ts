import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { FONT_FAMILIES, fontTokenRule } from '../../src/lib/rights/attribution.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = resolve(root, 'data/media/fonts')
const cssOut = resolve(root, 'src/styles/fonts.css')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const KEEP_SUBSETS = new Set(['latin', 'latin-ext'])

type Face = {
  family: string
  style: string
  weight: string
  subset: string
  url: string
  unicodeRange: string
}

function parseFaces(css: string): Face[] {
  const faces: Face[] = []
  let subset = 'latin'
  for (const chunk of css.split('/*')) {
    const label = chunk.match(/^\s*([a-z0-9-]+)\s*\*\//)
    if (label?.[1]) subset = label[1]
    for (const block of chunk.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
      const body = block[1] ?? ''
      const family = body.match(/font-family:\s*'([^']+)'/)?.[1]
      const style = body.match(/font-style:\s*([^;]+);/)?.[1]?.trim()
      const weight = body.match(/font-weight:\s*([^;]+);/)?.[1]?.trim()
      const url = body.match(/url\(([^)]+)\)\s*format\('woff2'\)/)?.[1]
      const unicodeRange = body.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim()
      if (family && style && weight && url && unicodeRange) {
        faces.push({ family, style, weight, subset, url, unicodeRange })
      }
    }
  }
  return faces
}

function fileNameFor(slug: string, face: Face): string {
  return `${slug}-${face.weight}-${face.style}-${face.subset}.woff2`
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true })
  const rules: string[] = []

  for (const family of FONT_FAMILIES) {
    const response = await fetch(
      `https://fonts.googleapis.com/css2?family=${family.query}&display=swap`,
      {
        headers: { 'User-Agent': UA },
      },
    )
    if (!response.ok) throw new Error(`${family.slug}: ${response.status}`)
    const faces = parseFaces(await response.text()).filter((face) => KEEP_SUBSETS.has(face.subset))
    if (faces.length === 0) throw new Error(`${family.slug}: no latin faces found`)

    for (const face of faces) {
      const file = fileNameFor(family.slug, face)
      const binary = await fetch(face.url, { headers: { 'User-Agent': UA } })
      if (!binary.ok) throw new Error(`${file}: ${binary.status}`)
      await writeFile(resolve(outDir, file), Buffer.from(await binary.arrayBuffer()))
      rules.push(
        [
          '@font-face {',
          `  font-family: '${face.family}';`,
          `  font-style: ${face.style};`,
          `  font-weight: ${face.weight};`,
          '  font-display: swap;',
          `  src: url('/fonts/${file}') format('woff2');`,
          `  unicode-range: ${face.unicodeRange};`,
          '}',
        ].join('\n'),
      )
    }
    console.log(`${family.slug}: ${faces.length} faces`)
  }

  const tokens = [
    ':root {',
    ...FONT_FAMILIES.map(fontTokenRule),
    '  --ease: cubic-bezier(0.16, 1, 0.3, 1);',
    '}',
  ].join('\n')

  await writeFile(cssOut, `${[tokens, ...rules].join('\n\n')}\n`, 'utf8')
  console.log(`wrote ${rules.length} font-face rules to src/styles/fonts.css`)
}

await main()
