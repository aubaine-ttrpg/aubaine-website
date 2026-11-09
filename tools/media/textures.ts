import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import {
  BANNER_CLOTH,
  BANNER_HANGER,
  ENVIRONMENT,
  type EnvironmentLevel,
  FRAMES,
  type FrameKind,
  GLAZE_ROOM_YAW,
  ROOM_ROTATION,
} from '../../src/lib/art-effect/presets.ts'
import { type Retouch, TEXTURE_WORKS, type TextureCut } from '../../src/lib/rights/attribution.ts'
import { BAKE_ORIGIN, type BakeSize, bakeInBrowser } from './browser-bake.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const originals = resolve(root, 'tmp/textures')
const outDir = resolve(root, 'data/media/textures')

const RELIEF_CLIP = 0.005
const RELIEF_QUALITY = 45
const FRAME_QUALITY = 88
const FRAME_MAPS_QUALITY = 60
const FRAME_SUPERSAMPLE = 2
const FRAME_BACKBOARD = 0.0006
const RETOUCH_FEATHER = 0.4

type Radiance = { width: number; height: number; rgb: Float32Array }

type FrameCut = Extract<TextureCut, { kind: 'frame' }>

type Wave = readonly [amplitude: number, period: number, phase: number]

type WoodMember = {
  side: 'left' | 'right' | 'bottom' | 'top'
  offset: readonly [number, number]
  turn: 1 | -1
  face: readonly Wave[]
  arris: readonly Wave[]
  chamfer: readonly Wave[]
}

const WOOD_MEMBERS: readonly WoodMember[] = [
  {
    side: 'left',
    offset: [0.13, 0.42],
    turn: 1,
    face: [
      [0.0005, 0.21, 0.4],
      [0.00025, 0.067, 1.9],
    ],
    arris: [
      [0.002, 0.17, 2.3],
      [0.0006, 0.05, 0.7],
    ],
    chamfer: [[0.001, 0.19, 1.1]],
  },
  {
    side: 'right',
    offset: [0.61, 0.08],
    turn: -1,
    face: [
      [0.0005, 0.23, 2.8],
      [0.00025, 0.071, 0.3],
    ],
    arris: [
      [0.002, 0.16, 0.9],
      [0.0006, 0.047, 2.6],
    ],
    chamfer: [[0.001, 0.2, 2.9]],
  },
  {
    side: 'bottom',
    offset: [0.37, 0.71],
    turn: 1,
    face: [
      [0.0005, 0.19, 1.6],
      [0.00025, 0.063, 2.2],
    ],
    arris: [
      [0.002, 0.18, 0.2],
      [0.0006, 0.052, 1.4],
    ],
    chamfer: [[0.001, 0.17, 0.5]],
  },
  {
    side: 'top',
    offset: [0.84, 0.27],
    turn: -1,
    face: [
      [0.0005, 0.22, 0.9],
      [0.00025, 0.069, 2.7],
    ],
    arris: [
      [0.002, 0.15, 1.7],
      [0.0006, 0.049, 0.1],
    ],
    chamfer: [[0.001, 0.18, 2.1]],
  },
]

const WOOD_MODEL = {
  moulding: 0.045,
  tile: 0.55,
  dense: 0.00025,
  coarse: 0.0015,
  jointReach: 0.003,
  roughness: 0.7,
  profile: {
    face: 0.016,
    sight: 0.008,
    lip: 0.003,
    chamfer: 0.015,
    arris: 0.008,
    dish: 0.0006,
    wear: 0.0008,
    joint: { depth: 0.0006, width: 0.0006 },
  },
  members: WOOD_MEMBERS,
} as const

function original(cut: TextureCut): string {
  const path = resolve(originals, cut.original)
  if (!existsSync(path)) {
    throw new Error(
      `${cut.original} is missing from tmp/textures; download it from its source first`,
    )
  }
  return path
}

