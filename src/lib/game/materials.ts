import type { Environment, Material } from './schema.ts'

export type LootRow = { roll: string; slug: string; material: Material; quantity: number }

export type Place = {
  slug: string
  environment: Environment
  rolls: { roll: string; quantity: number }[]
}

export function rollOf(from: number, to: number): string {
  return from === to ? String(from) : `${from}-${to}`
}

export function lootRows(environment: Environment, materials: Map<string, Material>): LootRow[] {
  return environment.loot.map((row) => {
    const material = materials.get(row.material)
    if (!material) {
      throw new Error(`${environment.name} loots ${row.material}, which is not a material`)
    }
    return { roll: rollOf(row.from, row.to), slug: row.material, material, quantity: row.quantity }
  })
}

export function placesOf(slug: string, environments: Map<string, Environment>): Place[] {
  return [...environments].flatMap(([environmentSlug, environment]) => {
    const rolls = environment.loot
      .filter((row) => row.material === slug)
      .map((row) => ({ roll: rollOf(row.from, row.to), quantity: row.quantity }))
    return rolls.length > 0 ? [{ slug: environmentSlug, environment, rolls }] : []
  })
}
