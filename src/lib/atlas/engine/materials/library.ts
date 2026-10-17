import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  FrontSide,
  type IUniform,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  ShaderMaterial,
  type Side,
  Texture,
  Vector2,
  Vector3,
} from 'three'
import type { TierSettings } from '../../contract/quality.ts'
import {
  type BeamSpec,
  MAX_BLEND,
  type ParticleLook,
  type PieceMaterial,
  type PropFamily,
  type Rgb,
} from '../../contract/scene.ts'
import { WIND } from '../../contract/wind.ts'
import { MIST } from '../../kernel/mist.ts'
import { NO_TILE } from '../../world/grid.ts'
import beaconRingFragment from './glsl/beacon-ring.frag?raw'
import beamFragment from './glsl/beam.frag?raw'
import beamVertex from './glsl/beam.vert?raw'
import birdsFragment from './glsl/birds.frag?raw'
import birdsVertex from './glsl/birds.vert?raw'
import bump from './glsl/bump.glsl?raw'
import cloudsFragment from './glsl/clouds.frag?raw'
import cloudsVertex from './glsl/clouds.vert?raw'
import commonBody from './glsl/common.glsl?raw'
import decalFragment from './glsl/decal.frag?raw'
import decalVertex from './glsl/decal.vert?raw'
import glowFragment from './glsl/glow.frag?raw'
import glowVertex from './glsl/glow.vert?raw'
import laneFragment from './glsl/lane.frag?raw'
import laneVertex from './glsl/lane.vert?raw'
import mistFragment from './glsl/mist.frag?raw'
import mistVertex from './glsl/mist.vert?raw'
import mistDepthFragment from './glsl/mist-depth.frag?raw'
import particlesFragment from './glsl/particles.frag?raw'
import particlesVertex from './glsl/particles.vert?raw'
import poolFragment from './glsl/pool.frag?raw'
import poolVertex from './glsl/pool.vert?raw'
import propFragment from './glsl/prop.glsl?raw'
import propVertex from './glsl/prop-vertex.glsl?raw'
import riverFragment from './glsl/river.frag?raw'
import riverVertex from './glsl/river.vert?raw'
import routeSurface from './glsl/route-surface.glsl?raw'
import skyDomeFragment from './glsl/sky-dome.frag?raw'
import skyDomeVertex from './glsl/sky-dome.vert?raw'
import terrainTop from './glsl/terrain-top.glsl?raw'
import terrainWall from './glsl/terrain-wall.glsl?raw'
import travelPathFragment from './glsl/travel-path.frag?raw'
import travelPathVertex from './glsl/travel-path.vert?raw'
import underWaterFragment from './glsl/under-water.frag?raw'
import uvWorldVertex from './glsl/uv-world.vert?raw'
import veil from './glsl/veil.glsl?raw'
import vortexFragment from './glsl/vortex.frag?raw'
import waterFragment from './glsl/water.frag?raw'
import waterfallFragment from './glsl/waterfall.frag?raw'
import worldPositionVertex from './glsl/world-position.vert?raw'
import { editShader } from './patch.ts'
import type { SharedUniforms } from './uniforms.ts'

const wind = `const vec2 WIND = vec2(${WIND.x}, ${WIND.z});\n`
const common = wind + veil + commonBody

const DETAIL_DEFINES: Record<TierSettings['shaderDetail'], Defines> = {
  reduced: { DETAIL_REDUCED: '' },
  full: {},
  rich: { DETAIL_RICH: '' },
}

export type WorldConstants = { columns: number; rows: number; originZ: number }

const SEABED: Rgb = [0.3, 0.35, 0.33]
const RAIL_METAL = 0x9aa0a8
const SEA_LANE = 0xfff3d2
const SKY_LANE = 0xc39bff
const BEACON = 0xffcf4a
const TRAVEL = 0x6fe3ff
const LIGHT_POOL = 0xff9a4a

const float = (value: number) => (Number.isInteger(value) ? `${value}.0` : String(value))

type Defines = Record<string, string>

export class MaterialLibrary {
  readonly uniforms: SharedUniforms
  private readonly defines: Defines
  private readonly pieces = new Map<
    PieceMaterial,
    MeshStandardMaterial | MeshBasicMaterial | ShaderMaterial
  >()
  private readonly props = new Map<string, MeshStandardMaterial>()
  private readonly builtUniforms = new Set<Record<string, IUniform>>()

