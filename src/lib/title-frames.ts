import { getImage } from 'astro:assets'

import { itemImage, PLACEHOLDER_SQUARE } from './media'

export type TitlePictogram = { icon: string; ink: string }

const UNSET_PICTURE_SIZE = 192

export async function titleFrameStyle(): Promise<string> {
  const source = itemImage(PLACEHOLDER_SQUARE)
  if (!source) throw new Error(`The square placeholder ${PLACEHOLDER_SQUARE} is missing`)
  const image = await getImage({
    src: source,
    width: UNSET_PICTURE_SIZE,
    height: UNSET_PICTURE_SIZE,
    format: 'jpeg',
    quality: 82,
  })
  return `--unset-picture:url('${image.src}')`
}
