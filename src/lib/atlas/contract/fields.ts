export class FieldError extends Error {
  readonly path: string

  constructor(path: string, expected: string) {
    super(`${path}: expected ${expected}`)
    this.name = 'FieldError'
    this.path = path
  }
}

export type Fields = Record<string, unknown>

export function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function fields(value: unknown, path: string): Fields {
  if (!isFields(value)) throw new FieldError(path, 'an object')
  return value
}

export function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new FieldError(path, 'a list')
  return value
}

export function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value === '') throw new FieldError(path, 'some text')
  return value
}

export function optionalText(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : text(value, path)
}

export function finite(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new FieldError(path, 'a number')
  return value
}

export function optionalFinite(value: unknown, path: string): number | undefined {
  return value === undefined ? undefined : finite(value, path)
}

export function positive(value: unknown, path: string): number {
  const number = finite(value, path)
  if (number <= 0) throw new FieldError(path, 'a positive number')
  return number
}

export function integer(value: unknown, path: string): number {
  const number = finite(value, path)
  if (!Number.isInteger(number)) throw new FieldError(path, 'an integer')
  return number
}

export function oneOf<const T extends readonly string[]>(
  value: unknown,
  choices: T,
  path: string,
): T[number] {
  const found = choices.find((choice) => choice === value)
  if (found === undefined) throw new FieldError(path, `one of ${choices.join(', ')}`)
  return found
}

export function record(value: unknown, path: string): Map<string, unknown> {
  return new Map(Object.entries(fields(value, path)))
}
