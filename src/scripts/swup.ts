export type SwupVisitFocus = { selector: string; wait: boolean }

export type SwupVisit = {
  from: { url: string }
  to: { url: string; hash?: string | undefined }
  trigger?: { el?: Element | undefined }
  containers: string[]
  animation: { animate: boolean }
  history: { popstate: boolean }
  scroll: { reset: boolean; target?: string | false | undefined }
  a11y?: { announce: string | false | undefined; focus: string | false | SwupVisitFocus }
}

export type SwupAnchorArgs = { hash: string; options: ScrollIntoViewOptions }

export type SwupInstance = {
  navigate: (url: string) => void
  getAnchorElement: (hash?: string) => Element | null
  hooks: {
    on: (name: string, handler: (visit: SwupVisit) => void) => void
    replace: (
      name: 'scroll:anchor',
      handler: (visit: SwupVisit, args: SwupAnchorArgs) => boolean,
    ) => void
  }
}

export function swupInstance(): SwupInstance | undefined {
  return (window as unknown as { swup?: SwupInstance }).swup
}

export function withSwup(register: (swup: SwupInstance) => void): void {
  const swup = swupInstance()
  if (!swup) throw new Error('Swup must be initialised before the shell script registers hooks')
  register(swup)
}
