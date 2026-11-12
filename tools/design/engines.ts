import { type Browser, chromium, firefox, webkit } from 'playwright-core'

export const ENGINES = {
  firefox: (headless: boolean) => firefox.launch({ headless }),
  chromium: (headless: boolean) => chromium.launch({ channel: 'chromium', headless }),
  webkit: (headless: boolean) => webkit.launch({ headless }),
} as const satisfies Record<string, (headless: boolean) => Promise<Browser>>

export type Engine = keyof typeof ENGINES

export function isEngine(name: string): name is Engine {
  return name in ENGINES
}
