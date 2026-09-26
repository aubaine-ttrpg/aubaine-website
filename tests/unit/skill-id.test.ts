import { describe, expect, it } from 'vitest'

import {
  collisionShifts,
  type HeldSkill,
  idLetters,
  idNumber,
  resolveSkillId,
  sharedSkillIdLetters,
  skillId,
  skillIdLetters,
  titleWords,
} from '../../tools/skill-id/derive'

describe('the letters of a skill id', () => {
  it('shares six letters evenly between the words of the French title', () => {
    expect(skillIdLetters('Surchauffe')).toBe('SURCHA')
    expect(skillIdLetters('Mur de pierre')).toBe('MURPIE')
    expect(skillIdLetters('Aviver les flammes')).toBe('AVIFLA')
    expect(skillIdLetters('Grand tour de passe-passe')).toBe('GRTOPP')
  })

  it('drops the small words and keeps an accented word that only looks like one', () => {
    expect(titleWords('Pas de la montagne')).toEqual(['PAS', 'MONTAGNE'])
    expect(skillIdLetters('Pied sûr')).toBe('PIESUR')
    expect(skillIdLetters("Mot à l'oreille")).toBe('MOTORE')
  })

  it('writes the letters without accents and spells out the ligatures', () => {
    expect(skillIdLetters('TOUT BRÛLER')).toBe('TOUBRU')
    expect(skillIdLetters("Chef-d'œuvre")).toBe('CHEOEU')
  })

  it('passes the letters a short word cannot give to the next word', () => {
    expect(skillIdLetters('Os de géant')).toBe('OSGEAN')
    expect(skillIdLetters("Pluie d'or")).toBe('PLUIOR')
    expect(skillIdLetters('Or pur')).toBe('ORPURX')
  })

  it('pads a title shorter than six letters with X', () => {
    expect(skillIdLetters('Rage')).toBe('RAGEXX')
    expect(skillIdLetters('Envol')).toBe('ENVOLX')
  })

  it('names a title shared across trees by its initials and its owner', () => {
    expect(sharedSkillIdLetters('Détection primordiale', 'Feu')).toBe('DPFEUX')
    expect(sharedSkillIdLetters('Détection primordiale', 'Foudre')).toBe('DPFOUD')
    expect(sharedSkillIdLetters('Étendue martiale', 'Eau')).toBe('EMEAUX')
    expect(sharedSkillIdLetters('Étendue martiale', 'Terre')).toBe('EMTERR')
  })

  it('moves a newcomer along its last word when its letters are taken', () => {
    expect(collisionShifts('Bousculade').slice(0, 2)).toEqual(['BOUSCL', 'BOUSCA'])
    expect(collisionShifts('Marque de chair')[0]).toBe('MARCHI')
    expect(collisionShifts('Improvisation')[0]).toBe('IMPROI')
    expect(collisionShifts('Surcharge')[0]).toBe('SURCHR')
  })
})

describe('resolving a title against the skills that exist', () => {
  const held: HeldSkill[] = [
    { id: 'COURRO-001', title: 'Courroux' },
    { id: 'COURRO-002', title: 'Courroux: Brutalité', evolvesFrom: 'COURRO-001' },
    { id: 'SURCHA-001', title: 'Surchauffe' },
    { id: 'DPFEUX-001', title: 'Détection primordiale' },
  ]

  it('gives a new title its plain letters', () => {
    expect(resolveSkillId('Mur de pierre', held)).toEqual({ kind: 'free', id: 'MURPIE-001' })
  })

  it('does not count a derived skill as holding its base letters against the base', () => {
    expect(resolveSkillId('Courroux', held)).toEqual({ kind: 'existing', id: 'COURRO-001' })
  })

  it('shifts a newcomer whose letters another title holds', () => {
    expect(resolveSkillId('Surcharge', held)).toMatchObject({ kind: 'shifted', id: 'SURCHR-001' })
  })

  it('refuses to reuse a title without naming the tree that owns the new copy', () => {
    expect(resolveSkillId('Détection primordiale', held)).toMatchObject({ kind: 'titled' })
    expect(resolveSkillId('Détection primordiale', held, 'Vent')).toEqual({
      kind: 'free',
      id: 'DPVENT-001',
    })
  })
})

describe('the number of a skill id', () => {
  it('writes three digits after the letters', () => {
    expect(skillId('COURRO', 1)).toBe('COURRO-001')
    expect(skillId('COURRO', 4)).toBe('COURRO-004')
  })

  it('reads the letters and the number back', () => {
    expect(idLetters('CONDRU-003')).toBe('CONDRU')
    expect(idNumber('CONDRU-003')).toBe(3)
  })
})
