export const HEX_COLOUR = /^#[0-9a-f]{6}$/

export type HexColour = `#${string}`

export function isHexColour(value: unknown): value is HexColour {
  return typeof value === 'string' && HEX_COLOUR.test(value)
}