function readRadiance(bytes: Uint8Array): Radiance {
  let at = 0
  const line = (): string => {
    const start = at
    while (at < bytes.length && bytes[at] !== 0x0a) at += 1
    at += 1
    return new TextDecoder().decode(bytes.subarray(start, at - 1))
  }
  if (!line().startsWith('#?')) throw new Error('not a Radiance picture')
  for (let header = line(); header !== ''; header = line()) {
    if (header.startsWith('FORMAT=') && header !== 'FORMAT=32-bit_rle_rgbe') {
      throw new Error(`unsupported Radiance format ${header}`)
    }
  }
  const size = /^-Y (\d+) \+X (\d+)$/.exec(line())
  if (!size?.[1] || !size[2]) throw new Error('unsupported Radiance orientation')
  const height = Number(size[1])
  const width = Number(size[2])
  const rgb = new Float32Array(width * height * 3)
  const scanline = new Uint8Array(width * 4)
  for (let y = 0; y < height; y++) {
    if (
      bytes[at] !== 2 ||
      bytes[at + 1] !== 2 ||
      ((bytes[at + 2] ?? 0) << 8) + (bytes[at + 3] ?? 0) !== width
    ) {
      throw new Error('only run length encoded Radiance scanlines are supported')
    }
    at += 4
    for (let channel = 0; channel < 4; channel++) {
      for (let x = 0; x < width; ) {
        let count = bytes[at++] ?? 0
        if (count > 128) {
          count -= 128
          const value = bytes[at++] ?? 0
          for (let n = 0; n < count; n++) scanline[x++ * 4 + channel] = value
        } else {
          for (let n = 0; n < count; n++) scanline[x++ * 4 + channel] = bytes[at++] ?? 0
        }
      }
    }
    for (let x = 0; x < width; x++) {
      const exponent = scanline[x * 4 + 3] ?? 0
      const scale = exponent === 0 ? 0 : 2 ** (exponent - 136)
      for (let channel = 0; channel < 3; channel++) {
        rgb[(y * width + x) * 3 + channel] = (scanline[x * 4 + channel] ?? 0) * scale
      }
    }
  }
  return { width, height, rgb }
}

function rowSolidAngle(height: number, y: number): number {
  return Math.cos(Math.PI * ((y + 0.5) / height - 0.5))
}

function shrink(source: Radiance, width: number, height: number): Radiance {
  const stepX = source.width / width
  const stepY = source.height / height
  const rgb = new Float32Array(width * height * 3)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sum = [0, 0, 0]
      let weight = 0
      for (let sy = Math.floor(y * stepY); sy < Math.floor((y + 1) * stepY); sy++) {
        const w = rowSolidAngle(source.height, sy)
        for (let sx = Math.floor(x * stepX); sx < Math.floor((x + 1) * stepX); sx++) {
          for (let c = 0; c < 3; c++)
            sum[c] = (sum[c] ?? 0) + (source.rgb[(sy * source.width + sx) * 3 + c] ?? 0) * w
          weight += w
        }
      }
      for (let c = 0; c < 3; c++) rgb[(y * width + x) * 3 + c] = (sum[c] ?? 0) / weight
    }
  }
  return { width, height, rgb }
}

function direction(width: number, height: number, x: number, y: number): [number, number, number] {
  const longitude = ((x + 0.5) / width) * 2 * Math.PI - Math.PI
  const latitude = Math.PI * (0.5 - (y + 0.5) / height)
  return [
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude),
    -Math.cos(latitude) * Math.cos(longitude),
  ]
}

function gather(source: Radiance, level: EnvironmentLevel, gloss: number): Radiance {
  const directions = Array.from({ length: source.width * source.height }, (_, index) =>
    direction(source.width, source.height, index % source.width, Math.floor(index / source.width)),
  )
  const rgb = new Float32Array(level.width * level.height * 3)
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const [nx, ny, nz] = direction(level.width, level.height, x, y)
      const sum = [0, 0, 0]
      let weight = 0
      for (let index = 0; index < directions.length; index++) {
        const [lx, ly, lz] = directions[index] ?? [0, 0, 0]
        const facing = nx * lx + ny * ly + nz * lz
        if (facing <= 0) continue
        const w = facing ** gloss * rowSolidAngle(source.height, Math.floor(index / source.width))
        for (let c = 0; c < 3; c++) sum[c] = (sum[c] ?? 0) + (source.rgb[index * 3 + c] ?? 0) * w
        weight += w
      }
      for (let c = 0; c < 3; c++) rgb[(y * level.width + x) * 3 + c] = (sum[c] ?? 0) / weight
    }
  }
  return { width: level.width, height: level.height, rgb }
}

