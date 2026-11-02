import { getImage } from 'astro:assets'
import { resolve } from 'node:path'
import sharp from 'sharp'

import { STAGE } from './art-effect/presets'
import { type FieldColours, fieldBackdrop } from './game/hubs'
import { artImage } from './media'

export type StageSource = { kind: 'art'; art: string } | { kind: 'field'; colours: FieldColours }

export type StageLook = { ambient: string | undefined; backdrop: string; soft: string }

const ART_DIRECTORY = 'data/media/art'
const SOFT_WIDTH = 32
const SOFT_BLUR = 3.2
const SOFT_QUALITY = 60

const softLooks = new Map<string, Promise<string>>()

async function bakeSoftLook(art: string): Promise<string> {
  const blurred = await sharp(resolve(process.cwd(), ART_DIRECTORY, art))
    .resize(STAGE.width)
    .modulate({ saturation: STAGE.saturate, brightness: STAGE.brightness })
    .blur(SOFT_BLUR)
    .toBuffer()
  const small = await sharp(blurred).resize(SOFT_WIDTH).webp({ quality: SOFT_QUALITY }).toBuffer()
  return `url('data:image/webp;base64,${small.toString('base64')}')`
}

function softLook(art: string): Promise<string> {
  const baked = softLooks.get(art) ?? bakeSoftLook(art)
  softLooks.set(art, baked)
  return baked
}

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
  if (source.kind === 'field') {
    const backdrop = fieldBackdrop(source.colours)
    const dim = `linear-gradient(rgb(0 0 0 / ${1 - STAGE.brightness}) 0 0)`
    return { ambient: undefined, backdrop, soft: `${dim}, ${backdrop}` }
  }
  const ambient = await stageAmbient(source.art)
  return { ambient, backdrop: `url('${ambient}')`, soft: await softLook(source.art) }
}
