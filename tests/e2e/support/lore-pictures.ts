import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { FrameKind } from '../../../src/lib/art-effect/presets'
import { type PictureLook, pictureLook } from '../../../src/lib/game/book-markup'
import { type FramePass, TEXTURE_WORKS, type TextureCut } from '../../../src/lib/rights/attribution'

export type LorePicture = { species: string; source: string; look: PictureLook | undefined }

const directory = resolve(import.meta.dirname, '../../../data/lore/species')
const PICTURE = /!\[[^\]]*]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g

export async function speciesLorePictures(): Promise<LorePicture[]> {
  const pictures: LorePicture[] = []
  for (const file of (await readdir(directory)).sort()) {
    if (!file.endsWith('.md') || file.endsWith('.en.md')) continue
    const text = await readFile(resolve(directory, file), 'utf8')
    for (const [, source = '', title] of text.matchAll(PICTURE)) {
      pictures.push({
        species: file.replace(/\.md$/, ''),
        source,
        look: title === undefined ? undefined : pictureLook(title, source),
      })
    }
  }
  return pictures
}

export async function framesBySpecies(): Promise<Map<string, Set<FrameKind>>> {
  const frames = new Map<string, Set<FrameKind>>()
  for (const { species, look } of await speciesLorePictures()) {
    if (look?.kind !== 'glazed') continue
    frames.set(species, (frames.get(species) ?? new Set()).add(look.frame))
  }
  return frames
}

export function frameFile(frame: FrameKind, pass: FramePass): RegExp {
  const cut = TEXTURE_WORKS.flatMap((work): readonly TextureCut[] => work.cuts).find(
    (each): each is Extract<TextureCut, { kind: 'frame' }> =>
      each.kind === 'frame' && each.frame === frame && each.pass === pass,
  )
  if (!cut) throw new Error(`no texture work bakes the ${pass} pass of the ${frame} frame`)
  const dot = cut.file.lastIndexOf('.')
  return new RegExp(`/${cut.file.slice(0, dot)}(?:\\.[^/.]+)?\\${cut.file.slice(dot)}`)
}
