import type { Locator, Page } from 'playwright-core'
import sharp from 'sharp'

export type Grey = { data: Buffer; width: number; height: number }

export type Clip = { x: number; y: number; width: number; height: number }

export type Point = { x: number; y: number }

export type Settle = () => Promise<void>

export const LEAN_POINTERS: readonly Point[] = [0.02, 0.5, 0.98].flatMap((y) =>
  [0.02, 0.5, 0.98].map((x) => ({ x, y })),
)

export async function grey(image: Buffer): Promise<Grey> {
  const { data, info } = await sharp(image).greyscale().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

export function sharpness({ data, width, height }: Grey): number {
  let sum = 0
  let squares = 0
  let counted = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const at = y * width + x
      const laplacian =
        4 * (data[at] ?? 0) -
        (data[at - 1] ?? 0) -
        (data[at + 1] ?? 0) -
        (data[at - width] ?? 0) -
        (data[at + width] ?? 0)
      sum += laplacian
      squares += laplacian * laplacian
      counted += 1
    }
  }
  return squares / counted - (sum / counted) ** 2
}

export function sharpnessDrift(measured: Grey, reference: Grey): number {
  return Math.abs(sharpness(measured) - sharpness(reference)) / sharpness(reference)
}

export function meanDifference(a: Grey, b: Grey): number {
  let sum = 0
  for (let at = 0; at < a.data.length; at++) sum += Math.abs((a.data[at] ?? 0) - (b.data[at] ?? 0))
  return sum / a.data.length
}

export async function clipAround(piece: Locator, room: number): Promise<Clip> {
  const box = await piece.boundingBox()
  if (!box) throw new Error('the piece has no box')
  return {
    x: box.x - room,
    y: box.y - room,
    width: box.width + 2 * room,
    height: box.height + 2 * room,
  }
}

export async function leanedAndFlat(
  page: Page,
  clip: Clip,
  pointer: Point,
  settle: Settle,
): Promise<{ leaned: Grey; flat: Grey }> {
  await page.mouse.move(pointer.x, pointer.y, { steps: 8 })
  await settle()
  const leaned = await grey(await page.screenshot({ clip }))
  await page.evaluate(() => {
    const veil = document.createElement('div')
    veil.dataset['veil'] = ''
    veil.style.cssText = 'position:fixed;inset:0;z-index:2147483647'
    document.body.append(veil)
  })
  await page.mouse.move(pointer.x + 1, pointer.y)
  await page.mouse.move(pointer.x, pointer.y)
  await settle()
  const flat = await grey(await page.screenshot({ clip }))
  await page.evaluate(() => {
    for (const veil of document.querySelectorAll('[data-veil]')) veil.remove()
  })
  return { leaned, flat }
}

export async function stillAndLive(
  page: Page,
  holder: Locator,
  clip: Clip,
): Promise<{ still: Grey; live: Grey }> {
  const live = await grey(await page.screenshot({ clip }))
  await holder.evaluate(async (node) => {
    const still = node.querySelector('img')
    const canvas = node.querySelector('canvas')
    if (!still || !canvas) throw new Error('the piece has no still or no canvas')
    await still.decode()
    still.style.visibility = 'visible'
    canvas.style.visibility = 'hidden'
  })
  const still = await grey(await page.screenshot({ clip }))
  await holder.evaluate((node) => {
    node.querySelector('img')?.style.removeProperty('visibility')
    node.querySelector('canvas')?.style.removeProperty('visibility')
  })
  return { still, live }
}
