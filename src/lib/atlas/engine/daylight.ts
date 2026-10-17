import { Color, type DirectionalLight, type FogExp2, SRGBColorSpace, Vector3 } from 'three'
import { smoothstep } from '../world/smoothstep.ts'
import { blackbody, type StarLight, type StarSystem, starLights } from '../world/stars.ts'
import type { SharedUniforms } from './materials/uniforms.ts'
import type { GradeUniforms } from './post.ts'

export type Lights = {
  key: DirectionalLight
  fills: readonly DirectionalLight[]
  fog: FogExp2
  uniforms: SharedUniforms
  grade: GradeUniforms
  bloomThreshold: { value: number }
}

export type SkyLight = { environmentIntensity: number }

type Source = { direction: Vector3; colour: Color; intensity: number }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const srgb = (r: number, g: number, b: number) => new Color().setRGB(r, g, b, SRGBColorSpace)

const KEY_NOON = 3.2
const NOON_HOUR = 12
const ADAPTED_LUX = 40000
const MAX_EXPOSURE = 256
const MIN_SHADING_ELEVATION = 0.08
const SKY_HORIZON = 0.005
const SKY_HIGH = 0.15
const TWILIGHT_DEGREES = 2.9
const DISC_PEAK = 40
const DISC_MIN_RADIUS = 0.35
const MOON_INTENSITY = 0.5
const ENVIRONMENT_DAY = 0.8 / Math.PI
const ENVIRONMENT_NIGHT = 0.55 / Math.PI
const DAY_EXPOSURE = 1.08
const NIGHT_EXPOSURE = 2.5
const DAY_SATURATION = 1.16
const NIGHT_SATURATION = 0.85
const UNDERGROUND_SATURATION = 1.04
const NIGHT_LUX = { low: Math.log10(3), high: Math.log10(1000) }
const SHADOW_DOMINANCE = { low: 1.2, high: 2.5 }

const UNDERGROUND_FOG = srgb(0.045, 0.04, 0.055)
const UNDERGROUND_LIGHT = new Vector3(-0.35, 0.85, 0.4).normalize()
const NIGHT_LIGHT = new Vector3(-0.35, 0.8, 0.45).normalize()
const MOON_COLOUR = srgb(0.5, 0.6, 1)
const WHITE = new Color(1, 1, 1)
const UNDERGROUND_SKY = new Color(0.55, 0.5, 0.62)
const UNDERGROUND_GROUND = new Color(0.2, 0.15, 0.12)
const DAY_TINT = new Vector3(1.02, 1, 0.98)
const GOLDEN_TINT = new Vector3(1.06, 1, 0.92)
const NIGHT_TINT = new Vector3(0.94, 0.97, 1.08)
const UNDERGROUND_TINT = new Vector3(1.04, 0.98, 0.94)
const NIGHT_LIFT = new Vector3(0, 0.004, 0.012)
const DAY_BLOOM_THRESHOLD = 1
const NIGHT_BLOOM_THRESHOLD = 0.72

const PALETTE = {
  top: { day: srgb(0.32, 0.55, 0.9), gold: srgb(0.3, 0.38, 0.72), night: srgb(0.012, 0.018, 0.06) },
  horizon: { day: srgb(0.68, 0.8, 0.94), gold: srgb(1, 0.7, 0.5), night: srgb(0.07, 0.08, 0.17) },
  low: { day: srgb(0.5, 0.58, 0.7), gold: srgb(0.58, 0.46, 0.52), night: srgb(0.04, 0.045, 0.09) },
} as const

const goldOf = (sine: number) => smoothstep(-0.12, 0.08, sine) * (1 - smoothstep(0.2, 0.55, sine))
const glowOf = (sine: number) => smoothstep(-0.16, 0.04, sine)
const skyOf = (sine: number) =>
  sine >= 0
    ? SKY_HORIZON + (SKY_HIGH - SKY_HORIZON) * smoothstep(0, 0.7, sine)
    : SKY_HORIZON * 10 ** ((Math.asin(sine) * 180) / Math.PI / TWILIGHT_DEGREES)

function shadingDirection(direction: readonly number[]): Vector3 {
  const [x = 0, y = 0, z = 0] = direction
  return y < MIN_SHADING_ELEVATION
    ? new Vector3(x, MIN_SHADING_ELEVATION, z).normalize()
    : new Vector3(x, y, z)
}

function apply(light: DirectionalLight, source: Source | undefined): void {
  if (!source) {
    light.intensity = 0
    return
  }
  light.color.copy(source.colour)
  light.intensity = source.intensity
  light.position.copy(source.direction)
}

