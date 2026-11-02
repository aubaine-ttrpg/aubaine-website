export type SwupVisitFocus = { selector: string; wait: boolean }

export type SwupHistoryAction = 'push' | 'replace'

export type SwupVisit = {
  from: { url: string; hash?: string | undefined }
  to: { url: string; hash?: string | undefined; document?: Document | undefined }
  trigger?: { el?: Element | undefined }
  containers: string[]
  animation: { animate: boolean; wait: boolean }
  history: { popstate: boolean; action: SwupHistoryAction }
  scroll: { reset: boolean; target?: string | false | undefined }
  done: boolean
  a11y?: { announce: string | false | undefined; focus: string | false | SwupVisitFocus }
}

export type SwupAnchorArgs = { hash: string; options: ScrollIntoViewOptions }

export type SwupFailArgs = { error: unknown }

export type SwupFailHandler = (visit: SwupVisit, args: SwupFailArgs) => void

export type SwupPopstateArgs = { event: PopStateEvent }

export type SwupPreloadArgs = { url: string; page?: { html: string } | undefined }

export type SwupHandler = (visit: SwupVisit) => void | Promise<void>

export type SwupHookOptions = { priority: number }

export type SwupInstance = {
  options: { native: boolean }
  navigating: boolean
  navigate: (url: string, options?: { history?: SwupHistoryAction; animate?: boolean }) => void
  getAnchorElement: (hash?: string) => Element | null
  hooks: {
    on: {
      (name: 'page:preload', handler: (visit: SwupVisit, args: SwupPreloadArgs) => void): void
      (name: string, handler: SwupHandler, options?: SwupHookOptions): void
    }
    once: (name: string, handler: (visit: SwupVisit) => void) => void
    before: {
      (name: 'history:popstate', handler: (visit: SwupVisit, args: SwupPopstateArgs) => void): void
      (name: string, handler: SwupHandler): void
    }
    replace: {
      (name: 'scroll:anchor', handler: (visit: SwupVisit, args: SwupAnchorArgs) => boolean): void
      (
        name: 'visit:fail',
        handler: (visit: SwupVisit, args: SwupFailArgs, defaultHandler?: SwupFailHandler) => void,
      ): void
    }
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