function meanRadiance(source: Radiance): number {
  let sum = 0
  let weight = 0
  for (let y = 0; y < source.height; y++) {
    const w = rowSolidAngle(source.height, y)
    for (let x = 0; x < source.width; x++) {
      const at = (y * source.width + x) * 3
      sum +=
        w *
        (0.2126 * (source.rgb[at] ?? 0) +
          0.7152 * (source.rgb[at + 1] ?? 0) +
          0.0722 * (source.rgb[at + 2] ?? 0))
      weight += w
    }
  }
  return sum / weight
}

function packRgbm(
  levels: readonly Radiance[],
  scale: number,
): { pixels: Buffer; width: number; height: number } {
  const width = Math.max(...levels.map((level) => level.width))
  const height = levels.reduce((sum, level) => sum + level.height, 0)
  const pixels = Buffer.alloc(width * height * 4)
  let top = 0
  for (const level of levels) {
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const from = (y * level.width + x) * 3
        const root = [0, 1, 2].map((c) =>
          Math.sqrt(
            Math.min((level.rgb[from + c] ?? 0) * scale, ENVIRONMENT.range) / ENVIRONMENT.range,
          ),
        )
        const multiplier = Math.ceil(Math.max(...root, 1 / 255) * 255) / 255
        const to = ((top + y) * width + x) * 4
        for (let c = 0; c < 3; c++) pixels[to + c] = Math.round(((root[c] ?? 0) / multiplier) * 255)
        pixels[to + 3] = Math.round(multiplier * 255)
      }
    }
    top += level.height
  }
  return { pixels, width, height }
}

async function roomOf(cut: TextureCut): Promise<{ base: Radiance; scale: number }> {
  const source = readRadiance(new Uint8Array(await readFile(original(cut))))
  const [sharpest] = ENVIRONMENT.levels
  const base = shrink(source, sharpest.width * 2, sharpest.height * 2)
  return { base, scale: ENVIRONMENT.meanRadiance / meanRadiance(base) }
}

async function environment(cut: TextureCut): Promise<void> {
  const { base, scale } = await roomOf(cut)
  const levels = ENVIRONMENT.levels.map((level) =>
    level.gloss === undefined
      ? shrink(base, level.width, level.height)
      : gather(shrink(base, 128, 64), level, level.gloss),
  )
  const { pixels, width, height } = packRgbm(levels, scale)
  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .webp({ lossless: true, exact: true, effort: 6 })
    .toFile(resolve(outDir, cut.file))
}

async function relief(cut: Extract<TextureCut, { kind: 'relief' }>): Promise<void> {
  const input = sharp(original(cut)).toColourspace('grey16')
  const { width, height } = await input.metadata()
  if (!width || !height) throw new Error(`${cut.original} has no size`)
  const margin = Math.round(width / 8)
  const tiled = await sharp(original(cut))
    .extend({ top: margin, bottom: margin, left: margin, right: margin, extendWith: 'repeat' })
    .resize({
      width: Math.round((cut.size * (width + 2 * margin)) / width),
      height: Math.round((cut.size * (height + 2 * margin)) / height),
      fit: 'fill',
      kernel: 'lanczos3',
    })
    .raw({ depth: 'ushort' })
    .toBuffer({ resolveWithObject: true })
  const inset = Math.round((cut.size * margin) / width)
  const values = new Uint16Array(
    tiled.data.buffer,
    tiled.data.byteOffset,
    tiled.data.byteLength / 2,
  )
  const tile = new Float32Array(cut.size * cut.size)
  for (let y = 0; y < cut.size; y++) {
    for (let x = 0; x < cut.size; x++) {
      tile[y * cut.size + x] =
        values[
          (y + inset) * tiled.info.width * tiled.info.channels + (x + inset) * tiled.info.channels
        ] ?? 0
    }
  }
  const sorted = Float32Array.from(tile).sort()
  const low = sorted[Math.floor(sorted.length * RELIEF_CLIP)] ?? 0
  const high = sorted[Math.floor(sorted.length * (1 - RELIEF_CLIP))] ?? 1
  const grey = Buffer.alloc(tile.length)
  for (let at = 0; at < tile.length; at++) {
    grey[at] = Math.round(Math.min(Math.max(((tile[at] ?? 0) - low) / (high - low), 0), 1) * 255)
  }
  await sharp(grey, { raw: { width: cut.size, height: cut.size, channels: 1 } })
    .avif({ quality: RELIEF_QUALITY, effort: 6 })
    .toFile(resolve(outDir, cut.file))
}

