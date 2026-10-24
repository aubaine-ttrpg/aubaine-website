export type Amount = { count: number; sides: number; flat: number }

export type Distribution = ReadonlyMap<number, number>

const DIE_FACES = 20

export function parseAmount(text: string): Amount {
  const dice = /^(\d+)d(\d+)$/.exec(text)
  if (dice) return { count: Number(dice[1]), sides: Number(dice[2]), flat: 0 }
  if (/^\d+$/.test(text)) return { count: 0, sides: 0, flat: Number(text) }
  throw new Error(`« ${text} » is neither dice nor a number`)
}

export function mean(amount: Amount): number {
  return (amount.count * (amount.sides + 1)) / 2 + amount.flat
}

export function distribution(amount: Amount): Distribution {
  let totals = new Map<number, number>([[amount.flat, 1]])
  for (let die = 0; die < amount.count; die += 1) {
    const next = new Map<number, number>()
    for (const [total, chance] of totals) {
      for (let face = 1; face <= amount.sides; face += 1) {
        next.set(total + face, (next.get(total + face) ?? 0) + chance / amount.sides)
      }
    }
    totals = next
  }
  return totals
}

export function expectedValue(totals: Distribution, value: (total: number) => number): number {
  let sum = 0
  for (const [total, chance] of totals) sum += chance * value(total)
  return sum
}

export function meanHalvedDown(amount: Amount): number {
  return expectedValue(distribution(amount), (total) => Math.floor(total / 2))
}

export function keptFaceChance(face: number, edge: number): number {
  const dice = Math.abs(edge) + 1
  if (edge >= 0) return (face / DIE_FACES) ** dice - ((face - 1) / DIE_FACES) ** dice
  return ((DIE_FACES + 1 - face) / DIE_FACES) ** dice - ((DIE_FACES - face) / DIE_FACES) ** dice
}

export function criticalChance(edge: number): number {
  return keptFaceChance(DIE_FACES, edge)
}

export function successChance(bonus: number, defence: number, edge: number): number {
  let chance = 0
  for (let face = 1; face <= DIE_FACES; face += 1) {
    const succeeds = face === DIE_FACES || (face > 1 && face + bonus >= defence)
    if (succeeds) chance += keptFaceChance(face, edge)
  }
  return chance
}

export type AttackRoll = {
  bonus: number
  armourClass: number
  edge: number
  damage: Amount
  characteristic: number
}

export function attackDamage(attack: AttackRoll): number {
  const critical = criticalChance(attack.edge)
  const hit = successChance(attack.bonus, attack.armourClass, attack.edge) - critical
  const ordinary = mean(attack.damage) + attack.characteristic
  return hit * ordinary + critical * 2 * ordinary
}

export type SavingThrow = {
  saveBonus: number
  difficulty: number
  edge: number
  damage: Amount
  halfOnSuccess: boolean
}

export function savedDamage(save: SavingThrow): number {
  const critical = criticalChance(save.edge)
  const success = successChance(save.saveBonus, save.difficulty, save.edge) - critical
  const failure = 1 - success - critical
  const half = save.halfOnSuccess ? meanHalvedDown(save.damage) : 0
  return failure * mean(save.damage) + success * half
}
