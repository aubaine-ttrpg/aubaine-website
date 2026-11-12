import { ARMS, ARMS_UNIFORMS } from '../../lib/art-effect/presets'
import { bakedReliefs } from './baked-relief'
import arms from './glsl/arms.frag?raw'

export const syncArms = bakedReliefs({
  held: '[data-drape="arms"]',
  called: 'a coat of arms',
  shader: arms,
  uniforms: ARMS_UNIFORMS,
  rest: ARMS.rest,
  roomYaw: ARMS.roomYaw,
  lean: ARMS.lean,
})
