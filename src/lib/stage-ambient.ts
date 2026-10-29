import { getImage } from 'astro:assets'

import { STAGE } from './art-effect/presets'
import { type FieldColours, fieldBackdrop } from './game/hubs'
import { artImage } from './media'

export type StageSource = { kind: 'art'; art: string } | { kind: 'field'; colours: FieldColours }

export type StageLook = { ambient: string | undefined; backdrop: string }

export function stageSource(cover: string | undefined, colours: FieldColours): StageSource {
  return cover ? { kind: 'art', art: cover } : { kind: 'field', colours }
}

export async function stageAmbient(art: string): Promise<string> {
  const image = artImage(art)
  if (!image) throw new Error(`a stage names ${art}, which is not in data/media/art/`)
  const ambient = await getImage({ src: image, width: STAGE.width, format: 'webp', quality: 60 })
  return ambient.src
}

export async function stageLook(source: StageSource): Promise<StageLook> {
  if (source.kind === 'field')
    return { ambient: undefined, backdrop: fieldBackdrop(source.colours) }
  const ambient = await stageAmbient(source.art)
  return { ambient, backdrop: `url('${ambient}')` }
}
