export const VIEWS = ['top', 'iso', 'relief', 'free'] as const
export type View = (typeof VIEWS)[number]

export const DEFAULT_VIEW: View = 'iso'

export function isView(value: unknown): value is View {
  return VIEWS.some((view) => view === value)
}
