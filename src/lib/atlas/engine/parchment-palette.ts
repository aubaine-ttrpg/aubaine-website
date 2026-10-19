import {
  ROCKS,
  type Rock,
  SETTINGS,
  type Setting,
  TILE_TYPES,
  type TileType,
} from '../vocabulary.ts'

export const TILE_WASHES: Readonly<Record<TileType, string>> = {
  deep: '#5d89ae',
  sea: '#7ba4c3',
  shallows: '#a2c5cd',
  reef: '#8fc5b9',
  lake: '#87b1c8',
  beach: '#e9dcb4',
  plains: '#d8d6a1',
  meadow: '#c9d197',
  farm: '#e1cf8e',
  forest: '#9db487',
  taiga: '#90a58b',
  jungle: '#8baf7b',
  swamp: '#a7ab89',
  desert: '#ebd4a0',
  savanna: '#dccd93',
  badlands: '#d8a685',
  tundra: '#c8cab9',
  glacier: '#e5ebee',
  mountain: '#bbb1a1',
  highland: '#c7be9c',
  volcanic: '#a1958c',
  ether: '#c4b6da',
  myxo: '#a5bdb4',
  urban: '#d6c5ad',
}

export const SETTING_WASHES: Readonly<Record<Setting, string>> = {
  rock: '#b7ac9e',
  cavern: '#d8cbb1',
  mine: '#c9b699',
  crystal: '#c7bddf',
  lava: '#df9f80',
  ice: '#d9e5ea',
  fungal: '#b7c9b3',
  built: '#d4c4a5',
  lake: '#87b1c8',
  tunnel: '#d1c4a8',
  roots: '#c2b393',
}

export const ROCK_WASHES: Readonly<Record<Rock, string>> = {
  granite: '#a7a199',
  limestone: '#bcb4a1',
  sandstone: '#c3a888',
  basalt: '#8e8985',
  schist: '#a59eb4',
  permafrost: '#bec7cb',
  marble: '#cec9c1',
}

export const PARCHMENT_INKS = {
  paper: '#efe2c3',
  ink: '#3a2a1c',
  mark: '#6b2416',
  water: '#2f4f66',
  sky: '#5d4a7a',
  mist: '#f4efe6',
  lamp: '#ffdcae',
} as const

export const WASH_ORDER: readonly string[] = [
  ...TILE_TYPES.map((type) => TILE_WASHES[type]),
  ...SETTINGS.map((setting) => SETTING_WASHES[setting]),
  ...ROCKS.map((rock) => ROCK_WASHES[rock]),
]
