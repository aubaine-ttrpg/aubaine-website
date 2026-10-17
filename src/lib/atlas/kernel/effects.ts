import type {
  BeamSpec,
  CloudSpec,
  EffectsData,
  Flock,
  GlowSpec,
  LightPool,
  MeshData,
  ParticleSpec,
  ParticleStyle,
  Rgb,
  VortexSpec,
} from '../contract/scene.ts'
import { downwind } from '../contract/wind.ts'
import { type CaveKind, ESTABLISHMENT_DRESSINGS, TILE_TYPES } from '../vocabulary.ts'
import { CORNERS, EDGES, type Grid, neighbourOf } from '../world/grid.ts'
import type { LandmarkRecord, World } from '../world/model.ts'
import { mulberry32 } from '../world/noise.ts'
import { heightIn, type ReliefField } from '../world/relief.ts'
import { hexToLinear } from './colour.ts'
import { MeshWriter, RIBBON_LAYOUT } from './mesh.ts'
import { landmarkPlacement } from './placement.ts'
import type { CaveMouth } from './terrain.ts'

const EFFECTS_SEED = 31
const CITY_POOL = { radius: 1.4, strength: 0.55 }
const VILLAGE_POOL = { radius: 0.95, strength: 0.4 }
const POOL_LIFT = 0.05
const CLOUDS_SEED = 99
const HIGH_CLOUDS = { count: 16, low: 4.2, high: 7, smallest: 10, largest: 22, opacity: 0.22 }
const FALL_SEGMENTS = 8
const SMOKE_KINDS: ReadonlySet<string> = new Set(ESTABLISHMENT_DRESSINGS.workshop)

const CAVE_GLOW: Record<CaveKind, string> = {
  crystal: '#9a5cff',
  lava: '#ff5a14',
  ice: '#6fd8ff',
  mine: '#ffb347',
  fungal: '#3dffc8',
  smugglers: '#ffc070',
  lair: '#ff7a3a',
  sea: '#4fd1d9',
  natural: '#7aa0ff',
}

type ParticleOptions = {
  perOrigin?: number
  life?: number
  velocity?: Rgb
  spread?: Rgb
  gravity?: number
  size?: [number, number]
  turbulence?: number
  colour?: Rgb
  fade?: Rgb
  alpha?: number
  style?: ParticleStyle
  nightOnly?: boolean
  additive?: boolean
  seed?: number
}

export function particles(
  origins: readonly (readonly [number, number, number])[],
  options: ParticleOptions,
): ParticleSpec {
  const colour = options.colour ?? [1, 1, 1]
  return {
    origins: Float32Array.from(origins.flat()),
    perOrigin: options.perOrigin ?? 1,
    life: options.life ?? 4,
    velocity: options.velocity ?? [0, 0.3, 0],
    spread: options.spread ?? [0.2, 0.2, 0.2],
    gravity: options.gravity ?? 0,
    size: options.size ?? [0.05, 0.1],
    turbulence: options.turbulence ?? 0.1,
    colour,
    fade: options.fade ?? colour,
    alpha: options.alpha ?? 1,
    style: options.style ?? 'soft',
    nightOnly: options.nightOnly ?? false,
    additive: options.additive ?? false,
    seed: options.seed ?? 7,
  }
}

type BeamOptions = Partial<Omit<BeamSpec, 'shape' | 'position' | 'colour'>> & {
  shape: BeamSpec['shape']
  position: Rgb
  colour: string
}

function beam(options: BeamOptions): BeamSpec {
  return {
    shape: options.shape,
    radiusTop: options.radiusTop ?? 0,
    radiusBottom: options.radiusBottom ?? 0,
    height: options.height ?? 0,
    segments: options.segments ?? 16,
    shift: options.shift ?? 0,
    lying: options.lying ?? false,
    position: options.position,
    tilt: options.tilt ?? 0,
    turn: options.turn ?? 0,
    colour: hexToLinear(options.colour),
    intensity: options.intensity ?? 1,
    scroll: options.scroll ?? 0.2,
    night: options.night ?? 0,
    spin: options.spin ?? 0,
  }
}

