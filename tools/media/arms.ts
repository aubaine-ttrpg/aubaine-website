import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import sharp from 'sharp'
import { ARMS, ARMS_MAP_SIZE, armsFiles } from '../../src/lib/art-effect/presets.ts'
import {
  armsSurface,
  curvatureOf,
  normalsOf,
  occlusionOf,
  shadowOf,
} from '../../src/lib/art-effect/relief.ts'
import { linearToSrgb, srgbToLinear } from '../../src/lib/atlas/kernel/colour.ts'
import { ARMS_COMPOSITIONS, ARMS_WORKS } from '../../src/lib/rights/attribution.ts'
import type { BakeSize } from './browser-bake.ts'
import {
  bakeStill,
  bytes,
  finishMapOf,
  planeOf,
  reduced,
  reliefMapOf,
  writeReliefMaps,
  writeStill,
} from './relief-bake.ts'
import { ARMS_DIR, armsStillScene } from './relief-scenes.ts'

const LAYERS = {
  shield: '.field{fill:#fff} .division,.charges,.outline{display:none}',
  sable: '.field{fill:#000} .division rect{fill:#fff} .charges,.outline{display:none}',
  charges:
    '.field,.division,.outline{display:none} .charge,.charge *{fill:#fff !important;stroke:none !important}',
  lines:
    '.field,.division,.outline{display:none} .charge,.charge *{fill:none !important;stroke:#fff !important} .charge [fill="#000"],.charge .pseudostroke{fill:#fff !important}',
  enamel: '.charges,.outline{display:none}',
} as const

type Layer = keyof typeof LAYERS

function cropped(svg: string, size: BakeSize, style: string, clipped: boolean): string {
  const { x, y, width, height } = ARMS.crop
  const opened = svg.replace(
    /<svg([^>]*?)viewBox="[^"]*"/,
    `<svg$1viewBox="${x} ${y} ${width} ${height}" width="${size.width}" height="${size.height}"`,
  )
  const unclipped = clipped ? opened : opened.replace('<g clip-path="url(#shield)">', '<g>')
  return unclipped.replace('</svg>', `<style>${style}</style></svg>`)
}

async function rasterOf(svg: string, size: BakeSize, layer: Layer): Promise<Buffer> {
  const source = cropped(svg, size, LAYERS[layer], layer !== 'enamel')
  const { data, info } = await sharp(Buffer.from(source))
    .flatten({ background: '#000' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.width !== size.width || info.height !== size.height) {
    throw new Error(`the ${layer} layer rendered at ${info.width}x${info.height}`)
  }
  return data
}

function pooledTincture(channel: number, pooled: number): number {
  const { open, walls } = ARMS.enamelDepth
  const depth = open + (walls - open) * pooled
  return bytes(linearToSrgb(Math.max(srgbToLinear(channel / 255), 1e-4) ** depth))
}

async function bakeComposition(file: string): Promise<void> {
  const svg = await readFile(resolve(ARMS_DIR, file), 'utf8')
  const files = armsFiles(file)
  const by = ARMS.supersample
  const out = ARMS_MAP_SIZE
  const fine = { width: out.width * by, height: out.height * by }
  const pixelsPerUnit = fine.width / ARMS.crop.width

  const [shield, sable, charges, lines] = await Promise.all(
    (['shield', 'sable', 'charges', 'lines'] as const).map(async (layer) =>
      planeOf(await rasterOf(svg, fine, layer), fine),
    ),
  )
  if (!shield || !sable || !charges || !lines) throw new Error('a layer of the arms is missing')
  const surface = armsSurface(
    { shield, sable, charges, lines },
    ARMS.relief,
    pixelsPerUnit,
    (100 - ARMS.crop.x) * pixelsPerUnit,
    75 * pixelsPerUnit,
  )
  const toMap = (values: Float32Array): Float32Array => reduced(values, fine, 1, by)
  const normals = reduced(
    normalsOf(surface.height, fine.width, fine.height, pixelsPerUnit),
    fine,
    3,
    by,
  )
  const convexity = toMap(
    curvatureOf(surface.height, fine.width, fine.height, ARMS.relief, pixelsPerUnit),
  )
  const coverage = toMap(shield.values)
  const metal = toMap(surface.metal)
  const occlusion = toMap(
    occlusionOf(surface.height, fine.width, fine.height, ARMS.relief, pixelsPerUnit),
  )
  const shadow = toMap(
    shadowOf(surface.height, fine.width, fine.height, ARMS.key, ARMS.relief, pixelsPerUnit),
  )
  const pooled = toMap(surface.pooled)

  const count = out.width * out.height
  const enamel = await sharp(Buffer.from(cropped(svg, out, LAYERS.enamel, false)))
    .removeAlpha()
    .raw()
    .toBuffer()
  const colourMap = new Uint8Array(count * 4)
  for (let at = 0; at < count; at++) {
    const pooling = pooled[at] ?? 0
    colourMap.set(
      [0, 1, 2].map((channel) => pooledTincture(enamel[at * 3 + channel] ?? 0, pooling)),
      at * 4,
    )
    colourMap[at * 4 + 3] = bytes(coverage[at] ?? 0)
  }
  await writeReliefMaps(
    {
      colour: colourMap,
      relief: reliefMapOf(normals, convexity),
      finish: finishMapOf(metal, occlusion, shadow),
    },
    out,
    ARMS_DIR,
    files,
  )

  const still = await bakeStill(await armsStillScene(file), ARMS_DIR)
  await writeStill(still, resolve(ARMS_DIR, files.still))
}

async function main(): Promise<void> {
  const credited = new Set<string>(ARMS_WORKS.map((work) => work.key))
  for (const composition of ARMS_COMPOSITIONS) {
    for (const key of composition.works) {
      if (!credited.has(key))
        throw new Error(`${composition.file} names ${key}, which no work credits`)
    }
    await bakeComposition(composition.file)
  }
  console.log(`arms: baked ${ARMS_COMPOSITIONS.length} composition(s) into data/media/arms/`)
}

await main()