export class Daylight {
  private readonly system: StarSystem
  private readonly noonLux: number
  private readonly tints: readonly Color[]

  constructor(system: StarSystem) {
    this.system = system
    const noon = starLights(system, NOON_HOUR, 0.5)
    const primary = noon[0]
    this.noonLux = primary?.illuminance ?? 1
    const base = blackbody(system.primary.temperature)
    this.tints = [system.primary, system.warm, system.hot].map((star) => {
      const colour = blackbody(star.temperature)
      return new Color(colour[0] / base[0], colour[1] / base[1], colour[2] / base[2])
    })
  }

  surface(lights: Lights, hour: number, season: number, cloudShadows: boolean): SkyLight {
    const stars = starLights(this.system, hour, season)
    const horizontal = this.horizontal(stars)
    const brightest = Math.max(...stars.map((star) => star.illuminance))
    const exposure = Math.min(MAX_EXPOSURE, Math.max(1, ADAPTED_LUX / Math.max(brightest, 1e-6)))
    const night =
      1 - smoothstep(NIGHT_LUX.low, NIGHT_LUX.high, Math.log10(Math.max(horizontal, 1e-6)))
    const sources: Source[] = stars.map((star) => ({
      direction: shadingDirection(star.direction),
      colour: new Color(...star.colour),
      intensity: (KEY_NOON * star.illuminance * exposure) / this.noonLux,
    }))
    sources.push({
      direction: NIGHT_LIGHT.clone(),
      colour: MOON_COLOUR.clone(),
      intensity: MOON_INTENSITY * night,
    })
    const ranked = [...sources].sort((a, b) => b.intensity - a.intensity)
    const [key, ...rest] = ranked
    apply(lights.key, key)
    for (const [index, fill] of lights.fills.entries()) apply(fill, rest[index])
    const second = rest[0]?.intensity ?? 0
    lights.key.shadow.intensity = smoothstep(
      SHADOW_DOMINANCE.low,
      SHADOW_DOMINANCE.high,
      (key?.intensity ?? 0) / Math.max(second, 1e-6),
    )
    const keyStar = stars.find((_, index) => sources[index] === key)
    const keyGold = keyStar ? goldOf(keyStar.direction[1]) : 0
    this.writeSky(lights, stars, exposure)
    this.writeStars(lights.uniforms, stars, exposure, night)
    const { uniforms, grade } = lights
    uniforms.uNight.value = night
    uniforms.uSunDir.value.copy(key?.direction ?? NIGHT_LIGHT)
    uniforms.uSunCol.value.copy(key?.colour ?? MOON_COLOUR)
    const level = sources.reduce((sum, source) => sum + source.intensity, 0) / KEY_NOON
    uniforms.uSunInt.value = lerp(0.25 + 0.75 * Math.min(1, level), 0.32, night)
    lights.fills.forEach((fill, index) => {
      uniforms.uFillDir.value[index]?.copy(fill.position)
      uniforms.uFillCol.value[index]
        ?.set(fill.color.r, fill.color.g, fill.color.b)
        .multiplyScalar(fill.intensity / KEY_NOON)
    })
    grade.uExpo.value = lerp(DAY_EXPOSURE, NIGHT_EXPOSURE, night) * lerp(1, 1.04, keyGold)
    grade.uSat.value = lerp(DAY_SATURATION, NIGHT_SATURATION, night)
    grade.uTint.value
      .copy(DAY_TINT)
      .lerp(GOLDEN_TINT, smoothstep(0.2, 0.4, keyGold))
      .lerp(NIGHT_TINT, smoothstep(0.4, 0.6, night))
    grade.uLift.value.copy(NIGHT_LIFT).multiplyScalar(night)
    lights.bloomThreshold.value = lerp(DAY_BLOOM_THRESHOLD, NIGHT_BLOOM_THRESHOLD, night)
    uniforms.uCloudSh.value = cloudShadows ? lerp(1, 0.2, night) : 0
    return { environmentIntensity: lerp(ENVIRONMENT_DAY, ENVIRONMENT_NIGHT, night) }
  }

  private horizontal(stars: readonly StarLight[]): number {
    let total = 0
    for (const star of stars) {
      const sine = star.direction[1]
      const top = star.illuminance > 0 ? star.illuminance : 0
      total += top * Math.max(sine, 0)
      total += star.outside * skyOf(sine)
    }
    return total
  }

