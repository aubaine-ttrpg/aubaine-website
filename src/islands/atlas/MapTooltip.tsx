import { type RefObject, useMemo, useSyncExternalStore } from 'react'
import type { MapHover } from '../../lib/atlas/contract/hover'
import { type Gazetteer, hoverText, unexploredHover } from './describe'

export class HoveredPlace {
  private current: MapHover | undefined
  private readonly listeners = new Set<() => void>()

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly read = (): MapHover | undefined => this.current

  set(target: MapHover | undefined): void {
    this.current = target
    for (const listener of this.listeners) listener()
  }
}

type Props = {
  hovered: HoveredPlace
  gazetteer: Gazetteer | undefined
  element: RefObject<HTMLDivElement | null>
}

export function MapTooltip({ hovered, gazetteer, element }: Props) {
  const target = useSyncExternalStore(hovered.subscribe, hovered.read)
  const text = useMemo(() => {
    if (!gazetteer || !target) return undefined
    return target.kind === 'unexplored'
      ? unexploredHover(gazetteer)
      : hoverText(gazetteer, target.ref)
  }, [gazetteer, target])
  return (
    <div className="au-atlas-tooltip" ref={element} data-tone={text?.tone} aria-hidden="true">
      {text && (
        <>
          <span className="au-atlas-tooltip__title">{text.title}</span>
          <span className="au-atlas-tooltip__detail">{text.detail}</span>
        </>
      )}
    </div>
  )
}