type RoomTurn = { mirrored: boolean; yaw: number }

const ROOM_AS_BAKED: RoomTurn = { mirrored: false, yaw: 0 }

function mirroredRoom(turn: RoomTurn): string {
  if (!turn.mirrored) return ''
  return `const { width: roomWidth, height: roomHeight, data: roomData } = room.image
for (let row = 0; row < roomHeight; row++) {
  for (let column = 0; column < roomWidth / 2; column++) {
    const near = (row * roomWidth + column) * 4
    const far = (row * roomWidth + roomWidth - 1 - column) * 4
    for (let channel = 0; channel < 4; channel++) {
      const kept = roomData[near + channel]
      roomData[near + channel] = roomData[far + channel]
      roomData[far + channel] = kept
    }
  }
}
`
}

function stage(
  size: BakeSize,
  room: string,
  scale: number,
  exposure: number,
  turn: RoomTurn = ROOM_AS_BAKED,
): string {
  return `<!doctype html>
<html><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"${BAKE_ORIGIN}/three/build/three.module.js","three/addons/":"${BAKE_ORIGIN}/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(${size.width}, ${size.height})
renderer.setClearColor(0x000000, 0)
renderer.toneMapping = THREE.NeutralToneMapping
renderer.toneMappingExposure = ${exposure}
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
const room = await new HDRLoader().setDataType(THREE.FloatType).loadAsync('${BAKE_ORIGIN}/originals/${room}')
for (let at = 0; at < room.image.data.length; at += 4) {
  room.image.data[at] *= ${scale}
  room.image.data[at + 1] *= ${scale}
  room.image.data[at + 2] *= ${scale}
}
${mirroredRoom(turn)}room.mapping = THREE.EquirectangularReflectionMapping
room.needsUpdate = true
scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(room).texture
scene.environmentRotation.set(${ROOM_ROTATION.pitch}, ${ROOM_ROTATION.yaw + turn.yaw}, 0)
const passes = {}
const take = (name, camera) => {
  renderer.render(scene, camera)
  passes[name] = renderer.domElement.toDataURL('image/png')
}
`
}

const FINISH = `window.baked = passes
</script></body></html>`

function giltModel(cut: FrameCut): string {
  return `const gltf = await new GLTFLoader().loadAsync('${BAKE_ORIGIN}/originals/${cut.original}')
const model = gltf.scene
const meshes = []
model.traverse((node) => {
  if (!node.isMesh) return
  if (node.name.endsWith('_canvas')) {
    node.visible = false
    return
  }
  const { geometry } = node
  geometry.computeBoundingBox()
  const back = geometry.boundingBox.min.z + ${FRAME_BACKBOARD}
  const position = geometry.attributes.position
  const order = geometry.index
  const front = []
  for (let at = 0; at < order.count; at += 3) {
    const corners = [order.getX(at), order.getX(at + 1), order.getX(at + 2)]
    if (corners.every((corner) => position.getZ(corner) < back)) continue
    front.push(...corners)
  }
  geometry.setIndex(front)
  node.material.metalness = ${FRAMES.gilt.metalness}
  meshes.push(node)
})
`
}

