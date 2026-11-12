import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ARMS, ARMS_SIZE, ARMS_UNIFORMS, armsFiles } from '../../src/lib/art-effect/presets.ts'
import {
  SEAL,
  SEAL_UNIFORMS,
  sealFiles,
  waxShades,
  waxUniforms,
} from '../../src/lib/art-effect/seal-look.ts'
import { type ReliefMapFiles, reliefFragment, type StillScene } from './relief-bake.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const ARMS_DIR = resolve(root, 'data/media/arms')
export const SEALS_DIR = resolve(root, 'data/media/seals')

function reliefMaps(files: ReliefMapFiles): StillScene['maps'] {
  return [
    { uniform: 'uColour', file: files.colour, colour: true },
    { uniform: 'uRelief', file: files.relief, colour: false },
    { uniform: 'uFinish', file: files.finish, colour: false },
  ]
}

export async function armsStillScene(composition: string): Promise<StillScene> {
  return {
    size: ARMS_SIZE,
    maps: reliefMaps(armsFiles(composition)),
    fragment: await reliefFragment('relief.glsl', 'arms.frag'),
    roomYaw: ARMS.roomYaw,
    lean: ARMS.lean,
    eye: ARMS.rest,
    uniforms: ARMS_UNIFORMS,
  }
}

export async function sealStillScene(
  emblem: string,
  wax: string,
  width: number,
): Promise<StillScene> {
  return {
    size: { width, height: width },
    maps: reliefMaps(sealFiles(emblem)),
    fragment: await reliefFragment('relief.glsl', 'seal.frag'),
    roomYaw: SEAL.roomYaw,
    lean: SEAL.lean,
    eye: SEAL.rest,
    uniforms: { ...SEAL_UNIFORMS, ...waxUniforms(waxShades(wax)) },
  }
}