function writeFall(
  writer: MeshWriter,
  from: Rgb,
  to: Rgb,
  width: number,
  tx: number,
  tz: number,
): void {
  const base = writer.vertexCount
  for (let k = 0; k <= FALL_SEGMENTS; k++) {
    const f = k / FALL_SEGMENTS
    const x = from[0] + (to[0] - from[0]) * f
    const y = from[1] + (to[1] - from[1]) * f
    const z = from[2] + (to[2] - from[2]) * f
    for (const side of [-0.5, 0.5]) {
      writer.vertex(x + tx * width * side, y, z + tz * width * side, 0, 1, 0)
      writer.float(side + 0.5)
      writer.float(f)
    }
  }
  for (let k = 0; k < FALL_SEGMENTS; k++) {
    const a = base + k * 2
    writer.triangle(a, a + 2, a + 1)
    writer.triangle(a + 1, a + 2, a + 3)
  }
}

function clouds(grid: Grid, aloft: LandmarkRecord[]): CloudSpec[] {
  const R = mulberry32(CLOUDS_SEED)
  const list: CloudSpec[] = []
  for (let k = 0; k < HIGH_CLOUDS.count; k++) {
    const x = (R() - 0.5) * 2 * grid.originX * 0.95
    const z = (R() - 0.5) * 2 * grid.originZ * 0.95
    list.push({
      x,
      y: HIGH_CLOUDS.low + R() * (HIGH_CLOUDS.high - HIGH_CLOUDS.low),
      z,
      size: HIGH_CLOUDS.smallest + R() * (HIGH_CLOUDS.largest - HIGH_CLOUDS.smallest),
      opacity: HIGH_CLOUDS.opacity * (0.6 + R() * 0.4),
      drift: 0.04 + R() * 0.26,
      seed: R(),
    })
  }
  for (const landmark of aloft) {
    for (let k = 0; k < 3; k++) {
      list.push({
        x: landmark.x + (k - 1) * 2.4,
        y: landmark.y - 2.2 - k * 0.4,
        z: landmark.z + (k % 2 ? 1.2 : -1.4),
        size: 2.2 + k * 0.6,
        opacity: 0.38,
        drift: 0.05,
        seed: k / 3,
      })
    }
  }
  return list
}

const GULL_REACH = 3