  constructor(
    uniforms: SharedUniforms,
    constants: WorldConstants,
    detail: TierSettings['shaderDetail'],
  ) {
    this.uniforms = uniforms
    this.defines = {
      W_: float(constants.columns),
      H_: float(constants.rows),
      Z0_: constants.originZ.toFixed(3),
      NO_TILE_: float(NO_TILE),
      ...DETAIL_DEFINES[detail],
    }
  }

  piece(key: PieceMaterial): MeshStandardMaterial | MeshBasicMaterial | ShaderMaterial {
    const known = this.pieces.get(key)
    if (known) return known
    const made = this.makePiece(key)
    this.pieces.set(key, made)
    return made
  }

  prop(family: PropFamily, doubleSided: boolean): MeshStandardMaterial {
    const key = `${family}:${doubleSided ? 'double' : 'front'}`
    const known = this.props.get(key)
    if (known) return known
    const made = this.makeProp(family === 'cutout', doubleSided)
    this.props.set(key, made)
    return made
  }

  setDetail(detail: TierSettings['shaderDetail']): void {
    const levels = Object.values(DETAIL_DEFINES).flatMap((defines) => Object.keys(defines))
    for (const material of this.all()) {
      const defines: Record<string, unknown> = { ...material.defines, ...DETAIL_DEFINES[detail] }
      for (const name of levels) if (!(name in DETAIL_DEFINES[detail])) delete defines[name]
      material.defines = defines
      material.needsUpdate = true
    }
  }

  all(): (MeshStandardMaterial | MeshBasicMaterial | ShaderMaterial)[] {
    return [...this.pieces.values(), ...this.props.values()]
  }

  dispose(): void {
    for (const material of this.all()) material.dispose()
    const shared = new Set<Texture>()
    for (const uniforms of this.builtUniforms) {
      const lut = uniforms['dfgLUT']?.value
      if (lut instanceof Texture) shared.add(lut)
    }
    for (const texture of shared) texture.dispose()
    this.builtUniforms.clear()
    this.pieces.clear()
    this.props.clear()
  }

  private makePiece(key: PieceMaterial): MeshStandardMaterial | MeshBasicMaterial | ShaderMaterial {
    switch (key) {
      case 'terrain-top':
        return this.top('TERRAIN_SURFACE', 'surface')
      case 'sky-top':
        return this.top('TERRAIN_SKY', 'sky')
      case 'under-top':
        return this.top('TERRAIN_UNDER', 'under')
      case 'terrain-wall':
        return this.wall('WALL_SURFACE', 'surface')
      case 'under-wall':
        return this.wall('WALL_UNDER', 'under')
      case 'tunnel':
        return new MeshBasicMaterial({ vertexColors: true, side: DoubleSide })
      case 'water':
        return this.water(false)
      case 'abyss':
        return this.water(true)
      case 'mist-depth':
        return this.mistDepth()
      case 'mist':
        return this.shader(mistVertex, common + mistFragment, {
          transparent: true,
          depthWrite: true,
          side: DoubleSide,
          defines: {
            MIST_ONSET_: float(MIST.onset),
            MIST_HAZE_LOW_: float(MIST.haze.low),
            MIST_HAZE_HIGH_: float(MIST.haze.high),
            MIST_DENSITY_: float(MIST.density),
            MIST_SETTLE_: float(MIST.settle),
            MIST_PATH_: float(MIST.path),
            MIST_MELT_FROM_: float(MIST.melt.from),
            MIST_MELT_TO_: float(MIST.melt.to),
          },
        })
      case 'under-water':
        return this.shader(worldPositionVertex, common + underWaterFragment, {
          transparent: true,
          depthWrite: false,
        })
      case 'road':
        return this.route('ROUTE_ROAD')
      case 'trail':
        return this.route('ROUTE_TRAIL')
      case 'ballast':
        return this.route('ROUTE_BALLAST')
      case 'rail':
        return new MeshStandardMaterial({
          color: RAIL_METAL,
          metalness: 0.9,
          roughness: 0.32,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          polygonOffsetUnits: -8,
        })
      case 'sea-lane':
        return this.lane(SEA_LANE, false)
      case 'sky-lane':
        return this.lane(SKY_LANE, true)
      case 'river':
        return this.shader(riverVertex, common + riverFragment, {
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -6,
        })
      case 'waterfall':
        return this.shader(uvWorldVertex, common + waterfallFragment, {
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
        })
      case 'sky-fall':
        return this.shader(uvWorldVertex, common + waterfallFragment, {
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
          defines: { FALL_FADES: '' },
        })
    }
  }

