const SMALL_WORD = 3
const SMALL_PLATE_SCALE = 0.42
const SMALL_PLATE_PADDING = 0.6
const PLATE_GAP = 0.16
export const WIDEST_ADVANCE = 0.8
export const AVERAGE_ADVANCE = 0.74
export const PLATE_PADDING = 0.4

export type Plate = { word: string; small: boolean }

export function letters(text: string): number {
  return Math.max(1, [...text].length)
}

export function platesOf(title: string): Plate[] {
  const words = title.split(/\s+/).filter(Boolean)
  return words.map((word) => ({ word, small: letters(word) <= SMALL_WORD && words.length > 1 }))
}

export function longestWord(title: string): number {
  const words = title.split(/\s+/).filter((word) => letters(word) > SMALL_WORD)
  return Math.max(1, ...words.map(letters))
}

export function fitLetters(names: readonly string[], padding: number): string {
  if (names.length === 0) throw new Error('fitLetters needs at least one name')
  const longest = Math.max(...names.map((name) => longestWord(name)))
  return (WIDEST_ADVANCE * longest + padding).toFixed(2)
}

function plateWidth({ word, small }: Plate, padding: number): number {
  const width = AVERAGE_ADVANCE * letters(word)
  return small ? (width + SMALL_PLATE_PADDING) * SMALL_PLATE_SCALE : width + padding
}

export function lineWidth(title: string, padding: number): number {
  const plates = platesOf(title)
  const widths = plates.reduce((sum, plate) => sum + plateWidth(plate, padding), 0)
  return widths + PLATE_GAP * (plates.length - 1)
}

export function fitLine(names: readonly string[], padding: number): string {
  if (names.length === 0) throw new Error('fitLine needs at least one name')
  return Math.max(...names.map((name) => lineWidth(name, padding))).toFixed(2)
}
