import type { ContentStatus } from './schema.ts'

export type BadgedStatus = Exclude<ContentStatus, 'balanced'>

const PROVISIONAL_RANK: Record<ContentStatus, number> = {
  draft: 0,
  playtest: 1,
  beta: 2,
  balanced: 3,
}

export function mostProvisional(
  values: Iterable<ContentStatus | undefined>,
): ContentStatus | undefined {
  let found: ContentStatus | undefined
  for (const value of values) {
    if (!value) continue
    if (!found || PROVISIONAL_RANK[value] < PROVISIONAL_RANK[found]) found = value
  }
  return found
}

export function inheritedStatus(
  own: ContentStatus | undefined,
  rungs: (ContentStatus | undefined)[][],
): ContentStatus | undefined {
  if (own) return own
  for (const rung of rungs) {
    const found = mostProvisional(rung)
    if (found) return found
  }
  return undefined
}

export function badgedStatus(status: ContentStatus | undefined): BadgedStatus | undefined {
  return status && status !== 'balanced' ? status : undefined
}
