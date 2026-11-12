type Point = readonly [x: number, y: number]

export type BookCover = { corner: Point; across: Point; down: Point }

export const BOOK_COVERS = {
  'game-icons:black-book': {
    corner: [128.625, 46.47],
    across: [247.813, 21.593],
    down: [79.406, 306.685],
  },
} as const satisfies Record<string, BookCover>

export type CoveredBook = keyof typeof BOOK_COVERS

export type PrintedBook = { book: CoveredBook; print: string }

export type AffineMatrix = readonly [
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
]

const PRINT_SHARE_OF_COVER_WIDTH = 0.72

const lengthOf = ([x, y]: Point): number => Math.hypot(x, y)

export function printOnCoverMatrix(cover: BookCover, printSize: number): AffineMatrix {
  const acrossShare = PRINT_SHARE_OF_COVER_WIDTH
  const downShare = (acrossShare * lengthOf(cover.across)) / lengthOf(cover.down)
  const acrossStart = (1 - acrossShare) / 2
  const downStart = (1 - downShare) / 2
  const [cornerX, cornerY] = cover.corner
  const [acrossX, acrossY] = cover.across
  const [downX, downY] = cover.down
  return [
    (acrossShare / printSize) * acrossX,
    (acrossShare / printSize) * acrossY,
    (downShare / printSize) * downX,
    (downShare / printSize) * downY,
    cornerX + acrossStart * acrossX + downStart * downX,
    cornerY + acrossStart * acrossY + downStart * downY,
  ]
}
