import 'astro/runtime/server/astro-island.js'
import { CLIENT_DIRECTIVES } from './island-directives'

const DIRECTIVE_REGISTRY = 'Astro'

export function enableIslands(): void {
  const registered: unknown = Reflect.get(globalThis, DIRECTIVE_REGISTRY)
  Reflect.set(globalThis, DIRECTIVE_REGISTRY, {
    ...(typeof registered === 'object' && registered !== null ? registered : {}),
    ...CLIENT_DIRECTIVES,
  })
  for (const directive of Object.keys(CLIENT_DIRECTIVES)) {
    window.dispatchEvent(new Event(`astro:${directive}`))
  }
}