  private shader(
    vertexShader: string,
    fragmentShader: string,
    options: {
      transparent?: boolean
      depthWrite?: boolean
      side?: Side
      additive?: boolean
      polygonOffset?: boolean
      polygonOffsetFactor?: number
      polygonOffsetUnits?: number
      defines?: Defines
      extra?: Record<string, { value: unknown }>
    } = {},
  ): ShaderMaterial {
    return new ShaderMaterial({
      uniforms: { ...this.uniforms, ...options.extra },
      vertexShader,
      fragmentShader,
      defines: { ...this.defines, ...options.defines },
      transparent: options.transparent ?? false,
      depthWrite: options.depthWrite ?? true,
      side: options.side ?? FrontSide,
      blending: options.additive ? AdditiveBlending : NormalBlending,
      polygonOffset: options.polygonOffset ?? false,
      polygonOffsetFactor: options.polygonOffsetFactor ?? 0,
      polygonOffsetUnits: options.polygonOffsetUnits ?? 0,
    })
  }

  private top(variant: string, name: string): MeshStandardMaterial {
    const material = new MeshStandardMaterial({ roughness: 0.9, metalness: 0 })
    material.defines = { ...this.defines, [variant]: '', MAX_BLEND_: float(MAX_BLEND) }
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)
      this.builtUniforms.add(shader.uniforms)
      shader.vertexShader = editShader(shader.vertexShader, [
        {
          chunk: 'common',
          with: 'after',
          code: 'attribute vec4 aBio;\nflat varying vec2 vBiome;\nvarying vec2 vBlendAo;\nvarying vec3 vW;\nvarying vec3 vWN;',
        },
        {
          chunk: 'project_vertex',
          with: 'after',
          code: 'vBiome = aBio.xy;\nvBlendAo = vec2(aBio.z / 255.0 * MAX_BLEND_, aBio.w / 255.0);\nvec4 atlasWorld = modelMatrix * vec4(transformed, 1.0);\nvW = atlasWorld.xyz;\nvWN = normalize(mat3(modelMatrix) * objectNormal);',
        },
      ])
      shader.fragmentShader = editShader(shader.fragmentShader, [
        { chunk: 'common', with: 'after', code: common + terrainTop },
        {
          chunk: 'fog_fragment',
          with: 'replace',
          code: 'gl_FragColor.rgb = atlasFog(gl_FragColor.rgb, vW);',
        },
        {
          chunk: 'map_fragment',
          with: 'replace',
          code: 'vec3 tCol; float tRough; vec3 tEmis; float tBump;\nterrainShade(tCol, tRough, tEmis, tBump);\ndiffuseColor.rgb = tCol;',
        },
        {
          chunk: 'roughnessmap_fragment',
          with: 'replace',
          code: 'float roughnessFactor = tRough;',
        },
        { chunk: 'normal_fragment_maps', with: 'after', code: bump },
        { chunk: 'emissivemap_fragment', with: 'after', code: 'totalEmissiveRadiance += tEmis;' },
      ])
    }
    material.customProgramCacheKey = () => `atlas-top-${name}`
    return material
  }

  private wall(variant: string, name: string): MeshStandardMaterial {
    const material = new MeshStandardMaterial({ roughness: 0.88, metalness: 0, side: DoubleSide })
    material.defines = { ...this.defines, [variant]: '' }
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)
      this.builtUniforms.add(shader.uniforms)
      shader.vertexShader = editShader(shader.vertexShader, [
        {
          chunk: 'common',
          with: 'after',
          code: 'attribute vec4 aWall;\nattribute float aLip;\nflat varying vec2 vOwner;\nvarying vec2 vLipAo;\nvarying vec3 vW;\nvarying vec3 vWN;',
        },
        {
          chunk: 'project_vertex',
          with: 'after',
          code: 'vOwner = vec2(aWall.x, aWall.y + aWall.z * 256.0);\nvLipAo = vec2(aLip, aWall.w / 255.0);\nvec4 atlasWorld = modelMatrix * vec4(transformed, 1.0);\nvW = atlasWorld.xyz;\nvWN = normalize(mat3(modelMatrix) * objectNormal);',
        },
      ])
      shader.fragmentShader = editShader(shader.fragmentShader, [
        { chunk: 'common', with: 'after', code: common + terrainWall },
        {
          chunk: 'fog_fragment',
          with: 'replace',
          code: 'gl_FragColor.rgb = atlasFog(gl_FragColor.rgb, vW);',
        },
        {
          chunk: 'map_fragment',
          with: 'replace',
          code: 'vec3 tCol; float tRough; vec3 tEmis; float tBump;\nwallShade(tCol, tRough, tEmis, tBump);\ndiffuseColor.rgb = tCol;',
        },
        {
          chunk: 'roughnessmap_fragment',
          with: 'replace',
          code: 'float roughnessFactor = tRough;',
        },
        { chunk: 'normal_fragment_maps', with: 'after', code: bump },
        { chunk: 'emissivemap_fragment', with: 'after', code: 'totalEmissiveRadiance += tEmis;' },
      ])
    }
    material.customProgramCacheKey = () => `atlas-wall-${name}`
    return material
  }

  private mistDepth(): ShaderMaterial {
    const material = this.shader(mistVertex, mistDepthFragment, {
      transparent: true,
      depthWrite: true,
      side: DoubleSide,
    })
    material.colorWrite = false
    return material
  }

  private water(abyss: boolean): ShaderMaterial {
    return this.shader(worldPositionVertex, common + waterFragment, {
      transparent: true,
      depthWrite: true,
      defines: abyss ? { WATER_ABYSS: '' } : {},
      extra: { uSeabed: { value: new Vector3(...SEABED) } },
    })
  }

  private route(variant: string): MeshStandardMaterial {
    const material = new MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    })
    material.defines = { ...this.defines, [variant]: '' }
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)
      this.builtUniforms.add(shader.uniforms)
      shader.vertexShader = editShader(shader.vertexShader, [
        { chunk: 'common', with: 'after', code: 'varying vec2 vRUv;\nvarying vec3 vRW;' },
        {
          chunk: 'project_vertex',
          with: 'after',
          code: 'vRUv = uv;\nvRW = (modelMatrix * vec4(transformed, 1.0)).xyz;',
        },
      ])
      shader.fragmentShader = editShader(shader.fragmentShader, [
        { chunk: 'common', with: 'after', code: common + routeSurface },
        {
          chunk: 'fog_fragment',
          with: 'replace',
          code: 'gl_FragColor.rgb = atlasFog(gl_FragColor.rgb, vRW);',
        },
        { chunk: 'map_fragment', with: 'replace', code: 'routeShade(diffuseColor);' },
      ])
    }
    material.customProgramCacheKey = () => `atlas-route-${variant}`
    return material
  }

  private lane(colour: number, dots: boolean): ShaderMaterial {
    return this.shader(laneVertex, laneFragment, {
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      additive: dots,
      defines: dots ? { LANE_DOTS: '' } : {},
      extra: { uColor: { value: new Color(colour) } },
    })
  }

  private makeProp(cutout: boolean, doubleSided: boolean): MeshStandardMaterial {
    const material = new MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0,
      side: doubleSided ? DoubleSide : FrontSide,
    })
    material.defines = { ...this.defines, ...(cutout ? { PROP_CUTOUT: '' } : {}) }
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)
      this.builtUniforms.add(shader.uniforms)
      shader.vertexShader = editShader(shader.vertexShader, [
        { chunk: 'common', with: 'after', code: wind + propVertex },
        {
          chunk: 'beginnormal_vertex',
          with: 'after',
          code: 'vec3 propAt = propOrigin();\nif (propRotates()) objectNormal.xy = propRotor(propAt) * objectNormal.xy;',
        },
        {
          chunk: 'begin_vertex',
          with: 'after',
          code: [
            'vKind = aColour.w;',
            'vLocal = position;',
            'vIP = propAt;',
            'vColour = propLinear(aColour.rgb / 255.0);',
            '#ifdef USE_INSTANCING',
            'vColour *= propLinear(aTint.rgb);',
            '#endif',
            'if (propRotates()) transformed.xy = propRotor(propAt) * transformed.xy;',
            'if (propLeafy() || propCloth()) transformed += propWindShift(propAt, position, objectNormal);',
          ].join('\n'),
        },
        {
          chunk: 'project_vertex',
          with: 'after',
          code: [
            'vec4 propWorld = vec4(transformed, 1.0);',
            '#ifdef USE_INSTANCING',
            'propWorld = instanceMatrix * propWorld;',
            '#endif',
            'propWorld = modelMatrix * propWorld;',
            'vW = propWorld.xyz;',
            'vWN = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);',
          ].join('\n'),
        },
      ])
      shader.fragmentShader = editShader(shader.fragmentShader, [
        { chunk: 'common', with: 'after', code: common + propFragment },
        {
          chunk: 'fog_fragment',
          with: 'replace',
          code: 'gl_FragColor.rgb = atlasFog(gl_FragColor.rgb, vW);',
        },
        {
          chunk: 'color_fragment',
          with: 'after',
          code: 'float pRough, pMetal, tBump;\nvec3 pEmis;\nvec3 pc = diffuseColor.rgb * vColour;\npropShade(pc, pRough, pMetal, pEmis, tBump);\ndiffuseColor.rgb = pc;',
        },
        {
          chunk: 'roughnessmap_fragment',
          with: 'replace',
          code: 'float roughnessFactor = pRough;',
        },
        {
          chunk: 'metalnessmap_fragment',
          with: 'replace',
          code: 'float metalnessFactor = pMetal;',
        },
        {
          chunk: 'emissivemap_fragment',
          with: 'after',
          code: 'totalEmissiveRadiance += pEmis * (0.7 + uNight * 0.6);',
        },
      ])
    }
    material.customProgramCacheKey = () =>
      `atlas-prop-${cutout ? 'cutout' : 'solid'}-${doubleSided ? 'double' : 'front'}`
    return material
  }

  skyDome(environment: boolean): ShaderMaterial {
    const material = this.shader(skyDomeVertex, veil + skyDomeFragment, {
      depthWrite: false,
      side: BackSide,
      defines: environment ? { SKY_ENVIRONMENT: '' } : {},
    })
    material.fog = false
    return material
  }

  clouds(): ShaderMaterial {
    return this.shader(wind + cloudsVertex, veil + cloudsFragment, {
      transparent: true,
      depthWrite: false,
    })
  }

  birds(): ShaderMaterial {
    return this.shader(birdsVertex, veil + birdsFragment, { side: DoubleSide })
  }

  glows(): ShaderMaterial {
    return this.shader(glowVertex, glowFragment, {
      transparent: true,
      depthWrite: false,
      additive: true,
    })
  }

  vehicleDecals(): ShaderMaterial {
    return this.shader(decalVertex, decalFragment, { transparent: true, depthWrite: false })
  }

  lightPools(): ShaderMaterial {
    return this.shader(poolVertex, poolFragment, {
      transparent: true,
      depthWrite: false,
      additive: true,
      extra: { uColor: { value: new Color(LIGHT_POOL) } },
    })
  }

  particles(spec: ParticleLook): ShaderMaterial {
    const style =
      spec.style === 'smoke'
        ? { PARTICLE_SMOKE: '' }
        : spec.style === 'spark'
          ? { PARTICLE_SPARK: '' }
          : {}
    return this.shader(particlesVertex, particlesFragment, {
      transparent: true,
      depthWrite: false,
      additive: spec.additive,
      defines: { ...style, ...(spec.nightOnly ? { PARTICLE_NIGHT: '' } : {}) },
      extra: {
        uLife: { value: spec.life },
        uVel: { value: new Vector3(...spec.velocity) },
        uSpread: { value: new Vector3(...spec.spread) },
        uGrav: { value: spec.gravity },
        uSize: { value: new Vector2(...spec.size) },
        uTurb: { value: spec.turbulence },
        uC0: { value: new Vector3(...spec.colour) },
        uC1: { value: new Vector3(...spec.fade) },
        uAlpha: { value: spec.alpha },
      },
    })
  }

  beam(spec: Pick<BeamSpec, 'colour' | 'intensity' | 'scroll' | 'night'>): ShaderMaterial {
    return this.shader(beamVertex, beamFragment, {
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      additive: true,
      extra: {
        uColor: { value: new Vector3(...spec.colour) },
        uInt: { value: spec.intensity },
        uNightMul: { value: spec.night },
        uScroll: { value: spec.scroll },
      },
    })
  }

  vortex(colour: Rgb): ShaderMaterial {
    return this.shader(laneVertex, vortexFragment, {
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      additive: true,
      extra: { uColor: { value: new Vector3(...colour) } },
    })
  }

  beaconRing(): ShaderMaterial {
    return this.shader(laneVertex, beaconRingFragment, {
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      additive: true,
      extra: { uColor: { value: new Color(BEACON) } },
    })
  }

  beaconBeam(): ShaderMaterial {
    const colour = new Color(BEACON)
    return this.beam({
      colour: [colour.r, colour.g, colour.b],
      intensity: 1.1,
      scroll: 0.5,
      night: 0,
    })
  }

  travelPath(): ShaderMaterial {
    return this.shader(travelPathVertex, travelPathFragment, {
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      additive: true,
      extra: { uColor: { value: new Color(TRAVEL) } },
    })
  }

  travelPin(): ShaderMaterial {
    const colour = new Color(TRAVEL)
    return this.beam({
      colour: [colour.r, colour.g, colour.b],
      intensity: 1.4,
      scroll: 0.6,
      night: 0,
    })
  }
}
