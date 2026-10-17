export const SLOW_FRAME_MS = 25
export const JUDGED_FRAMES = 20

function median(values: readonly number[]): number {
  return [...values].sort((a, b) => a - b)[values.length >> 1] ?? 0
}

export class PaceCheck {
  private readonly intervals: number[] = []
  private previous: number | undefined
  private judged = false

  restart(): void {
    this.intervals.length = 0
    this.previous = undefined
    this.judged = false
  }

  findsSlow(now: number, moving: boolean): boolean {
    if (this.judged) return false
    if (!moving) {
      this.previous = undefined
      return false
    }
    const previous = this.previous
    this.previous = now
    if (previous === undefined) return false
    this.intervals.push(now - previous)
    if (this.intervals.length < JUDGED_FRAMES) return false
    this.judged = true
    return median(this.intervals) > SLOW_FRAME_MS
  }
}
