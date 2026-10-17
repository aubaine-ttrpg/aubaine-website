import { EDGES, type Grid, hexDistance } from './grid.ts'

class MinHeap {
  private readonly values: number[] = []
  private readonly priorities: number[] = []

  get size(): number {
    return this.values.length
  }

  push(value: number, priority: number): void {
    const { values, priorities } = this
    values.push(value)
    priorities.push(priority)
    let at = values.length - 1
    while (at > 0) {
      const parent = (at - 1) >> 1
      if ((priorities[parent] ?? 0) <= priority) break
      values[at] = values[parent] ?? 0
      priorities[at] = priorities[parent] ?? 0
      at = parent
    }
    values[at] = value
    priorities[at] = priority
  }

  pop(): number {
    const { values, priorities } = this
    const top = values[0] ?? -1
    const lastValue = values.pop() ?? 0
    const lastPriority = priorities.pop() ?? 0
    if (values.length === 0) return top
    let at = 0
    for (;;) {
      const left = at * 2 + 1
      const right = left + 1
      let smallest = at
      let smallestPriority = lastPriority
      if (left < values.length && (priorities[left] ?? 0) < smallestPriority) {
        smallest = left
        smallestPriority = priorities[left] ?? 0
      }
      if (right < values.length && (priorities[right] ?? 0) < smallestPriority) {
        smallest = right
        smallestPriority = priorities[right] ?? 0
      }
      if (smallest === at) break
      values[at] = values[smallest] ?? 0
      priorities[at] = priorities[smallest] ?? 0
      at = smallest
    }
    values[at] = lastValue
    priorities[at] = lastPriority
    return top
  }
}

export type StepCost = (from: number, to: number, edge: number) => number

export function shortestPath(
  grid: Grid,
  start: number,
  goal: number,
  cost: StepCost,
  heuristicWeight: number,
): Int32Array | undefined {
  if (start < 0 || goal < 0) return undefined
  const spent = new Float64Array(grid.size).fill(Number.POSITIVE_INFINITY)
  const cameFrom = new Int32Array(grid.size).fill(-1)
  const closed = new Uint8Array(grid.size)
  const open = new MinHeap()
  spent[start] = 0
  open.push(start, 0)
  while (open.size > 0) {
    const tile = open.pop()
    if (tile === goal) break
    if (closed[tile] === 1) continue
    closed[tile] = 1
    for (let edge = 0; edge < EDGES; edge++) {
      const next = grid.neighbours[tile * EDGES + edge] ?? -1
      if (next < 0 || closed[next] === 1) continue
      const step = cost(tile, next, edge)
      if (!(step < Number.POSITIVE_INFINITY)) continue
      const total = (spent[tile] ?? 0) + step
      if (total < (spent[next] ?? Number.POSITIVE_INFINITY)) {
        spent[next] = total
        cameFrom[next] = tile
        open.push(next, total + hexDistance(grid, next, goal) * heuristicWeight)
      }
    }
  }
  if (!((spent[goal] ?? Number.POSITIVE_INFINITY) < Number.POSITIVE_INFINITY)) return undefined
  const path: number[] = []
  for (let tile = goal; tile >= 0; tile = cameFrom[tile] ?? -1) {
    path.push(tile)
    if (tile === start) break
  }
  return Int32Array.from(path.reverse())
}