  private writeSky(lights: Lights, stars: readonly StarLight[], exposure: number): void {
    const top = new Color(0, 0, 0)
    const horizon = new Color(0, 0, 0)
    const low = new Color(0, 0, 0)
    let presence = 0
    stars.forEach((star, index) => {
      const sine = star.direction[1]
      const weight = glowOf(sine) * Math.min(1, (star.outside / this.noonLux) * exposure)
      if (weight <= 0) return
      presence += weight
      const gold = goldOf(sine)
      const tint = this.tints[index] ?? new Color(1, 1, 1)
      top.add(
        PALETTE.top.day
          .clone()
          .lerp(PALETTE.top.gold, gold * 0.8)
          .multiply(tint)
          .multiplyScalar(weight),
      )
      horizon.add(
        PALETTE.horizon.day
          .clone()
          .lerp(PALETTE.horizon.gold, gold)
          .multiply(tint)
          .multiplyScalar(weight),
      )
      low.add(
        PALETTE.low.day.clone().lerp(PALETTE.low.gold, gold).multiply(tint).multiplyScalar(weight),
      )
    })
    const dark = Math.max(0, 1 - presence)
    top.add(PALETTE.top.night.clone().multiplyScalar(dark))
    horizon.add(PALETTE.horizon.night.clone().multiplyScalar(dark))
    low.add(PALETTE.low.night.clone().multiplyScalar(dark))
    const { uniforms, fog } = lights
    uniforms.uSkyTop.value.copy(top)
    uniforms.uSkyHor.value.copy(horizon)
    uniforms.uSkyLow.value.copy(low)
    uniforms.uGround.value.copy(low).multiplyScalar(0.6)
    uniforms.uAmbient.value.copy(WHITE)
    const fogColour = horizon.clone().lerp(top, 0.3)
    uniforms.uFogColor.value.copy(fogColour)
    fog.color.copy(fogColour)
  }

  private writeStars(
    uniforms: SharedUniforms,
    stars: readonly StarLight[],
    exposure: number,
    night: number,
  ): void {
    const reference = this.system.primary.diameter / 2
    stars.forEach((star, index) => {
      const displayed = Math.max(star.radius, DISC_MIN_RADIUS)
      const share = (star.illuminance / this.noonLux) * exposure
      const disc = DISC_PEAK * share * (reference / displayed) ** 2
      uniforms.uStarDir.value[index]?.set(...star.direction)
      uniforms.uStarDisc.value[index]?.set(
        star.colour[0] * disc,
        star.colour[1] * disc,
        star.colour[2] * disc,
        Math.cos((displayed * Math.PI) / 180),
      )
      uniforms.uStarGlow.value[index]
        ?.set(...star.colour)
        .multiplyScalar(share * (1 - night * 0.85))
    })
  }
}

export function lightUnderground(lights: Lights): SkyLight {
  const { uniforms, key, fog, grade } = lights
  uniforms.uNight.value = 0.7
  uniforms.uSunDir.value.copy(UNDERGROUND_LIGHT)
  uniforms.uSunCol.value.setRGB(1, 0.8, 0.6)
  uniforms.uSunInt.value = 0.5
  uniforms.uSkyTop.value.copy(UNDERGROUND_SKY)
  uniforms.uSkyHor.value.copy(UNDERGROUND_SKY)
  uniforms.uSkyLow.value.copy(UNDERGROUND_SKY)
  uniforms.uAmbient.value.copy(UNDERGROUND_SKY)
  uniforms.uGround.value.copy(UNDERGROUND_GROUND)
  uniforms.uFogColor.value.copy(UNDERGROUND_FOG)
  for (const disc of uniforms.uStarDisc.value) disc.set(0, 0, 0, 1)
  for (const glow of uniforms.uStarGlow.value) glow.set(0, 0, 0)
  for (const colour of uniforms.uFillCol.value) colour.set(0, 0, 0)
  fog.color.copy(UNDERGROUND_FOG)
  key.color.setRGB(1, 0.82, 0.62)
  key.intensity = 1.5
  key.position.copy(UNDERGROUND_LIGHT)
  key.shadow.intensity = 1
  for (const fill of lights.fills) fill.intensity = 0
  grade.uExpo.value = 1.62
  grade.uSat.value = UNDERGROUND_SATURATION
  grade.uTint.value.copy(UNDERGROUND_TINT)
  grade.uLift.value.set(0, 0, 0)
  lights.bloomThreshold.value = NIGHT_BLOOM_THRESHOLD
  uniforms.uCloudSh.value = 0
  return { environmentIntensity: 0.7 / Math.PI }
}

export function undergroundFog(): Color {
  return UNDERGROUND_FOG.clone()
}
