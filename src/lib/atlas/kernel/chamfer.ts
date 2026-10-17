export function chamferDistance(distance: Float32Array, width: number, height: number): void {
  const diagonal = Math.SQRT2
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = y * width + x
      let d = distance[k] ?? 0
      if (x > 0) d = Math.min(d, (distance[k - 1] ?? 0) + 1)
      if (y > 0) {
        d = Math.min(d, (distance[k - width] ?? 0) + 1)
        if (x > 0) d = Math.min(d, (distance[k - width - 1] ?? 0) + diagonal)
        if (x < width - 1) d = Math.min(d, (distance[k - width + 1] ?? 0) + diagonal)
      }
      distance[k] = d
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const k = y * width + x
      let d = distance[k] ?? 0
      if (x < width - 1) d = Math.min(d, (distance[k + 1] ?? 0) + 1)
      if (y < height - 1) {
        d = Math.min(d, (distance[k + width] ?? 0) + 1)
        if (x < width - 1) d = Math.min(d, (distance[k + width + 1] ?? 0) + diagonal)
        if (x > 0) d = Math.min(d, (distance[k + width - 1] ?? 0) + diagonal)
      }
      distance[k] = d
    }
  }
}
