import type { AtlasRef } from '../world/refs.ts'

export type MapHover = { kind: 'ref'; ref: AtlasRef } | { kind: 'unexplored' }
