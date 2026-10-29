const FIELD_SIZE = 256
const FIELD_NIGHT = '#06050d'
const FIELD_GROUND = 0.4
const FIELD_SPOT = 0.8
const FIELD_SPOTS = [
  [0.28, 0.3],
  [0.74, 0.66],
  [0.58, 0.16],
  [0.2, 0.78],
] as const

function resolvedColour(colour: string, within: HTMLElement): string {
  const previous = within.style.color
  within.style.color = colour
  const resolved = getComputedStyle(within).color
  within.style.color = previous
  return resolved
}

export function paintField(colours: readonly string[], within: HTMLElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = FIELD_SIZE
  canvas.height = FIELD_SIZE
  const context = canvas.getContext('2d')
  if (!context) return ''
  const resolved = colours.map((colour) => resolvedColour(colour, within))
  const first = resolved[0] ?? FIELD_NIGHT
  context.fillStyle = FIELD_NIGHT
  context.fillRect(0, 0, FIELD_SIZE, FIELD_SIZE)
  const ground = context.createLinearGradient(0, 0, FIELD_SIZE, FIELD_SIZE)
  ground.addColorStop(0, first)
  ground.addColorStop(1, resolved[resolved.length - 1] ?? first)
  context.globalAlpha = FIELD_GROUND
  context.fillStyle = ground
  context.fillRect(0, 0, FIELD_SIZE, FIELD_SIZE)
  context.globalAlpha = FIELD_SPOT
  resolved.forEach((colour, index) => {
    const [x, y] = FIELD_SPOTS[index % FIELD_SPOTS.length] ?? [0.5, 0.5]
    const spot = context.createRadialGradient(
      x * FIELD_SIZE,
      y * FIELD_SIZE,
      0,
      x * FIELD_SIZE,
      y * FIELD_SIZE,
      FIELD_SIZE * 0.62,
    )
    spot.addColorStop(0, colour)
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)')
    context.fillStyle = spot
    context.fillRect(0, 0, FIELD_SIZE, FIELD_SIZE)
  })
  return canvas.toDataURL('image/png')
}
