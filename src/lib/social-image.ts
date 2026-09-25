import { getImage } from 'astro:assets'

import { artImage } from './media'

const DEFAULT_SOCIAL_ART = 'le-bastion-16_9-og.png'

export async function socialImage(ogArt: string | undefined): Promise<string | undefined> {
  const source = artImage(ogArt) ?? artImage(DEFAULT_SOCIAL_ART)
  if (!source) return undefined
  const image = await getImage({
    src: source,
    width: 1200,
    height: 630,
    format: 'jpeg',
    fit: 'cover',
  })
  return image.src
}
