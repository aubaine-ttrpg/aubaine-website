import { type Grid, tileOf } from './grid.ts'
import type { World } from './model.ts'

export type AtlasRef =
  | { kind: 'tile'; tile: number }
  | { kind: 'under'; level: number; tile: number }
  | { kind: 'sky'; sky: number }
  | { kind: 'place'; place: number }
  | { kind: 'landmark'; landmark: number }

export function sameRef(a: AtlasRef, b: AtlasRef): boolean {
  return refKey(a) === refKey(b)
}

export function refKey(ref: AtlasRef): string {
  switch (ref.kind) {
    case 'tile':
      return `tile:${ref.tile}`
    case 'under':
      return `under:${ref.level}:${ref.tile}`
    case 'sky':
      return `sky:${ref.sky}`
    case 'place':
      return `place:${ref.place}`
    case 'landmark':
      return `landmark:${ref.landmark}`
  }
}

const INDEX = /^\d+$/

function index(value: string | undefined, below: number): number | undefined {
  if (value === undefined || !INDEX.test(value)) return undefined
  const parsed = Number(value)
  return parsed < below ? parsed : undefined
}

function level(world: World, value: string | undefined): number | undefined {
  const parsed = index(value, Number.MAX_SAFE_INTEGER)
  return parsed !== undefined && world.underground.some((record) => record.level === parsed)
    ? parsed
    : undefined
}

export function refFromKey(key: string, world: World, grid: Grid): AtlasRef | undefined {
  const [kind, first, second] = key.split(':')
  switch (kind) {
    case 'tile': {
      const tile = index(first, grid.size)
      return tile === undefined ? undefined : { kind, tile }
    }
    case 'under': {
      const depth = level(world, first)
      const tile = index(second, grid.size)
      return depth === undefined || tile === undefined ? undefined : { kind, level: depth, tile }
    }
    case 'sky': {
      const sky = index(first, world.sky.tile.length)
      return sky === undefined ? undefined : { kind, sky }
    }
    case 'place': {
      const place = index(first, world.places.length)
      return place === undefined ? undefined : { kind, place }
    }
    case 'landmark': {
      const landmark = index(first, world.landmarks.length)
      return landmark === undefined ? undefined : { kind, landmark }
    }
    default:
      return undefined
  }
}

const cell = (grid: Grid, tile: number) =>
  `${tile % grid.columns}-${Math.floor(tile / grid.columns)}`

function tileFromCell(grid: Grid, value: string | undefined): number | undefined {
  const match = /^(\d+)-(\d+)$/.exec(value ?? '')
  if (!match) return undefined
  const tile = tileOf(grid, Number(match[1]), Number(match[2]))
  return tile >= 0 ? tile : undefined
}

export function formatHash(ref: AtlasRef, world: World, grid: Grid): string {
  switch (ref.kind) {
    case 'tile':
      return `#t/${cell(grid, ref.tile)}`
    case 'under':
      return `#u/${ref.level}/${cell(grid, ref.tile)}`
    case 'sky':
      return `#s/${cell(grid, world.sky.tile[ref.sky] ?? 0)}`
    case 'place':
      return `#g/${encodeURIComponent(world.places[ref.place]?.id ?? '')}`
    case 'landmark':
      return `#l/${encodeURIComponent(world.landmarks[ref.landmark]?.id ?? '')}`
  }
}

export function parseHash(hash: string, world: World, grid: Grid): AtlasRef | undefined {
  const [prefix, first, second] = hash.replace(/^#/, '').split('/')
  switch (prefix) {
    case 't': {
      const tile = tileFromCell(grid, first)
      return tile === undefined ? undefined : { kind: 'tile', tile }
    }
    case 'u': {
      const depth = level(world, first)
      const tile = tileFromCell(grid, second)
      return depth === undefined || tile === undefined
        ? undefined
        : { kind: 'under', level: depth, tile }
    }
    case 's': {
      const tile = tileFromCell(grid, first)
      const sky = tile === undefined ? -1 : (world.sky.at[tile] ?? -1)
      return sky >= 0 ? { kind: 'sky', sky } : undefined
    }
    case 'g': {
      const id = decodeURIComponent(first ?? '')
      const place = world.places.findIndex((candidate) => candidate.id === id)
      return place >= 0 ? { kind: 'place', place } : undefined
    }
    case 'l': {
      const id = decodeURIComponent(first ?? '')
      const landmark = world.landmarks.findIndex((candidate) => candidate.id === id)
      return landmark >= 0 ? { kind: 'landmark', landmark } : undefined
    }
    default:
      return undefined
  }
}
