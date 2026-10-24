export type Citation = {
  document: 'SRD 5.2.1 FR' | 'SRD 5.1 EN' | 'DMG 2014'
  page: string
  table: string
}

export type LevelCurve = {
  citation: Citation
  values: readonly number[]
}

export const FIRST_LEVEL = 1
export const LAST_LEVEL = 20

export const LEVELS: readonly number[] = Array.from(
  { length: LAST_LEVEL - FIRST_LEVEL + 1 },
  (_, index) => FIRST_LEVEL + index,
)

export function atLevel(curve: LevelCurve, level: number): number {
  const value = curve.values[level - FIRST_LEVEL]
  if (value === undefined) throw new Error(`${curve.citation.table} has no level ${level}`)
  return value
}

export const SPELL_POINTS: LevelCurve = {
  citation: { document: 'DMG 2014', page: '289', table: 'Spell Points by Level' },
  values: [4, 6, 14, 17, 27, 32, 38, 44, 57, 64, 73, 73, 83, 83, 94, 94, 107, 114, 123, 133],
}

export const HIGHEST_SPELL_LEVEL: LevelCurve = {
  citation: { document: 'DMG 2014', page: '289', table: 'Spell Points by Level, Max Spell Level' },
  values: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
}

export const SLOT_COST: { citation: Citation; bySpellLevel: readonly number[] } = {
  citation: { document: 'DMG 2014', page: '288', table: 'Spell Point Cost' },
  bySpellLevel: [2, 3, 5, 6, 7, 9, 10, 11, 13],
}

export const SPELL_SLOTS: { citation: Citation; byLevel: readonly (readonly number[])[] } = {
  citation: { document: 'SRD 5.2.1 FR', page: '50', table: "Aptitudes de l'Ensorceleur" },
  byLevel: [
    [2],
    [3],
    [4, 2],
    [4, 3],
    [4, 3, 2],
    [4, 3, 3],
    [4, 3, 3, 1],
    [4, 3, 3, 2],
    [4, 3, 3, 3, 1],
    [4, 3, 3, 3, 2],
    [4, 3, 3, 3, 2, 1],
    [4, 3, 3, 3, 2, 1],
    [4, 3, 3, 3, 2, 1, 1],
    [4, 3, 3, 3, 2, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1],
  ],
}

export const SPELL_DAMAGE: {
  citation: Citation
  oneTargetD10: readonly number[]
  multipleTargetsD6: readonly number[]
} = {
  citation: { document: 'DMG 2014', page: '284', table: 'Spell Damage' },
  oneTargetD10: [2, 3, 5, 6, 8, 10, 11, 12, 15],
  multipleTargetsD6: [2, 4, 6, 7, 8, 11, 12, 13, 14],
}

export const PREPARED_SPELLS: LevelCurve = {
  citation: {
    document: 'SRD 5.2.1 FR',
    page: '59',
    table: 'Aptitudes du Magicien, Sorts préparés',
  },
  values: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
}

export const CANTRIPS: LevelCurve = {
  citation: { document: 'SRD 5.2.1 FR', page: '59', table: 'Aptitudes du Magicien, Sorts mineurs' },
  values: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
}

export const PREPARED_BY_MODIFIER: { citation: Citation } = {
  citation: { document: 'SRD 5.1 EN', page: '53', table: 'Wizard, Preparing and Casting Spells' },
}

export function preparedByModifier(intelligence: number, level: number): number {
  return Math.max(1, intelligence + level)
}

export const PROFICIENCY_BONUS: LevelCurve = {
  citation: { document: 'SRD 5.2.1 FR', page: '24', table: 'Progression des personnages' },
  values: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
}

export const HIT_DICE = ['d6', 'd8', 'd10', 'd12'] as const

export type HitDie = (typeof HIT_DICE)[number]

export const HIT_POINTS: {
  citation: Citation
  byDie: Record<HitDie, { firstLevel: number; perLevel: number }>
} = {
  citation: {
    document: 'SRD 5.2.1 FR',
    page: '24-25',
    table: 'Points de vie au niveau 1 par classe, Points de vie fixes par classe',
  },
  byDie: {
    d6: { firstLevel: 6, perLevel: 4 },
    d8: { firstLevel: 8, perLevel: 5 },
    d10: { firstLevel: 10, perLevel: 6 },
    d12: { firstLevel: 12, perLevel: 7 },
  },
}

