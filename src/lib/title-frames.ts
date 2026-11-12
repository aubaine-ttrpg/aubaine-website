import { getImage } from 'astro:assets'

import type { PrintedBook } from './book-cover'
import { artImage, itemImage, PLACEHOLDER_SQUARE } from './media'

export type TitlePictogram = { icon: string | PrintedBook; ink: string }
export type TitlePainting = { painting: string }
export type TitleFace = TitlePictogram | TitlePainting

const FRAME_PICTURE_SIZE = 192

async function framePicture(source: ImageMetadata): Promise<string> {
  const image = await getImage({
    src: source,
    width: FRAME_PICTURE_SIZE,
    height: FRAME_PICTURE_SIZE,
    format: 'jpeg',
    quality: 82,
  })
  return `url('${image.src}')`
}

export async function titleFrameStyle(): Promise<string> {
  const source = itemImage(PLACEHOLDER_SQUARE)
  if (!source) throw new Error(`The square placeholder ${PLACEHOLDER_SQUARE} is missing`)
  return `--unset-picture:${await framePicture(source)}`
}

export async function titlePaintingStyle({ painting }: TitlePainting): Promise<string> {
  const source = artImage(painting)
  if (!source) throw new Error(`The title painting ${painting} is not in data/media/art`)
  return `--frame-painting:${await framePicture(source)}`
}
