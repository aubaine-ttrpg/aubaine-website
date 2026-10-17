export type Random = () => number

export function mulberry32(seed: number): Random {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Noise = {
  n2: (x: number, y: number) => number
  fbm: (x: number, y: number, octaves?: number) => number
  ridged: (x: number, y: number, octaves?: number) => number
}

const GRADIENT_X: readonly number[] = [1, -1, 1, -1, 1, -1, 0, 0]
const GRADIENT_Y: readonly number[] = [1, 1, -1, -1, 0, 0, 1, -1]

export function createNoise(seed: number): Noise {
  const random = mulberry32(seed)
  const base = new Uint8Array(256)
  for (let i = 0; i < 256; i++) base[i] = i
  for (let i = 255; i > 0; i--) {
    const j = (random() * (i + 1)) | 0
    const swap = base[i] ?? 0
    base[i] = base[j] ?? 0
    base[j] = swap
  }
  const perm = new Uint8Array(512)
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255] ?? 0
  const hash = (a: number, b: number) => (perm[(perm[a] ?? 0) + b] ?? 0) & 7
  const gx = (h: number) => GRADIENT_X[h] ?? 0
  const gy = (h: number) => GRADIENT_Y[h] ?? 0

  function n2(x: number, y: number): number {
    const fx = Math.floor(x)
    const fy = Math.floor(y)
    const xf = x - fx
    const yf = y - fy
    const xi = fx & 255
    const yi = fy & 255
    const h00 = hash(xi, yi)
    const h10 = hash(xi + 1, yi)
    const h01 = hash(xi, yi + 1)
    const h11 = hash(xi + 1, yi + 1)
    const g00 = gx(h00) * xf + gy(h00) * yf
    const g10 = gx(h10) * (xf - 1) + gy(h10) * yf
    const g01 = gx(h01) * xf + gy(h01) * (yf - 1)
    const g11 = gx(h11) * (xf - 1) + gy(h11) * (yf - 1)
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
    const a = g00 + u * (g10 - g00)
    const b = g01 + u * (g11 - g01)
    return (a + v * (b - a)) * 1.1
  }

  function fbm(x: number, y: number, octaves = 4): number {
    let sum = 0
    let amplitude = 1
    let frequency = 1
    let norm = 0
    for (let i = 0; i < octaves; i++) {
      sum += amplitude * n2(x * frequency + i * 17.3, y * frequency - i * 9.1)
      norm += amplitude
      amplitude *= 0.5
      frequency *= 2.02
    }
    return sum / norm
  }

  function ridged(x: number, y: number, octaves = 4): number {
    let sum = 0
    let amplitude = 1
    let frequency = 1
    let norm = 0
    for (let i = 0; i < octaves; i++) {
      const value = 1 - Math.abs(n2(x * frequency + i * 31.7, y * frequency + i * 7.7))
      sum += amplitude * value * value
      norm += amplitude
      amplitude *= 0.5
      frequency *= 2.05
    }
    return sum / norm
  }

  return { n2, fbm, ridged }
}
