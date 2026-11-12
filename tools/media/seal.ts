import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import {
  curvatureOf,
  flowedSurface,
  normalsOf,
  occlusionOf,
  type Plane,
  pittedSurface,
  type SurfaceScan,
  sealOutline,
  sealSurface,
  shadowOf,
  skinnedSurface,
} from '../../src/lib/art-effect/relief.ts'
import {
  SEAL,
  SEAL_MAP_SIZE,
  SEAL_MILLIMETRES_PER_UNIT,
  type SealFiles,
  sealFiles,
  waxShades,
} from '../../src/lib/art-effect/seal-look.ts'
import { linearToSrgb } from '../../src/lib/atlas/kernel/colour.ts'
import { readCorpus } from '../../src/lib/game/fs-sources.ts'
import { TEXTURE_WORKS, type TextureCut } from '../../src/lib/rights/attribution.ts'
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
import { SEALS_DIR, sealStillScene } from './relief-scenes.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const emblemsDir = resolve(root, 'data/media/emblems')
const originals = resolve(root, 'tmp/textures')

const SCAN_CROP_MILLIMETRES = 46

type SurfaceCut = Extract<TextureCut, { kind: 'seal-surface' }>

const VIEW_BOX = /viewBox="([^"]+)"/

function pressedInto(svg: string, size: BakeSize): string {
  const found = VIEW_BOX.exec(svg)?.[1]?.split(/\s+/).map(Number)
  const [left, top, side] = found ?? []
  if (left === undefined || top === undefined || side === undefined) {
    throw new Error('an emblem has no square viewBox: run pnpm media:emblems')
  }
  const { span, centre, emblem } = SEAL.relief
  const perUnit = side / emblem.span
  const view = [
    left + side / 2 - centre.x * perUnit,
    top + side / 2 - centre.y * perUnit,
    span * perUnit,
    span * perUnit,
  ].join(' ')
  return svg.replace(
    VIEW_BOX,
    `viewBox="${view}" width="${size.width}" height="${size.height}" preserveAspectRatio="none"`,
  )
}

