export const TIERS = ['low', 'high', 'ultra'] as const
export type Tier = (typeof TIERS)[number]

export const QUALITY_CHOICES = ['auto', ...TIERS] as const
export type QualityChoice = (typeof QUALITY_CHOICES)[number]

export type TierSettings = {
  renderScale: number
  terrainRings: number
  shadowMapSize: number
  shadowRadius: number
  antialias: 'fxaa' | 'msaa'
  bloomLevels: number
  bloomScale: number
  propDensity: number
  nearDetail: number
  shaderDetail: 'reduced' | 'full' | 'rich'
  particleShare: number
  clouds: 'reduced' | 'all'
  birds: boolean
}

export const TIER_SETTINGS: Record<Tier, TierSettings> = {
  low: {
    renderScale: 0.75,
    terrainRings: 3,
    shadowMapSize: 0,
    shadowRadius: 0,
    antialias: 'fxaa',
    bloomLevels: 3,
    bloomScale: 0.25,
    propDensity: 0.5,
    nearDetail: 0,
    shaderDetail: 'reduced',
    particleShare: 0.3,
    clouds: 'reduced',
    birds: false,
  },
  high: {
    renderScale: 0.9,
    terrainRings: 4,
    shadowMapSize: 2048,
    shadowRadius: 1.5,
    antialias: 'msaa',
    bloomLevels: 5,
    bloomScale: 0.5,
    propDensity: 0.85,
    nearDetail: 1,
    shaderDetail: 'full',
    particleShare: 0.7,
    clouds: 'all',
    birds: true,
  },
  ultra: {
    renderScale: 1,
    terrainRings: 5,
    shadowMapSize: 4096,
    shadowRadius: 2,
    antialias: 'msaa',
    bloomLevels: 5,
    bloomScale: 0.5,
    propDensity: 1,
    nearDetail: 1.5,
    shaderDetail: 'rich',
    particleShare: 1,
    clouds: 'all',
    birds: true,
  },
}

export const MAX_PIXEL_RATIO = 2

export type GpuReport = { renderer: string; cores: number; coarsePointer: boolean }

const LOW_END = [
  /swiftshader/i,
  /llvmpipe/i,
  /software/i,
  /intel.*\b(hd|uhd)\b/i,
  /mali/i,
  /adreno.*\b[3-5]\d\d\b/i,
]

export function automaticTier(report: GpuReport): Tier {
  if (LOW_END.some((pattern) => pattern.test(report.renderer))) return 'low'
  if (report.cores > 0 && report.cores <= (report.coarsePointer ? 4 : 2)) return 'low'
  return report.coarsePointer ? 'high' : 'ultra'
}

export function stepDown(tier: Tier): Tier {
  return tier === 'ultra' ? 'high' : 'low'
}

export function isQualityChoice(value: unknown): value is QualityChoice {
  return QUALITY_CHOICES.some((choice) => choice === value)
}
