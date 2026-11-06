import { type AlmanachStyle, almanachStyleOf } from './almanach-look.ts'

const FILES = import.meta.glob<unknown>('/data/almanachs/*.json', {
  eager: true,
  import: 'default',
})

function idOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1, -'.json'.length)
}

const STYLES: ReadonlyMap<string, AlmanachStyle> = new Map(
  Object.entries(FILES).map(([path, value]) => {
    const style = almanachStyleOf(value)
    if (!style) throw new Error(`${path} is not a valid almanach style`)
    return [idOf(path), style]
  }),
)

export function almanachStyle(id: string): AlmanachStyle | undefined {
  return STYLES.get(id)
}

export function almanachStyleIds(): readonly string[] {
  return [...STYLES.keys()].sort()
}
