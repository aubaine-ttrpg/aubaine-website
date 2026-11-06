import { type HexColour, isHexColour } from '../hex-colour.ts'

export const ALMANACH_ASSETS = '/almanach/v1'
export const ALMANACH_MODEL = `${ALMANACH_ASSETS}/almanach.glb`

export const ALMANACH_FINISHES = [
  'or',
  'laiton',
  'bronze',
  'cuivre',
  'or-rose',
  'rose',
  'argent',
  'fer',
  'vert-de-gris',
  'noyer',
  'chene',
  'acajou',
  'ebene',
  'palissandre',
  'merisier',
  'cuir',
  'cuir-noir',
  'cuir-bordeaux',
  'cuir-vieilli',
] as const

export type AlmanachFinishName = (typeof ALMANACH_FINISHES)[number]

export const ALMANACH_MAGICS = [
  'fire',
  'water',
  'wind',
  'earth',
  'thunder',
  'slime',
  'light',
  'void',
  'blood',
  'necrotic',
  'ether',
  'psychic',
  'nature',
] as const

export type AlmanachMagic = (typeof ALMANACH_MAGICS)[number]

export const ALMANACH_BOOTS = ['instant', 'fast', 'quick', 'original'] as const

export type AlmanachBoot = (typeof ALMANACH_BOOTS)[number]

export const ALMANACH_PAGE_BOOT = 'instant' satisfies AlmanachBoot

export const ALMANACH_CRYSTAL_BOOTS = ['instant', 'fast'] as const satisfies readonly AlmanachBoot[]

export type AlmanachCrystalBoot = (typeof ALMANACH_CRYSTAL_BOOTS)[number]

export type AlmanachColour = HexColour

export type AlmanachBattery = number | 'device' | false

export type AlmanachStyle = {
  readonly metal: AlmanachFinishName | AlmanachColour
  readonly trim: AlmanachFinishName | AlmanachColour | 'painted'
  readonly grip: AlmanachFinishName | AlmanachColour | 'painted'
  readonly gem: AlmanachColour | 'painted'
  readonly magic: AlmanachMagic | 'none'
  readonly light: AlmanachColour | 'picture'
  readonly gloss: number
  readonly metalGloss?: number
  readonly trimGloss?: number
  readonly gripGloss?: number
  readonly crystalBoot: AlmanachCrystalBoot
  readonly battery: AlmanachBattery
}

export const ALMANACH_STYLE = {
  metal: 'or',
  trim: 'painted',
  grip: 'cuir-noir',
  gem: 'painted',
  magic: 'none',
  light: 'picture',
  gloss: 0.35,
  metalGloss: 0.5,
  trimGloss: 0.5,
  gripGloss: 0,
  crystalBoot: 'fast',
  battery: false,
} as const satisfies AlmanachStyle

export const ALMANACH_FITS = ['cover', 'contain'] as const

export type AlmanachFit = (typeof ALMANACH_FITS)[number]

export const ALMANACH_FIT = 'cover' satisfies AlmanachFit

export function almanachFitOf(value: unknown): AlmanachFit {
  return ALMANACH_FITS.find((fit) => fit === value) ?? ALMANACH_FIT
}

export const ALMANACH_STYLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const PORTRAIT_PICTURE = /-3_4-[a-z0-9_]+\.(?:png|jpg)$/

export function isPortraitSource(source: string): boolean {
  return PORTRAIT_PICTURE.test(source)
}

export function isAlmanachColour(value: unknown): value is AlmanachColour {
  return isHexColour(value)
}

function isAlmanachFinishName(value: unknown): value is AlmanachFinishName {
  return ALMANACH_FINISHES.some((finish) => finish === value)
}

function isAlmanachMagic(value: unknown): value is AlmanachMagic {
  return ALMANACH_MAGICS.some((magic) => magic === value)
}

function isAlmanachCrystalBoot(value: unknown): value is AlmanachCrystalBoot {
  return ALMANACH_CRYSTAL_BOOTS.some((boot) => boot === value)
}

function isAlmanachGloss(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 1
}

function isAlmanachBattery(value: unknown): value is AlmanachBattery {
  if (value === false || value === 'device') return true
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100
}

function isCase(value: unknown): value is AlmanachStyle['metal'] {
  return isAlmanachFinishName(value) || isAlmanachColour(value)
}

function isPart(value: unknown): value is AlmanachStyle['trim'] {
  return value === 'painted' || isCase(value)
}

function isGem(value: unknown): value is AlmanachStyle['gem'] {
  return value === 'painted' || isAlmanachColour(value)
}

function isMagic(value: unknown): value is AlmanachStyle['magic'] {
  return value === 'none' || isAlmanachMagic(value)
}

function isLight(value: unknown): value is AlmanachStyle['light'] {
  return value === 'picture' || isAlmanachColour(value)
}

export const ALMANACH_STYLE_FIELDS = [
  'metal',
  'trim',
  'grip',
  'gem',
  'magic',
  'light',
  'gloss',
  'metalGloss',
  'trimGloss',
  'gripGloss',
  'crystalBoot',
  'battery',
] as const satisfies readonly (keyof AlmanachStyle)[]

function isStyleField(key: string): boolean {
  return ALMANACH_STYLE_FIELDS.some((field) => field === key)
}

function partGloss(value: unknown): { readonly ok: boolean; readonly gloss?: number } {
  if (value === undefined) return { ok: true }
  return isAlmanachGloss(value) ? { ok: true, gloss: value } : { ok: false }
}

export function almanachStyleOf(value: unknown): AlmanachStyle | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  if (!Object.keys(value).every(isStyleField)) return undefined
  const field = (key: keyof AlmanachStyle): unknown => Reflect.get(value, key)
  const metal = field('metal')
  const trim = field('trim')
  const grip = field('grip')
  const gem = field('gem')
  const magic = field('magic')
  const light = field('light')
  const gloss = field('gloss')
  const crystalBoot = field('crystalBoot')
  const battery = field('battery')
  const metalGloss = partGloss(field('metalGloss'))
  const trimGloss = partGloss(field('trimGloss'))
  const gripGloss = partGloss(field('gripGloss'))
  if (
    !isCase(metal) ||
    !isPart(trim) ||
    !isPart(grip) ||
    !isGem(gem) ||
    !isMagic(magic) ||
    !isLight(light) ||
    !isAlmanachGloss(gloss) ||
    !isAlmanachCrystalBoot(crystalBoot) ||
    !isAlmanachBattery(battery) ||
    !metalGloss.ok ||
    !trimGloss.ok ||
    !gripGloss.ok
  ) {
    return undefined
  }
  return {
    metal,
    trim,
    grip,
    gem,
    magic,
    light,
    gloss,
    ...(metalGloss.gloss === undefined ? {} : { metalGloss: metalGloss.gloss }),
    ...(trimGloss.gloss === undefined ? {} : { trimGloss: trimGloss.gloss }),
    ...(gripGloss.gloss === undefined ? {} : { gripGloss: gripGloss.gloss }),
    crystalBoot,
    battery,
  }
}