function seaDistance(world: World, grid: Grid): Int16Array {
  const { water, lake } = world.surface
  const distance = new Int16Array(grid.size).fill(-1)
  const queue: number[] = []
  for (let tile = 0; tile < grid.size; tile++) {
    if (water[tile] === 1 && (lake[tile] ?? -1) < 0) {
      distance[tile] = 0
      queue.push(tile)
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const tile = queue[head] ?? 0
    const next = (distance[tile] ?? 0) + 1
    for (let edge = 0; edge < EDGES; edge++) {
      const other = neighbourOf(grid, tile, edge)
      if (other < 0 || (distance[other] ?? 0) >= 0) continue
      distance[other] = next
      queue.push(other)
    }
  }
  return distance
}

function flocks(world: World, grid: Grid, field: ReliefField): Flock[] {
  const { surface } = world
  const list: Flock[] = []
  const coast = seaDistance(world, grid)
  const nearSea = (tiles: Int32Array) =>
    tiles.some((tile) => (coast[tile] ?? -1) >= 0 && (coast[tile] ?? 0) <= GULL_REACH)
  for (const place of world.places) {
    if (place.aloft || place.stratum !== 0) continue
    if ((place.kind === 'city' || place.kind === 'village') && nearSea(place.tiles)) {
      list.push({
        x: place.centreX + 1.5,
        z: place.centreZ,
        y: (surface.y[place.anchor] ?? 0) + 1.4,
        radius: 2.2,
        count: 9,
        spread: 2,
        scale: 0.22,
        dark: false,
        speed: 1,
      })
    }
  }
  for (const landmark of world.landmarks) {
    if (landmark.kind !== 'skycity' && landmark.kind !== 'worldtree') continue
    const base = landmarkPlacement(field, landmark)
    list.push({
      x: base.x,
      z: base.z,
      y: base.y + (landmark.kind === 'skycity' ? 1.5 : 8.2),
      radius: 4,
      count: 14,
      spread: 2,
      scale: 0.3,
      dark: false,
      speed: 1,
    })
  }
  for (const place of world.places) {
    if (place.kind !== 'natural' || place.subtype !== 'range' || place.tiles.length === 0) continue
    let highest = Number.NEGATIVE_INFINITY
    for (const tile of place.tiles) highest = Math.max(highest, surface.y[tile] ?? 0)
    list.push({
      x: place.centreX,
      z: place.centreZ,
      y: highest + 1.6,
      radius: 3,
      count: 6,
      spread: 4,
      scale: 0.4,
      dark: true,
      speed: 0.6,
    })
  }
  return list
}

function lightPools(world: World, field: ReliefField): LightPool[] {
  const { grid } = field
  const { surface } = world
  const pools: LightPool[] = []
  for (let tile = 0; tile < grid.size; tile++) {
    const settlement = world.places[surface.city[tile] ?? -1]
    if (!settlement) continue
    const pool = settlement.kind === 'village' ? VILLAGE_POOL : CITY_POOL
    const x = grid.x[tile] ?? 0
    const z = grid.z[tile] ?? 0
    pools.push({ x, y: heightIn(field, tile, x, z) + POOL_LIFT, z, ...pool })
  }
  return pools
}

export function buildEffects(
  world: World,
  field: ReliefField,
  mouths: readonly CaveMouth[],
): EffectsData {
  const { grid } = field
  const { surface } = world
  const R = mulberry32(EFFECTS_SEED)
  const systems: ParticleSpec[] = []
  const beams: BeamSpec[] = []
  const vortices: VortexSpec[] = []
  const glows: GlowSpec[] = []
  const placed = (kind: LandmarkRecord['kind']) =>
    world.landmarks
      .filter((landmark) => landmark.kind === kind)
      .map((landmark) => landmarkPlacement(field, landmark))
  const at = (x: number, y: number, z: number): [number, number, number] => [x, y, z]
  for (const volcano of placed('volcano')) {
    const top = at(volcano.x, volcano.y + 1.75, volcano.z)
    systems.push(
      particles([top], {
        perOrigin: 160,
        life: 9,
        velocity: downwind(0.13, 0.45),
        spread: [0.4, 0.1, 0.4],
        size: [0.35, 1.6],
        turbulence: 0.35,
        colour: [0.25, 0.22, 0.22],
        fade: [0.55, 0.53, 0.55],
        alpha: 0.55,
        style: 'smoke',
        seed: 3,
      }),
      particles([top], {
        perOrigin: 140,
        life: 2.6,
        velocity: [0, 1.1, 0],
        spread: [0.45, 0.1, 0.45],
        gravity: 0.55,
        size: [0.05, 0.02],
        turbulence: 0.25,
        colour: [6, 2.2, 0.4],
        fade: [3, 0.6, 0.1],
        additive: true,
        style: 'spark',
        seed: 4,
      }),
    )
    beams.push(
      beam({
        shape: 'sphere',
        radiusTop: 0.6,
        segments: 16,
        position: [top[0], top[1] - 0.2, top[2]],
        colour: '#ff6a1a',
        intensity: 0.9,
        scroll: 0.1,
      }),
    )
  }
  for (const spire of placed('spire')) {
    beams.push(
      beam({
        shape: 'cylinder',
        radiusTop: 0.3,
        radiusBottom: 0.42,
        height: 60,
        segments: 24,
        shift: 30,
        position: [spire.x, spire.y + 4.2, spire.z],
        colour: '#a66bff',
        intensity: 0.85,
        scroll: 0.15,
        night: 0.6,
      }),
    )
    systems.push(
      particles([at(spire.x, spire.y + 0.3, spire.z)], {
        perOrigin: 260,
        life: 7,
        velocity: [0, 0.55, 0],
        spread: [3.2, 0.6, 3.2],
        size: [0.06, 0.02],
        turbulence: 0.5,
        colour: [2.2, 1.2, 4],
        fade: [1.4, 0.6, 3],
        additive: true,
        style: 'spark',
        seed: 8,
      }),
    )
  }
  const ETHER = TILE_TYPES.indexOf('ether')
  const ether: [number, number, number][] = []
  for (let tile = 0; tile < grid.size; tile++) {
    if (surface.type[tile] === ETHER && R() < 0.3)
      ether.push(at(grid.x[tile] ?? 0, (surface.y[tile] ?? 0) + 0.1, grid.z[tile] ?? 0))
  }
  if (ether.length) {
    systems.push(
      particles(ether, {
        perOrigin: 6,
        life: 6,
        velocity: [0, 0.18, 0],
        spread: [1.4, 0.2, 1.4],
        size: [0.035, 0.015],
        turbulence: 0.3,
        colour: [1.6, 0.8, 3.2],
        fade: [1, 0.5, 2.4],
        additive: true,
        style: 'spark',
        seed: 9,
      }),
    )
  }
  for (const tree of placed('worldtree')) {
    systems.push(
      particles([at(tree.x, tree.y + 6.8, tree.z)], {
        perOrigin: 220,
        life: 14,
        velocity: downwind(0.054, -0.42),
        spread: [8, 1.5, 8],
        size: [0.04, 0.03],
        turbulence: 0.6,
        colour: [0.9, 2.2, 1],
        fade: [1.6, 1.6, 0.5],
        additive: true,
        style: 'spark',
        seed: 10,
      }),
    )
    for (let k = 0; k < 5; k++) {
      const angle = (k / 5) * Math.PI * 2 + 0.5
      const reach = 1.6 + R() * 1.4
      beams.push(
        beam({
          shape: 'cylinder',
          radiusTop: 0.15,
          radiusBottom: 0.55,
          height: 5.5,
          segments: 16,
          shift: -2.75,
          position: [
            tree.x + Math.cos(angle) * reach,
            tree.y + 6.2,
            tree.z + Math.sin(angle) * reach,
          ],
          tilt: 0.22,
          turn: angle,
          colour: '#fff0b0',
          intensity: 0.1,
          scroll: 0.05,
        }),
      )
    }
  }
  const types = (...names: (typeof TILE_TYPES)[number][]) =>
    new Set(names.map((name) => TILE_TYPES.indexOf(name)))
  const glowing = types('forest', 'swamp', 'myxo')
  const fireflies: [number, number, number][] = []
  for (let tile = 0; tile < grid.size; tile++) {
    if (glowing.has(surface.type[tile] ?? -1) && R() < 0.18) {
      fireflies.push(at(grid.x[tile] ?? 0, (surface.y[tile] ?? 0) + 0.2, grid.z[tile] ?? 0))
    }
  }
  if (fireflies.length) {
    systems.push(
      particles(fireflies, {
        perOrigin: 6,
        life: 5,
        velocity: [0, 0.02, 0],
        spread: [1.4, 0.3, 1.4],
        size: [0.04, 0.035],
        turbulence: 0.35,
        colour: [2.6, 3, 0.8],
        fade: [1.6, 2.6, 0.6],
        additive: true,
        style: 'spark',
        nightOnly: true,
        seed: 11,
      }),
    )
  }
  const frozen = types('glacier', 'tundra')
  const snow: [number, number, number][] = []
  for (let tile = 0; tile < grid.size; tile++) {
    const latitude = (Math.floor(tile / grid.columns) + 0.5) / grid.rows
    if (frozen.has(surface.type[tile] ?? -1) && latitude < 0.2 && R() < 0.35) {
      snow.push(at(grid.x[tile] ?? 0, (surface.y[tile] ?? 0) + 2.4, grid.z[tile] ?? 0))
    }
  }
  if (snow.length) {
    systems.push(
      particles(snow, {
        perOrigin: 10,
        life: 7,
        velocity: downwind(0.085, -0.32),
        spread: [1.8, 0.4, 1.8],
        size: [0.035, 0.035],
        turbulence: 0.25,
        alpha: 0.75,
        seed: 12,
      }),
    )
  }
  const SWAMP = TILE_TYPES.indexOf('swamp')
  const mist: [number, number, number][] = []
  for (let tile = 0; tile < grid.size; tile++) {
    const swamp = surface.type[tile] === SWAMP
    if ((swamp || ((surface.lake[tile] ?? -1) >= 0 && R() < 0.4)) && R() < 0.5) {
      mist.push(at(grid.x[tile] ?? 0, (surface.y[tile] ?? 0) + 0.12, grid.z[tile] ?? 0))
    }
  }
  if (mist.length) {
    systems.push(
      particles(mist, {
        perOrigin: 3,
        life: 12,
        velocity: downwind(0.045, 0.012),
        spread: [1.5, 0.1, 1.5],
        size: [0.8, 1.8],
        turbulence: 0.2,
        colour: [0.85, 0.9, 0.92],
        alpha: 0.18,
        style: 'smoke',
        seed: 13,
      }),
    )
  }
  const smoking = new Set(
    world.establishments
      .filter(
        (establishment) =>
          establishment.stratum === 0 &&
          !establishment.aloft &&
          SMOKE_KINDS.has(establishment.kind),
      )
      .map((establishment) => establishment.place),
  )
  const chimneys: [number, number, number][] = []
  for (const place of world.places) {
    if (!smoking.has(place.index)) continue
    for (const tile of place.tiles) {
      chimneys.push(
        at(
          (grid.x[tile] ?? 0) + (R() - 0.5) * 0.6,
          (surface.y[tile] ?? 0) + 0.3,
          (grid.z[tile] ?? 0) + (R() - 0.5) * 0.6,
        ),
      )
    }
  }
  if (chimneys.length) {
    systems.push(
      particles(chimneys, {
        perOrigin: 34,
        life: 8,
        velocity: downwind(0.1, 0.28),
        spread: [0.4, 0.05, 0.4],
        size: [0.12, 0.7],
        turbulence: 0.25,
        colour: [0.24, 0.22, 0.22],
        fade: [0.42, 0.42, 0.44],
        alpha: 0.45,
        style: 'smoke',
        seed: 14,
      }),
    )
  }
  if (mouths.length) {
    for (const mouth of mouths) {
      const [r, g, b] = hexToLinear(CAVE_GLOW[mouth.kind])
      glows.push({
        position: [mouth.x, mouth.y, mouth.z],
        colour: [r * 1.6, g * 1.6, b * 1.6],
        size: 0.55,
      })
    }
    systems.push(
      particles(
        mouths.map((mouth) => at(mouth.outX, mouth.outY, mouth.outZ)),
        {
          perOrigin: 10,
          life: 4,
          velocity: [0, 0.12, 0],
          spread: [0.25, 0.25, 0.25],
          size: [0.03, 0.01],
          turbulence: 0.12,
          colour: [2.2, 1.8, 1.2],
          additive: true,
          style: 'spark',
          seed: 15,
        },
      ),
    )
  }
  const falls = new MeshWriter(RIBBON_LAYOUT)
  const spray: [number, number, number][] = []
  for (const route of world.routes) {
    if (route.kind !== 'river') continue
    const { tiles } = route
    for (let k = 0; k < tiles.length - 1; k++) {
      const tile = tiles[k] ?? 0
      const next = tiles[k + 1] ?? 0
      let edge = -1
      for (let e = 0; e < EDGES; e++) if (neighbourOf(grid, tile, e) === next) edge = e
      if (edge < 0 || (surface.connection[tile * EDGES + edge] ?? 0) < 2) continue
      if ((surface.y[tile] ?? 0) - (surface.y[next] ?? 0) < 0.15) continue
      const [c0x, c0z] = CORNERS[edge] ?? [0, 0]
      const [c1x, c1z] = CORNERS[(edge + 1) % EDGES] ?? [0, 0]
      const mx = (grid.x[tile] ?? 0) + (c0x + c1x) / 2
      const mz = (grid.z[tile] ?? 0) + (c0z + c1z) / 2
      const angle = (edge * Math.PI) / 3
      const nx = Math.cos(angle)
      const nz = Math.sin(angle)
      const top = heightIn(field, tile, mx - nx * 0.01, mz - nz * 0.01) + 0.015
      const lake = surface.lake[next] ?? -1
      const surfaceLevel =
        surface.water[next] === 1 ? (lake >= 0 ? (world.lakes[lake]?.y ?? 0) : 0) : -9
      const bottom = Math.max(heightIn(field, next, mx + nx * 0.02, mz + nz * 0.02), surfaceLevel)
      writeFall(
        falls,
        [mx + nx * 0.02, top, mz + nz * 0.02],
        [mx + nx * 0.07, bottom, mz + nz * 0.07],
        0.15,
        -nz,
        nx,
      )
      spray.push(at(mx + nx * 0.12, bottom + 0.03, mz + nz * 0.12))
    }
  }
  if (spray.length) {
    systems.push(
      particles(spray, {
        perOrigin: 18,
        life: 3,
        velocity: [0, 0.12, 0],
        spread: [0.25, 0.05, 0.25],
        size: [0.12, 0.5],
        turbulence: 0.15,
        colour: [0.95, 0.97, 1],
        alpha: 0.35,
        style: 'smoke',
        seed: 16,
      }),
    )
  }
  for (const city of world.landmarks.filter((landmark) => landmark.kind === 'skycity')) {
    const height = city.y + 5
    beams.push(
      beam({
        shape: 'cylinder',
        radiusTop: 0.6,
        radiusBottom: 0.15,
        height,
        segments: 20,
        shift: -height / 2,
        position: [city.x, city.y - 3.4, city.z],
        colour: '#b48cff',
        intensity: 0.5,
        scroll: -0.3,
      }),
    )
    systems.push(
      particles([at(city.x, city.y - 3.4, city.z)], {
        perOrigin: 120,
        life: 5,
        velocity: [0, -0.7, 0],
        spread: [1.2, 0.4, 1.2],
        size: [0.05, 0.02],
        turbulence: 0.2,
        colour: [1.6, 1, 3],
        additive: true,
        style: 'spark',
        seed: 17,
      }),
    )
  }
  for (const light of placed('lighthouse')) {
    beams.push(
      beam({
        shape: 'cone',
        radiusBottom: 0.9,
        height: 6,
        segments: 24,
        shift: -3,
        lying: true,
        position: [light.x, light.y + 0.74, light.z],
        colour: '#fff1c4',
        intensity: 0.7,
        scroll: 0.02,
        night: 1,
        spin: 0.8,
      }),
    )
  }
  for (const portal of placed('portal')) {
    vortices.push({
      position: [portal.x, portal.y + 0.37, portal.z],
      radius: 0.31,
      turn: 0.3,
      colour: hexToLinear('#7fb8ff'),
    })
    systems.push(
      particles([at(portal.x, portal.y + 0.37, portal.z)], {
        perOrigin: 80,
        life: 3,
        velocity: [0, 0.2, 0],
        spread: [0.6, 0.6, 0.6],
        size: [0.04, 0.01],
        turbulence: 0.3,
        colour: [1.2, 2.2, 3.5],
        additive: true,
        style: 'spark',
        seed: 18,
      }),
    )
  }
  const fallMesh: MeshData | undefined = falls.vertexCount > 0 ? falls.build() : undefined
  return {
    pools: lightPools(world, field),
    particles: systems,
    beams,
    vortices,
    glows,
    flocks: flocks(world, grid, field),
    clouds: clouds(
      grid,
      world.landmarks.filter((landmark) => landmark.aloft),
    ),
    falls: fallMesh,
  }
}