function woodModel(cut: FrameCut): string {
  const { width, height, slice } = FRAMES.wood
  const { moulding, tile, dense, coarse, jointReach, profile, members } = WOOD_MODEL
  const outer = { width: (moulding * width) / slice.left, height: (moulding * height) / slice.top }
  const maps = `${BAKE_ORIGIN}/originals/${cut.original}/${cut.original}_`
  return `const M = ${moulding}
const W = ${outer.width}
const H = ${outer.height}
const P = ${JSON.stringify(profile)}
const MEMBERS = ${JSON.stringify(members)}
const loader = new THREE.TextureLoader()
const woodMap = async (name, colour) => {
  const texture = await loader.loadAsync('${maps}' + name + '_2k.jpg')
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  if (colour) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
const [map, normalMap, roughnessMap] = await Promise.all([
  woodMap('diff', true),
  woodMap('nor_gl', false),
  woodMap('rough', false),
])
const wood = new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, metalness: 0, roughness: ${WOOD_MODEL.roughness} })
const wave = (t, waves) =>
  waves.reduce((sum, [amplitude, period, phase]) => sum + amplitude * Math.sin((t / period) * Math.PI * 2 + phase), 0)
const softMin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}
const joints = [M, W - M]
const upright = (member) => member.side === 'left' || member.side === 'right'
const heightAt = (x, y, member) => {
  const along = upright(member) ? y : x
  const fromEdge = Math.min(x, y, W - x, H - y)
  const fromSight = Math.max(M - x, x - (W - M), M - y, y - (H - M), 0)
  const face = P.face + wave(along, member.face) + P.dish * (1 - ((fromSight - M / 2) / (M / 2)) ** 2)
  const radius = P.arris + wave(along, member.arris)
  const rounded = fromEdge >= radius ? face : face - radius + Math.sqrt(radius * radius - (radius - fromEdge) ** 2)
  const start = P.chamfer + wave(along, member.chamfer)
  const bevel = fromSight <= P.lip ? P.sight : P.sight + ((face - P.sight) * (fromSight - P.lip)) / (start - P.lip)
  const surface = softMin(rounded, bevel, P.wear)
  if (y >= M && y <= H - M) return surface
  const gap = Math.min(...joints.map((joint) => Math.abs(x - joint)))
  return surface - P.joint.depth * Math.exp(-((gap / P.joint.width) ** 2))
}
const span = (from, to, step) => {
  const count = Math.max(1, Math.ceil((to - from) / step))
  return Array.from({ length: count + 1 }, (_, at) => from + ((to - from) * at) / count)
}
const samples = (from, to, near) =>
  [...new Set([
    ...span(from, to, ${coarse}),
    ...near.filter(([a, b]) => b > a).flatMap(([a, b]) => span(Math.max(a, from), Math.min(b, to), ${dense})),
  ].map((value) => Math.round(value * 1e7) / 1e7))].sort((a, b) => a - b)
const across = { left: [0, M], right: [W - M, W], bottom: [0, M], top: [H - M, H] }
const model = new THREE.Group()
const meshes = []
for (const member of MEMBERS) {
  const [low, high] = across[member.side]
  const xs = upright(member)
    ? span(low, high, ${dense})
    : samples(M, W - M, [[M, M + ${jointReach}], [W - M - ${jointReach}, W - M]])
  const ys = upright(member)
    ? samples(0, H, [[0, M + ${jointReach}], [H - M - ${jointReach}, H]])
    : span(low, high, ${dense})
  const positions = new Float32Array(xs.length * ys.length * 3)
  const uvs = new Float32Array(xs.length * ys.length * 2)
  let at = 0
  for (const y of ys) {
    for (const x of xs) {
      positions.set([x, y, heightAt(x, y, member)], at * 3)
      const [u, v] = upright(member) ? [y, -x] : [x, y]
      uvs.set([(member.turn * u) / ${tile} + member.offset[0], (member.turn * v) / ${tile} + member.offset[1]], at * 2)
      at += 1
    }
  }
  const index = []
  for (let row = 0; row < ys.length - 1; row++) {
    for (let column = 0; column < xs.length - 1; column++) {
      const a = row * xs.length + column
      const c = a + xs.length
      index.push(a, a + 1, c + 1, a, c + 1, c)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, wood)
  model.add(mesh)
  meshes.push(mesh)
}
`
}

const FRAME_ROOMS: Record<FrameKind, RoomTurn> = {
  gilt: ROOM_AS_BAKED,
  wood: { mirrored: true, yaw: -GLAZE_ROOM_YAW },
}

const FRAME_MODELS: Record<FrameKind, (cut: FrameCut) => string> = {
  gilt: giltModel,
  wood: woodModel,
}

