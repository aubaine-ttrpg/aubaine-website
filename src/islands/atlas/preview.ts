import { FieldError, fields, list, text } from '../../lib/atlas/contract/fields'
import { TILE_TYPES, type TileType } from '../../lib/atlas/vocabulary'
import { TILE_SWATCHES } from './swatches'

const SURFACES = import.meta.glob<string>('/data/atlas/*/surface.json', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
})

const loaded = new Map<string, Promise<TileType[][]>>()

function isTileType(value: unknown): value is TileType {
  return TILE_TYPES.some((type) => type === value)
}

function tileRows(value: unknown): TileType[][] {
  const surface = fields(value, 'surface')
  const layer = fields(surface['type'], 'surface.type')
  const legend = fields(layer['legend'], 'surface.type.legend')
  return list(layer['rows'], 'surface.type.rows').map((row, index) =>
    [...text(row, `surface.type.rows[${index}]`)].map((cell) => {
      const type = legend[cell]
      if (!isTileType(type)) throw new FieldError(`surface.type.legend.${cell}`, 'a tile type')
      return type
    }),
  )
}

async function fetchTiles(key: string): Promise<TileType[][]> {
  const url = SURFACES[`/data/atlas/${key}/surface.json`]
  if (url === undefined) throw new Error(`the Atlas has no surface for ${key}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`the surface of ${key} answered ${response.status}`)
  return tileRows(await response.json())
}

export function worldTiles(key: string): Promise<TileType[][]> {
  const known = loaded.get(key)
  if (known) return known
  const next = fetchTiles(key)
  loaded.set(key, next)
  next.catch(() => loaded.delete(key))
  return next
}

function channels(hex: string): readonly [number, number, number] {
  const at = (index: number) => Number.parseInt(hex.slice(index, index + 2), 16)
  return [at(1), at(3), at(5)]
}

const RGB = new Map(TILE_TYPES.map((type) => [type, channels(TILE_SWATCHES[type])] as const))

export function paintTiles(
  canvas: HTMLCanvasElement,
  tiles: readonly (readonly TileType[])[],
): void {
  const rows = tiles.length
  const columns = tiles[0]?.length ?? 0
  const context = canvas.getContext('2d')
  if (!context || rows === 0 || columns === 0) return
  canvas.width = columns
  canvas.height = rows
  const image = context.createImageData(columns, rows)
  tiles.forEach((row, y) => {
    row.forEach((type, x) => {
      const [r, g, b] = RGB.get(type) ?? [0, 0, 0]
      const at = (y * columns + x) * 4
      image.data[at] = r
      image.data[at + 1] = g
      image.data[at + 2] = b
      image.data[at + 3] = 255
    })
  })
  context.putImageData(image, 0, 0)
}
