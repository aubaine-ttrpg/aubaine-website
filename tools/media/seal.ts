import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import {
  curvatureOf,
  normalsOf,
  occlusionOf,
  type Plane,
  sealOutline,
  sealSurface,
  shadowOf,
} from '../../src/lib/art-effect/relief.ts'
import {
  SEAL,
  SEAL_MAP_SIZE,
  SEAL_UNIFORMS,
  type SealFiles,
  sealFiles,
  waxShades,
  waxUniforms,
} from '../../src/lib/art-effect/seal-look.ts'
import { linearToSrgb } from '../../src/lib/atlas/kernel/colour.ts'
import { readCorpus } from '../../src/lib/game/fs-sources.ts'
import type { BakeSize } from './browser-bake.ts'
import {
  bakeStill,
  bytes,
  finishMapOf,
  planeOf,
  reduced,
  reliefFragment,
  reliefMapOf,
  writeReliefMaps,
  writeStill,
} from './relief-bake.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const sealsDir = resolve(root, 'data/media/seals')
const emblemsDir = resolve(root, 'data/media/emblems')

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

async function bakeSeal(file: string, files: SealFiles, wax: string): Promise<void> {
  const by = SEAL.supersample
  const out = SEAL_MAP_SIZE
  const fine = { width: out.width * by, height: out.height * by }
  const pixelsPerUnit = fine.width / SEAL.relief.span

  const puddle = sealOutline(fine, SEAL.relief)
  const emblem = await emblemPlane(file, fine)
  holdsWithinField(emblem, file)
  const surface = sealSurface(puddle, emblem, SEAL.relief)
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
    sealsDir,
    files,
  )

  const fragment = await reliefFragment('relief.glsl', 'seal.frag')
  for (const still of files.stills) {
    const shot = await bakeStill(
      {
        size: { width: still.width, height: still.width },
        maps: [
          { uniform: 'uColour', file: files.colour, colour: true },
          { uniform: 'uRelief', file: files.relief, colour: false },
          { uniform: 'uFinish', file: files.finish, colour: false },
        ],
        fragment,
        roomYaw: SEAL.roomYaw,
        lean: SEAL.lean,
        eye: SEAL.rest,
        uniforms: { ...SEAL_UNIFORMS, ...waxUniforms(shades) },
      },
      sealsDir,
    )
    await writeStill(shot, resolve(sealsDir, still.file))
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
  await mkdir(sealsDir, { recursive: true })
  for (const [emblem, wax] of waxes) await bakeSeal(emblem, sealFiles(emblem), wax)
  console.log(`seal: baked ${waxes.size} seal(s) into data/media/seals/`)
}

await main()