function frameScene(size: BakeSize, cut: FrameCut, room: string, scale: number): string {
  return `${stage(size, room, scale, FRAMES[cut.frame].exposure, FRAME_ROOMS[cut.frame])}
${FRAME_MODELS[cut.frame](cut)}scene.add(model)
const bounds = new THREE.Box3().setFromObject(model)
const camera = new THREE.OrthographicCamera(bounds.min.x, bounds.max.x, bounds.max.y, bounds.min.y, 0.001, 10)
camera.position.set(0, 0, bounds.max.z + 1)
camera.lookAt(0, 0, bounds.max.z)
take('beauty', camera)
const scanned = meshes.map((mesh) => mesh.material)
renderer.toneMapping = THREE.NoToneMapping
meshes.forEach((mesh, index) => {
  mesh.material = new THREE.MeshBasicMaterial({ map: scanned[index].map, side: THREE.DoubleSide })
})
take('albedo', camera)
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
meshes.forEach((mesh, index) => {
  mesh.material = new THREE.MeshBasicMaterial({
    map: scanned[index].roughnessMap,
    color: new THREE.Color().setScalar(scanned[index].roughness),
    side: THREE.DoubleSide,
  })
})
take('roughness', camera)
meshes.forEach((mesh, index) => {
  mesh.material = new THREE.MeshNormalMaterial({
    normalMap: scanned[index].normalMap,
    normalScale: scanned[index].normalScale,
    side: THREE.DoubleSide,
  })
})
take('normal', camera)
${FINISH}`
}

function hangerScene(size: BakeSize, wood: string, room: string, scale: number): string {
  const { aspect, rest } = BANNER_CLOTH
  const { pole, finial, cord, ring, band } = BANNER_HANGER
  return `${stage(size, room, scale, BANNER_HANGER.exposure)}
const textures = new THREE.TextureLoader()
const woodMap = (name, colour) => {
  const texture = textures.load('${BAKE_ORIGIN}/originals/${wood}/dark_wood_' + name + '_1k.jpg')
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  if (colour) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
const wood = new THREE.MeshPhysicalMaterial({
  map: woodMap('diff', true),
  normalMap: woodMap('nor_gl', false),
  roughnessMap: woodMap('rough', false),
  clearcoat: 0.7,
  clearcoatRoughness: 0.18,
})
const gilt = new THREE.MeshPhysicalMaterial({ color: 0xc9a35a, metalness: 1, roughness: 0.34 })
const silk = new THREE.MeshPhysicalMaterial({
  color: 0xa8843f,
  metalness: 0.35,
  roughness: 0.45,
  sheen: 0.7,
  sheenColor: 0xf2dcaa,
  sheenRoughness: 0.4,
})
const y = -(${rest.y} - ${pole.lift})
const ends = [${pole.from}, ${aspect} - ${pole.from}]
const length = ends[1] - ends[0]
const rod = new THREE.CylinderGeometry(${pole.radius}, ${pole.radius}, length, 64, 1, true)
const uv = rod.attributes.uv
for (let at = 0; at < uv.count; at++) uv.setXY(at, uv.getY(at) * length * 1.2, uv.getX(at) * 0.06)
const shaft = new THREE.Mesh(rod, wood)
shaft.rotation.z = Math.PI / 2
shaft.position.set(${aspect} / 2, y, 0)
scene.add(shaft)
const profile = [
  [0, 0], [0.0102, 0], [0.0102, 0.0035], [0.0078, 0.0045], [0.0068, 0.0075], [0.0105, 0.0095],
  [0.0122, 0.0125], [0.0118, 0.015], [0.01, 0.016], [0.0115, 0.02], [0.0112, 0.0235],
  [0.01, 0.0262], [0.0068, 0.029], [0.003, 0.032], [0, ${finial.length}],
].map(([radius, along]) => new THREE.Vector2(radius, along))
const finialShape = new THREE.LatheGeometry(profile, 96)
for (const [index, x] of ends.entries()) {
  const end = new THREE.Mesh(finialShape, gilt)
  end.rotation.z = index === 0 ? Math.PI / 2 : -Math.PI / 2
  end.position.set(x, y, 0)
  scene.add(end)
}
const apex = new THREE.Vector3(${aspect} / 2, -${cord.apex} - ${ring.radius}, 0)
const hoop = new THREE.Mesh(new THREE.TorusGeometry(${ring.radius}, ${ring.tube}, 24, 96), gilt)
hoop.position.set(${aspect} / 2, -${cord.apex}, 0)
scene.add(hoop)
const wrapRadius = ${pole.radius} + ${cord.radius} * 2
const strand = (points) =>
  new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length * 2, ${cord.radius}, 12), silk)
for (const [index, end] of ends.entries()) {
  const inward = index === 0 ? 1 : -1
  const knot = end + inward * ${cord.attach}
  const coil = []
  for (let step = 0; step <= 160; step++) {
    const turn = (step / 160) * 2
    const angle = Math.PI / 2 - turn * Math.PI * 2
    coil.push(new THREE.Vector3(knot - inward * 0.003 + inward * turn * 0.0026, y + wrapRadius * Math.sin(angle), wrapRadius * Math.cos(angle)))
  }
  scene.add(strand(coil))
  const from = new THREE.Vector3(knot + inward * 0.0022, y + wrapRadius, 0)
  const to = apex.clone().add(new THREE.Vector3(-inward * 0.0015, 0.0006, 0))
  const sag = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, -0.0012, 0))
  const path = new THREE.QuadraticBezierCurve3(from, sag, to)
  const pathLength = path.getLength()
  for (const phase of [0, Math.PI]) {
    const points = []
    for (let step = 0; step <= 240; step++) {
      const t = step / 240
      const at = path.getPoint(t)
      const tangent = path.getTangent(t)
      const across = new THREE.Vector3(0, 0, 1).cross(tangent).normalize()
      const angle = (t * pathLength * Math.PI * 2) / ${cord.twist} + phase
      points.push(at.add(across.multiplyScalar(Math.cos(angle) * ${cord.radius})).add(new THREE.Vector3(0, 0, Math.sin(angle) * ${cord.radius})))
    }
    scene.add(strand(points))
  }
}
await new Promise((resolve) => THREE.DefaultLoadingManager.onLoad = resolve)
const camera = new THREE.OrthographicCamera(0, ${aspect}, 0, -${band}, 0.001, 10)
camera.position.set(0, 0, 1)
take('hanger', camera)
${FINISH}`
}

