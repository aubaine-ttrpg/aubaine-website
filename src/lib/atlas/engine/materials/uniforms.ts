import { Color, type IUniform, type Texture, Vector2, Vector3, Vector4 } from 'three'
import { ROUTE_LAYERS } from '../../contract/display.ts'
import { MAX_SKY_LANES } from '../../contract/parchment.ts'
import { HALF_SQRT3 } from '../../world/grid.ts'

export const OFF_GRID = -999
export const STARS = 3
export const FILLS = 2

export type SharedUniforms = {
  uTime: IUniform<number>
  uNoise: IUniform<Texture | null>
  uWaterN: IUniform<Texture | null>
  uNight: IUniform<number>
  uSunDir: IUniform<Vector3>
  uSunCol: IUniform<Color>
  uSunInt: IUniform<number>
  uSkyTop: IUniform<Color>
  uSkyHor: IUniform<Color>
  uSkyLow: IUniform<Color>
  uGround: IUniform<Color>
  uAmbient: IUniform<Color>
  uStarDir: IUniform<Vector3[]>
  uStarDisc: IUniform<Vector4[]>
  uStarGlow: IUniform<Vector3[]>
  uFillDir: IUniform<Vector3[]>
  uFillCol: IUniform<Vector3[]>
  uFogColor: IUniform<Color>
  uFogDensity: IUniform<number>
  uCloudSh: IUniform<number>
  uCloudOp: IUniform<number>
  uData: IUniform<Texture | null>
  uGridO: IUniform<Vector2>
  uGridEdge: IUniform<Vector2>
  uHover: IUniform<Vector2>
  uGrid: IUniform<number>
  uBorders: IUniform<number>
  uSelColor: IUniform<Color>
  uPScale: IUniform<number>
  uHeight: IUniform<Texture | null>
  uMapRect: IUniform<Vector4>
  uUnder: IUniform<number>
  uSkyData: IUniform<Texture | null>
  uHoverSky: IUniform<Vector2>
  uReveal: IUniform<Texture | null>
  uRevealRect: IUniform<Vector4>
  uInMist: IUniform<number>
  uParchment: IUniform<Texture | null>
  uParchmentRoutes: IUniform<Texture | null>
  uGlyphs: IUniform<Texture | null>
  uGlyphsOn: IUniform<number>
  uLanes: IUniform<Vector4[]>
  uLaneCount: IUniform<number>
  uShowRoute: IUniform<number[]>
}

export function createUniforms(originX: number, originZ: number): SharedUniforms {
  return {
    uTime: { value: 0 },
    uNoise: { value: null },
    uWaterN: { value: null },
    uNight: { value: 0 },
    uSunDir: { value: new Vector3(0.5, 0.6, 0.3).normalize() },
    uSunCol: { value: new Color(1, 0.9, 0.8) },
    uSunInt: { value: 1 },
    uSkyTop: { value: new Color() },
    uSkyHor: { value: new Color() },
    uSkyLow: { value: new Color() },
    uGround: { value: new Color() },
    uAmbient: { value: new Color(1, 1, 1) },
    uStarDir: { value: Array.from({ length: STARS }, () => new Vector3(0, 1, 0)) },
    uStarDisc: { value: Array.from({ length: STARS }, () => new Vector4(0, 0, 0, 1)) },
    uStarGlow: { value: Array.from({ length: STARS }, () => new Vector3()) },
    uFillDir: { value: Array.from({ length: FILLS }, () => new Vector3(0, 1, 0)) },
    uFillCol: { value: Array.from({ length: FILLS }, () => new Vector3()) },
    uFogColor: { value: new Color() },
    uFogDensity: { value: 0.003 },
    uCloudSh: { value: 1 },
    uCloudOp: { value: 1 },
    uData: { value: null },
    uGridO: { value: new Vector2(originX, originZ) },
    uGridEdge: { value: new Vector2(originX + HALF_SQRT3, originZ + 1) },
    uHover: { value: new Vector2(OFF_GRID, OFF_GRID) },
    uGrid: { value: 0 },
    uBorders: { value: 1 },
    uSelColor: { value: new Color(1.0, 0.74, 0.12) },
    uPScale: { value: 600 },
    uHeight: { value: null },
    uMapRect: { value: new Vector4(0, 0, 1, 1) },
    uUnder: { value: 0 },
    uSkyData: { value: null },
    uHoverSky: { value: new Vector2(OFF_GRID, OFF_GRID) },
    uReveal: { value: null },
    uRevealRect: { value: new Vector4(0, 0, 1, 1) },
    uInMist: { value: 0 },
    uParchment: { value: null },
    uParchmentRoutes: { value: null },
    uGlyphs: { value: null },
    uGlyphsOn: { value: 0 },
    uLanes: { value: Array.from({ length: MAX_SKY_LANES }, () => new Vector4()) },
    uLaneCount: { value: 0 },
    uShowRoute: { value: ROUTE_LAYERS.map(() => 1) },
  }
}
