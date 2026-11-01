const SMALL_WORD = 3
export const WIDEST_ADVANCE = 0.8

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