async function emblemPlane(file: string, size: BakeSize): Promise<Plane> {
  const svg = await readFile(resolve(emblemsDir, file), 'utf8')
  const { data, info } = await sharp(Buffer.from(pressedInto(svg, size)))
    .flatten({ background: '#000' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.width !== size.width || info.height !== size.height) {
    throw new Error(`${file} rendered at ${info.width}x${info.height}`)
  }
  return planeOf(data, size)
}

function holdsWithinField(emblem: Plane, file: string): void {
  const { span, centre, stamp, emblem: pressed } = SEAL.relief
  const unitsPerPixel = span / emblem.width
  const reach = stamp.radius - stamp.wall - pressed.clearance
  for (let at = 0; at < emblem.values.length; at++) {
    if ((emblem.values[at] ?? 0) < 0.5) continue
    const x = ((at % emblem.width) + 0.5) * unitsPerPixel - centre.x
    const y = (Math.floor(at / emblem.width) + 0.5) * unitsPerPixel - centre.y
    if (Math.hypot(x, y) > reach) {
      throw new Error(`${file} reaches past the pressed field of its seal`)
    }
  }
}

function surfaceCut(): SurfaceCut {
  const cut = TEXTURE_WORKS.flatMap((work): readonly TextureCut[] => work.cuts).find(
    (each): each is SurfaceCut => each.kind === 'seal-surface',
  )
  if (!cut)
    throw new Error('the seals are baked with a surface scan, which no texture work provides')
  return cut
}

function originalOf(file: string): string {
  const path = resolve(originals, file)
  if (!existsSync(path)) {
    throw new Error(`${file} is missing from tmp/textures; download it from its source first`)
  }
  return path
}

async function widthOf(file: string): Promise<number> {
  const { width } = await sharp(originalOf(file), { limitInputPixels: false }).metadata()
  if (!width) throw new Error(`${file} has no size`)
  return width
}

async function scanPlane(file: string, side: number, heightWidth: number): Promise<Float32Array> {
  const width = await widthOf(file)
  const span = Math.round((side * width) / heightWidth)
  const from = Math.floor((width - span) / 2)
  const { data } = await sharp(originalOf(file), { limitInputPixels: false })
    .extract({ left: from, top: from, width: span, height: span })
    .extractChannel(0)
    .resize(side, side, { kernel: 'lanczos3' })
    .raw({ depth: 'ushort' })
    .toBuffer({ resolveWithObject: true })
  return Float32Array.from(new Uint16Array(data.buffer, data.byteOffset, data.length / 2))
}

async function surfaceScan(cut: SurfaceCut): Promise<SurfaceScan> {
  const heightWidth = await widthOf(cut.height)
  const perMillimetre = heightWidth / cut.millimetres
  const side = Math.ceil(SCAN_CROP_MILLIMETRES * perMillimetre)
  if (side / perMillimetre < SEAL.relief.span * SEAL_MILLIMETRES_PER_UNIT) {
    throw new Error('the surface scan is cropped narrower than the seal')
  }
  return {
    width: side,
    height: side,
    heights: await scanPlane(cut.height, side, heightWidth),
    roughness: await scanPlane(cut.roughness, side, heightWidth),
    millimetres: side / perMillimetre,
  }
}

async function bakeSeal(file: string, files: SealFiles, wax: string): Promise<void> {
  const by = SEAL.supersample
  const out = SEAL_MAP_SIZE
  const fine = { width: out.width * by, height: out.height * by }
  const pixelsPerUnit = fine.width / SEAL.relief.span

  const puddle = sealOutline(fine, SEAL.relief)
  const emblem = await emblemPlane(file, fine)
  holdsWithinField(emblem, file)
  const sculpted = sealSurface(puddle, emblem, SEAL.relief)
  const scan = await surfaceScan(surfaceCut())
  const millimetresPerPixel = SEAL_MILLIMETRES_PER_UNIT / pixelsPerUnit
  const skinned = skinnedSurface(sculpted, puddle, scan, SEAL.surface.skin, millimetresPerPixel)
  const pitted = pittedSurface(skinned, puddle, SEAL.relief, SEAL.surface.pits)
  const surface = flowedSurface(pitted, puddle, SEAL.relief, SEAL.surface.flow)
  const toMap = (values: Float32Array): Float32Array => reduced(values, fine, 1, by)
  const normals = reduced(
    normalsOf(surface.height, fine.width, fine.height, pixelsPerUnit),
    fine,
    3,
    by,
  )
  const convexity = toMap(
    curvatureOf(surface.height, fine.width, fine.height, SEAL.relief, pixelsPerUnit),
  )
  const coverage = toMap(puddle.values)
  const roughness = toMap(surface.roughness)
  const occlusion = toMap(
    occlusionOf(surface.height, fine.width, fine.height, SEAL.relief, pixelsPerUnit),
  )
  const shadow = toMap(
    shadowOf(surface.height, fine.width, fine.height, SEAL.key, SEAL.relief, pixelsPerUnit),
  )

  const shades = waxShades(wax)
  const albedo = shades.albedo.map((channel) => bytes(linearToSrgb(channel)))
  const colourMap = new Uint8Array(out.width * out.height * 4)
  for (let at = 0; at < out.width * out.height; at++) {
    colourMap.set([...albedo, bytes(coverage[at] ?? 0)], at * 4)
  }
  await writeReliefMaps(
    {
      colour: colourMap,
      relief: reliefMapOf(normals, convexity),
      finish: finishMapOf(roughness, occlusion, shadow),
    },
    out,
    SEALS_DIR,
    files,
  )

  for (const still of files.stills) {
    const shot = await bakeStill(await sealStillScene(file, wax, still.width), SEALS_DIR)
    await writeStill(shot, resolve(SEALS_DIR, still.file))
  }
}

async function main(): Promise<void> {
  const corpus = await readCorpus(root, 'fr')
  const waxes = new Map<string, string>()
  for (const species of corpus.species) {
    for (const sub of species.subspecies) {
      if (sub.heraldry?.kind !== 'seal') continue
      const { emblem, wax } = sub.heraldry
      const pressed = waxes.get(emblem)
      if (pressed !== undefined && pressed !== wax) {
        throw new Error(`${emblem} is pressed into two waxes, ${pressed} and ${wax}`)
      }
      waxes.set(emblem, wax)
    }
  }
  await mkdir(SEALS_DIR, { recursive: true })
  for (const [emblem, wax] of waxes) await bakeSeal(emblem, sealFiles(emblem), wax)
  console.log(`seal: baked ${waxes.size} seal(s) into data/media/seals/`)
}

await main()
