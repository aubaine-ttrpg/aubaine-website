import { describe, expect, it } from 'vitest'

import {
  type AffineMatrix,
  BOOK_COVERS,
  type BookCover,
  printOnCoverMatrix,
} from '../../src/lib/book-cover'
import { SPECIES_SECTION_ICONS } from '../../src/lib/game/derive'
import { inlinePrintedBook } from '../../src/lib/media'

const PRINT_SIZE = 512
const CLEAR_BORDER = 0.1

const PRINT_CORNERS = [
  [0, 0],
  [PRINT_SIZE, 0],
  [0, PRINT_SIZE],
  [PRINT_SIZE, PRINT_SIZE],
] as const

function mapped([a, b, c, d, e, f]: AffineMatrix, [x, y]: readonly [number, number]) {
  return [a * x + c * y + e, b * x + d * y + f] as const
}

function onCover(cover: BookCover, [x, y]: readonly [number, number]) {
  const [ax, ay] = cover.across
  const [dx, dy] = cover.down
  const offsetX = x - cover.corner[0]
  const offsetY = y - cover.corner[1]
  const determinant = ax * dy - ay * dx
  return {
    across: (offsetX * dy - offsetY * dx) / determinant,
    down: (ax * offsetY - ay * offsetX) / determinant,
  }
}

describe('a print on a book cover', () => {
  for (const [book, cover] of Object.entries(BOOK_COVERS)) {
    const matrix = printOnCoverMatrix(cover, PRINT_SIZE)

    it(`keeps every corner of the print on the ${book} cover, clear of its border`, () => {
      for (const corner of PRINT_CORNERS) {
        const point = onCover(cover, mapped(matrix, corner))
        expect(point.across).toBeGreaterThanOrEqual(CLEAR_BORDER)
        expect(point.across).toBeLessThanOrEqual(1 - CLEAR_BORDER)
        expect(point.down).toBeGreaterThanOrEqual(CLEAR_BORDER)
        expect(point.down).toBeLessThanOrEqual(1 - CLEAR_BORDER)
      }
    })

    it(`slants the print with the ${book} cover and centres it`, () => {
      const [a, b, c, d] = matrix
      expect(a * cover.across[1] - b * cover.across[0]).toBeCloseTo(0, 9)
      expect(c * cover.down[1] - d * cover.down[0]).toBeCloseTo(0, 9)
      const centre = onCover(cover, mapped(matrix, [PRINT_SIZE / 2, PRINT_SIZE / 2]))
      expect(centre.across).toBeCloseTo(0.5, 9)
      expect(centre.down).toBeCloseTo(0.5, 9)
    })

    it(`draws the print as long down the ${book} cover as across it`, () => {
      const [a, b, c, d] = matrix
      expect(Math.hypot(c, d)).toBeCloseTo(Math.hypot(a, b), 9)
    })
  }

  it('draws the book and its print as one pictogram, the print inside the transformed group', () => {
    const printed = SPECIES_SECTION_ICONS.playing
    const svg = inlinePrintedBook(printed, 'probe')
    expect(svg.match(/<svg/g)).toHaveLength(1)
    expect(svg).toContain('class="probe" aria-hidden="true" focusable="false"')
    const group = /<g transform="matrix\(([^)]*)\)">([\s\S]*)<\/g><\/svg>/.exec(svg)
    expect(group?.[1]?.split(' ').map(Number)).toEqual([
      ...printOnCoverMatrix(BOOK_COVERS[printed.book], PRINT_SIZE),
    ])
    expect(group?.[2]).toMatch(/^<path fill="currentColor" d="M/)
  })
})
