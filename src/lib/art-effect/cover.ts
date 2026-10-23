export type Size = { width: number; height: number }

export type Point = { x: number; y: number }

export type CoverWindow = { scale: Point; offset: Point }

export type Backing = Size & { density: number }

const PERCENT_PAIR = /^(-?\d+(?:\.\d+)?)% (-?\d+(?:\.\d+)?)%$/

export function objectPosition(value: string): Point {
  const found = PERCENT_PAIR.exec(value.trim())
  if (!found)
    throw new Error(`a graded plate needs its object-position in percentages, not "${value}"`)
  return { x: Number(found[1]) / 100, y: Number(found[2]) / 100 }
}

export function coverWindow(box: Size, natural: Size, position: Point): CoverWindow {
  const fit = Math.max(box.width / natural.width, box.height / natural.height)
  const shown = { width: natural.width * fit, height: natural.height * fit }
  return {
    scale: { x: box.width / shown.width, y: box.height / shown.height },
    offset: {
      x: -((box.width - shown.width) * position.x) / shown.width,
      y: -((box.height - shown.height) * position.y) / shown.height,
    },
  }
}

export function backingSize(
  box: Size,
  ratio: number,
  scale: number,
  budget: number,
  limit: number,
): Backing {
  const width = box.width * scale
  const height = box.height * scale
  const density = Math.min(
    ratio,
    Math.sqrt(budget / (width * height)),
    limit / width,
    limit / height,
  )
  return {
    width: Math.max(1, Math.round(width * density)),
    height: Math.max(1, Math.round(height * density)),
    density,
  }
}

export function blurLevel(width: number, fraction: number): number {
  return Math.max(0, Math.log2((width * fraction) / 0.8))
}

export type PaintScale = {
  source: number
  shown: number
  widest: number
  coarser: number
  levels: number
}

export function paintLevel({ source, shown, widest, coarser, levels }: PaintScale): number {
  const capped = Math.max(0, Math.ceil(Math.log2(source / widest)))
  const enough = Math.max(0, Math.floor(Math.log2(source / shown)))
  return Math.min(levels - 1, Math.max(capped, enough) + coarser)
}

export type Region = Point & Size

export function frameIndex(milliseconds: number, perSecond: number): number {
  return Math.floor((milliseconds * perSecond) / 1000)
}

export function printRegion(drawn: Size, buffer: Size): Region {
  return { x: 0, y: buffer.height - drawn.height, width: drawn.width, height: drawn.height }
}