function retouched(
  rgba: Buffer,
  width: number,
  height: number,
  retouch: readonly Retouch[],
): Buffer {
  const out = Buffer.from(rgba)
  for (const patch of retouch) {
    const feather = { x: patch.width * RETOUCH_FEATHER, y: patch.height * RETOUCH_FEATHER }
    const open = {
      left: patch.x > 0,
      top: patch.y > 0,
      right: patch.x + patch.width < width,
      bottom: patch.y + patch.height < height,
    }
    for (let y = patch.y; y < patch.y + patch.height; y++) {
      for (let x = patch.x; x < patch.x + patch.width; x++) {
        const inside = [
          open.left ? (x - patch.x + 0.5) / feather.x : 1,
          open.right ? (patch.x + patch.width - x - 0.5) / feather.x : 1,
          open.top ? (y - patch.y + 0.5) / feather.y : 1,
          open.bottom ? (patch.y + patch.height - y - 0.5) / feather.y : 1,
        ]
        const weight = Math.min(1, ...inside)
        const to = (y * width + x) * 4
        const from = ((y + patch.from.y) * width + (x + patch.from.x)) * 4
        for (let channel = 0; channel < 4; channel++) {
          const kept = rgba[to + channel] ?? 0
          const cloned = rgba[from + channel] ?? 0
          out[to + channel] = Math.round(kept + (cloned - kept) * weight)
        }
      }
    }
  }
  return out
}

