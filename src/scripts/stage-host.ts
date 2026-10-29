import { bindStillToggle } from './stillness'
import type { SwupInstance } from './swup'
import { bindTilt } from './tilt'

const STAGE_HOST = '[data-stage-host]'
const TILT_HOST = '[data-tilt-host]'
const TILT_CARD = '[data-tilt-card]'
const TOGGLE = '[data-stage-toggle]'

const hosts = new Map<HTMLElement, AbortController>()

function mount(host: HTMLElement, signal: AbortSignal): void {
  if (host.matches(STAGE_HOST)) {
    const toggle = host.querySelector<HTMLButtonElement>(TOGGLE)
    if (toggle) bindStillToggle(host, toggle, signal)
  }
  if (host.matches(TILT_HOST)) {
    bindTilt(host, () => host.querySelector<HTMLElement>(TILT_CARD) ?? host, signal)
  }
}

function syncHosts(): void {
  for (const [host, teardown] of [...hosts]) {
    if (host.isConnected) continue
    teardown.abort()
    hosts.delete(host)
  }
  for (const host of document.querySelectorAll<HTMLElement>(`${STAGE_HOST}, ${TILT_HOST}`)) {
    if (hosts.has(host)) continue
    const teardown = new AbortController()
    hosts.set(host, teardown)
    mount(host, teardown.signal)
  }
}

export function bindStageHosts(swup: SwupInstance): void {
  swup.hooks.on('page:view', syncHosts)
  syncHosts()
}
