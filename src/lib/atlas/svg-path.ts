export type SvgPath = { d: string; size: number }

const SQUARE_VIEW_BOX = /\sviewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/
const PATH_DATA = /<path\b[^>]*\sd="([^"]+)"/g

export function svgPath(svg: string): SvgPath {
  const box = SQUARE_VIEW_BOX.exec(svg)
  if (!box || box[1] !== box[2]) throw new Error('an icon file has no square viewBox from 0 0')
  if (svg.includes('fill-rule'))
    throw new Error('an icon file sets a fill rule the map cannot draw')
  const paths = Array.from(svg.matchAll(PATH_DATA), (match) => match[1])
  const [d] = paths
  if (paths.length !== 1 || !d) throw new Error(`an icon file holds ${paths.length} paths, not one`)
  return { d, size: Number(box[1]) }
}