function originalAt(path: string): string {
  return path.startsWith('/three/')
    ? resolve(root, 'node_modules', path.slice(1))
    : resolve(originals, path.replace(/^\/originals\//, ''))
}

async function roomScale(): Promise<{ file: string; scale: number }> {
  const room = TEXTURE_WORKS.flatMap((work): readonly TextureCut[] => work.cuts).find(
    (cut) => cut.kind === 'environment',
  )
  if (!room) throw new Error('the bakes are lit by the environment, which no texture work provides')
  return { file: room.original, scale: (await roomOf(room)).scale }
}

async function framePasses(cuts: readonly FrameCut[]): Promise<void> {
  const [first] = cuts
  if (!first) return
  original(first)
  const spec = FRAMES[first.frame]
  const room = await roomScale()
  const size = {
    width: spec.width * FRAME_SUPERSAMPLE,
    height: Math.round(spec.height * FRAME_SUPERSAMPLE),
  }
  const shot = await bakeInBrowser(frameScene(size, first, room.file, room.scale), size, originalAt)
  const pixels = async (name: string): Promise<Buffer> => {
    const png = shot[name]
    if (!png) throw new Error(`the ${first.frame} frame bake made no ${name} pass`)
    const { data } = await sharp(png)
      .resize({ width: spec.width, height: spec.height, fit: 'fill', kernel: 'lanczos3' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    return retouched(data, spec.width, spec.height, first.retouch)
  }
  const beauty = await pixels('beauty')
  const opening = measureOpening(beauty, spec.width, spec.height)
  if (
    Object.entries(opening).some(
      ([side, value]) => Math.abs(value - spec.slice[side as keyof typeof opening]) > 1,
    )
  ) {
    throw new Error(
      `the ${first.frame} frame's moulding measures ${JSON.stringify(opening)}, not ${JSON.stringify(spec.slice)}`,
    )
  }
  const raw = { raw: { width: spec.width, height: spec.height, channels: 4 as const } }
  const mapOf = (pixels: Buffer) =>
    sharp(pixels, raw)
      .resize({ width: spec.mapsWidth, kernel: 'lanczos3' })
      .avif({ quality: FRAME_MAPS_QUALITY, effort: 6, chromaSubsampling: '4:4:4' })
  for (const cut of cuts) {
    if (cut.pass === 'beauty') {
      await sharp(beauty, raw)
        .webp({ quality: FRAME_QUALITY, alphaQuality: 100, effort: 6 })
        .toFile(resolve(outDir, cut.file))
      continue
    }
    if (cut.pass === 'surface') {
      const albedo = await pixels('albedo')
      const roughness = await pixels('roughness')
      for (let at = 0; at < albedo.length; at += 4) {
        const covered = (beauty[at + 3] ?? 0) > 0
        albedo[at + 3] = covered ? (roughness[at + 1] ?? 0) : 255
      }
      await mapOf(albedo).toFile(resolve(outDir, cut.file))
      continue
    }
    const normal = await pixels('normal')
    for (let at = 0; at < normal.length; at += 4) {
      if ((beauty[at + 3] ?? 0) === 0) normal.set([128, 128, 255], at)
      normal[at + 3] = 255
    }
    await mapOf(normal).toFile(resolve(outDir, cut.file))
  }
}

async function hanger(cut: Extract<TextureCut, { kind: 'hanger' }>): Promise<void> {
  original(cut)
  const room = await roomScale()
  const width = BANNER_HANGER.width
  const height = Math.round((width * BANNER_HANGER.band) / BANNER_CLOTH.aspect)
  const size = { width: width * FRAME_SUPERSAMPLE, height: height * FRAME_SUPERSAMPLE }
  const shot = await bakeInBrowser(
    hangerScene(size, cut.original, room.file, room.scale),
    size,
    originalAt,
  )
  const png = shot['hanger']
  if (!png) throw new Error('the hanger bake made no picture')
  await sharp(png)
    .resize({ width, height, fit: 'fill', kernel: 'lanczos3' })
    .webp({ quality: FRAME_QUALITY, alphaQuality: 100, effort: 6 })
    .toFile(resolve(outDir, cut.file))
}

function measureOpening(
  rgba: Buffer,
  width: number,
  height: number,
): { top: number; right: number; bottom: number; left: number } {
  const opaque = (x: number, y: number): boolean => (rgba[(y * width + x) * 4 + 3] ?? 0) > 127
  const middle = { x: Math.floor(width / 2), y: Math.floor(height / 2) }
  const from = (step: (n: number) => [number, number], limit: number): number => {
    for (let n = 0; n < limit; n++) {
      const [x, y] = step(n)
      if (!opaque(x, y)) return n
    }
    throw new Error('the frame has no opening')
  }
  return {
    top: from((n) => [middle.x, n], height),
    bottom: from((n) => [middle.x, height - 1 - n], height),
    left: from((n) => [n, middle.y], width),
    right: from((n) => [width - 1 - n, middle.y], width),
  }
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true })
  const cuts = TEXTURE_WORKS.flatMap((work): readonly TextureCut[] => work.cuts)
  for (const cut of cuts) {
    if (cut.kind === 'environment') await environment(cut)
    if (cut.kind === 'relief') await relief(cut)
    if (cut.kind === 'hanger') await hanger(cut)
  }
  const frameCuts = cuts.filter((cut): cut is FrameCut => cut.kind === 'frame')
  for (const frame of new Set(frameCuts.map((cut) => cut.frame))) {
    await framePasses(frameCuts.filter((cut) => cut.frame === frame))
  }
  console.log(`textures: wrote ${cuts.length} files into data/media/textures/`)
}

await main()