export function hitPoints(die: HitDie, constitution: number, level: number): number {
  const { firstLevel, perLevel } = HIT_POINTS.byDie[die]
  return firstLevel + constitution + (level - 1) * (perLevel + constitution)
}

export type ChallengeRating = {
  challenge: number
  armourClass: number
  attackBonus: number
  damagePerRound: readonly [number, number]
  saveDifficulty: number
}

export const MONSTERS_BY_CHALLENGE: { citation: Citation; rows: readonly ChallengeRating[] } = {
  citation: { document: 'DMG 2014', page: '274', table: 'Monster Statistics by Challenge Rating' },
  rows: [
    { challenge: 1, armourClass: 13, attackBonus: 3, damagePerRound: [9, 14], saveDifficulty: 13 },
    { challenge: 2, armourClass: 13, attackBonus: 3, damagePerRound: [15, 20], saveDifficulty: 13 },
    { challenge: 3, armourClass: 13, attackBonus: 4, damagePerRound: [21, 26], saveDifficulty: 13 },
    { challenge: 4, armourClass: 14, attackBonus: 5, damagePerRound: [27, 32], saveDifficulty: 14 },
    { challenge: 5, armourClass: 15, attackBonus: 6, damagePerRound: [33, 38], saveDifficulty: 15 },
    { challenge: 6, armourClass: 15, attackBonus: 6, damagePerRound: [39, 44], saveDifficulty: 15 },
    { challenge: 7, armourClass: 15, attackBonus: 6, damagePerRound: [45, 50], saveDifficulty: 15 },
    { challenge: 8, armourClass: 16, attackBonus: 7, damagePerRound: [51, 56], saveDifficulty: 16 },
    { challenge: 9, armourClass: 16, attackBonus: 7, damagePerRound: [57, 62], saveDifficulty: 16 },
    {
      challenge: 10,
      armourClass: 17,
      attackBonus: 7,
      damagePerRound: [63, 68],
      saveDifficulty: 16,
    },
    {
      challenge: 11,
      armourClass: 17,
      attackBonus: 8,
      damagePerRound: [69, 74],
      saveDifficulty: 17,
    },
    {
      challenge: 12,
      armourClass: 17,
      attackBonus: 8,
      damagePerRound: [75, 80],
      saveDifficulty: 17,
    },
    {
      challenge: 13,
      armourClass: 18,
      attackBonus: 8,
      damagePerRound: [81, 86],
      saveDifficulty: 18,
    },
    {
      challenge: 14,
      armourClass: 18,
      attackBonus: 8,
      damagePerRound: [87, 92],
      saveDifficulty: 18,
    },
    {
      challenge: 15,
      armourClass: 18,
      attackBonus: 8,
      damagePerRound: [93, 98],
      saveDifficulty: 18,
    },
    {
      challenge: 16,
      armourClass: 18,
      attackBonus: 9,
      damagePerRound: [99, 104],
      saveDifficulty: 18,
    },
    {
      challenge: 17,
      armourClass: 19,
      attackBonus: 10,
      damagePerRound: [105, 110],
      saveDifficulty: 19,
    },
    {
      challenge: 18,
      armourClass: 19,
      attackBonus: 10,
      damagePerRound: [111, 116],
      saveDifficulty: 19,
    },
    {
      challenge: 19,
      armourClass: 19,
      attackBonus: 10,
      damagePerRound: [117, 122],
      saveDifficulty: 19,
    },
    {
      challenge: 20,
      armourClass: 19,
      attackBonus: 10,
      damagePerRound: [123, 140],
      saveDifficulty: 19,
    },
  ],
}

export function monsterAt(challenge: number): ChallengeRating {
  const rows = MONSTERS_BY_CHALLENGE.rows
  const clamped = Math.min(Math.max(Math.round(challenge), 1), rows.length)
  const row = rows[clamped - 1]
  if (!row) throw new Error(`no monster row for challenge ${challenge}`)
  return row
}

export const CITATIONS: readonly Citation[] = [
  SPELL_POINTS.citation,
  SLOT_COST.citation,
  SPELL_SLOTS.citation,
  SPELL_DAMAGE.citation,
  PREPARED_SPELLS.citation,
  CANTRIPS.citation,
  PREPARED_BY_MODIFIER.citation,
  PROFICIENCY_BONUS.citation,
  HIT_POINTS.citation,
  MONSTERS_BY_CHALLENGE.citation,
]
