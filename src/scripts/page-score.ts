export type SceneDirection = 'open' | 'close'

export type PartKey =
  | 'ghost'
  | 'kind'
  | 'rule'
  | 'badge'
  | 'name'
  | 'subtitle'
  | 'sticker'
  | 'slab'
  | 'card'
  | 'profile'
  | 'trait'

export const CARRY_MS = 400
export const SCENE_BUDGET_MS = 560

const SWAP_SHARE = 0.25
const SWAP_MS = 120
const FOLD_MS = 200
const REVEAL_SHARE = 0.45
const REVEAL_MS = 120
const GONE_MS = 100
const DEAL_STEP_MS = 6
const DEAL_MS = 200

const OPENING_AT: Record<PartKey, number> = {
  ghost: 0,
  slab: 0,
  card: 0,
  kind: 20,
  rule: 20,
  badge: 20,
  name: 20,
  subtitle: 20,
  sticker: 40,
  profile: 40,
  trait: 60,
}

const CLOSING_AT: Record<PartKey, number> = {
  trait: 0,
  sticker: 20,
  profile: 20,
  kind: 40,
  rule: 40,
  badge: 40,
  name: 40,
  subtitle: 40,
  ghost: 60,
  slab: 60,
  card: 60,
}

function startsOf(direction: SceneDirection): Record<PartKey, number> {
  return direction === 'open' ? OPENING_AT : CLOSING_AT
}

function isPartKey(key: string, starts: Record<PartKey, number>): key is PartKey {
  return key in starts
}

export function dealDelay(rank: number): number {
  return rank * DEAL_STEP_MS
}

function partStart(
  direction: SceneDirection,
  name: string,
): { key: PartKey; at: number } | undefined {
  const key = name.match(/^au-sheet-([a-z]+)-\d+$/)?.[1]
  const starts = startsOf(direction)
  if (!key || !isPartKey(key, starts)) return undefined
  return { key, at: starts[key] }
}

function dealRank(name: string): number | undefined {
  const dealt = name.match(/^au-deal-(\d+)$/)
  return dealt ? Number(dealt[1]) : undefined
}

function partRules(name: string, key: PartKey, at: number): string {
  const group = `::view-transition-group(${name}){animation-delay:${at}ms;animation-duration:${CARRY_MS}ms;animation-timing-function:var(--ease-carry)}`
  if (key === 'profile') {
    const reveal = Math.round(at + CARRY_MS * REVEAL_SHARE)
    return `${group}::view-transition-old(${name}){animation:au-part-fold ${FOLD_MS}ms var(--ease-carry) ${at}ms both}::view-transition-new(${name}){animation:au-transit-appear ${REVEAL_MS}ms linear ${reveal}ms both}`
  }
  const swap = Math.round(at + CARRY_MS * SWAP_SHARE)
  return `${group}::view-transition-old(${name}){animation:au-transit-vanish ${SWAP_MS}ms linear ${swap}ms both}::view-transition-new(${name}){animation:au-transit-appear ${SWAP_MS}ms linear ${swap}ms both}`
}

function dealRules(name: string, rank: number): string {
  return `::view-transition-image-pair(${name}){animation:au-dealt-leave ${DEAL_MS}ms var(--ease-carry) ${dealDelay(rank)}ms both}`
}

function goneRules(name: string, at: number): string {
  return `::view-transition-old(${name}){animation:au-transit-vanish ${GONE_MS}ms linear ${at}ms both}`
}

export function sceneRules(
  direction: SceneDirection,
  leaving: readonly string[],
  arriving: readonly string[],
): string {
  const landing = new Set(arriving)
  return [...new Set([...leaving, ...arriving])]
    .map((name) => {
      const rank = dealRank(name)
      if (rank !== undefined) return dealRules(name, rank)
      const part = partStart(direction, name)
      if (!part) return ''
      return landing.has(name) ? partRules(name, part.key, part.at) : goneRules(name, part.at)
    })
    .join('')
}

export function sceneEnd(direction: SceneDirection, names: Iterable<string>): number {
  return Math.max(
    0,
    ...[...names].map((name) => {
      const rank = dealRank(name)
      if (rank !== undefined) return dealDelay(rank) + DEAL_MS
      const part = partStart(direction, name)
      return part ? part.at + CARRY_MS : 0
    }),
  )
}
