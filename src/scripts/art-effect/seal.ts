import { SEAL, SEAL_UNIFORMS } from '../../lib/art-effect/seal-look'
import { bakedReliefs } from './baked-relief'
import seal from './glsl/seal.frag?raw'

const WAX_TONES = ['waxDeep', 'waxPale'] as const

function toneOf(holder: HTMLElement, name: (typeof WAX_TONES)[number]): number[] {
  const tone = (holder.dataset[name] ?? '').split(' ').map(Number)
  if (tone.length !== 3 || tone.some((channel) => !Number.isFinite(channel))) {
    throw new Error(`a wax seal names no ${name} tone`)
  }
  return tone
}

export const syncSeals = bakedReliefs({
  held: '[data-drape="seal"]',
  called: 'a wax seal',
  shader: seal,
  uniforms: SEAL_UNIFORMS,
  heldUniforms: (holder) => ({
    uWaxDeep: toneOf(holder, 'waxDeep'),
    uWaxPale: toneOf(holder, 'waxPale'),
  }),
  rest: SEAL.rest,
  roomYaw: SEAL.roomYaw,
  lean: SEAL.lean,
})
