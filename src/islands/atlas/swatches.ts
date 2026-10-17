import type { TileType } from '../../lib/atlas/vocabulary'
import type { TerrainTone } from './journey'

export const TILE_SWATCHES: Record<TileType, string> = {
  deep: '#173a63',
  sea: '#22557f',
  shallows: '#3f8fa6',
  reef: '#4fb3b0',
  lake: '#3b7d9c',
  beach: '#e3cf9c',
  plains: '#8fae4f',
  meadow: '#76a04a',
  farm: '#c9b45a',
  forest: '#3f6b2c',
  taiga: '#3d5a43',
  jungle: '#2f7a2f',
  swamp: '#56603a',
  desert: '#dcae6d',
  savanna: '#c2a75a',
  badlands: '#b9643a',
  tundra: '#8e957a',
  glacier: '#e4eef6',
  mountain: '#7d766e',
  highland: '#8b8a5c',
  volcanic: '#3a302d',
  ether: '#a58fc9',
  myxo: '#3d6f6c',
  urban: '#b8aa94',
}

export function toneColour(tone: TerrainTone | undefined): string {
  if (tone === undefined) return 'var(--ink3)'
  return tone === 'underground' ? 'var(--atlas-stratum)' : TILE_SWATCHES[tone]
}
