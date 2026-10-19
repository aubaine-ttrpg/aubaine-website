import { type RefObject, useId } from 'react'
import { VIEWS, type View } from '../../lib/atlas/contract/camera'
import { AtlasIcon, type IconName } from './AtlasIcon'
import type { AtlasWords } from './measures'

type Props = {
  words: AtlasWords
  view: View
  locked: boolean
  onView: (view: View) => void
  onZoom: (factor: number) => void
  onNorth: () => void
  compass: RefObject<HTMLSpanElement | null>
}

const ZOOM_IN = 0.72
const ZOOM_OUT = 1.38
const VIEW_ICONS: Readonly<Record<View, IconName>> = {
  top: 'map-outline',
  iso: 'cube-outline',
  relief: 'terrain',
  free: 'rotate-3d-variant',
}

export function ViewBar({ words, view, locked, onView, onZoom, onNorth, compass }: Props) {
  const label = useId()
  const reason = useId()
  return (
    <div className="au-atlas-viewbar">
      <span className="au-atlas-hidden" id={label}>
        {words.view}
      </span>
      <span className="au-atlas-hidden" id={reason}>
        {words.viewsLocked}
      </span>
      <div className="au-atlas-views" role="radiogroup" aria-labelledby={label}>
        {VIEWS.map((option, index) => (
          <label
            key={option}
            className="au-atlas-round au-atlas-views__option"
            data-tooltip={locked ? words.viewsLocked : `${index + 1} · ${words.viewHints[option]}`}
          >
            <input
              type="radio"
              className="au-atlas-radio"
              name={label}
              value={option}
              checked={view === option}
              disabled={locked}
              aria-describedby={locked ? reason : undefined}
              onChange={() => onView(option)}
            />
            <AtlasIcon name={VIEW_ICONS[option]} />
            <span className="au-atlas-hidden">{words.views[option]}</span>
          </label>
        ))}
      </div>
      <span className="au-atlas-viewbar__rule" aria-hidden="true" />
      <button
        type="button"
        className="au-atlas-round"
        aria-label={words.zoomOut}
        data-tooltip={words.zoomOut}
        onClick={() => onZoom(ZOOM_OUT)}
      >
        <AtlasIcon name="minus" />
      </button>
      <button
        type="button"
        className="au-atlas-round"
        aria-label={words.zoomIn}
        data-tooltip={words.zoomIn}
        onClick={() => onZoom(ZOOM_IN)}
      >
        <AtlasIcon name="plus" />
      </button>
      <button
        type="button"
        className="au-atlas-round au-atlas-compass"
        aria-label={words.north}
        data-tooltip={words.north}
        onClick={onNorth}
      >
        <span className="au-atlas-compass__needle" ref={compass} aria-hidden="true">
          <span className="au-atlas-compass__north" />
          <span className="au-atlas-compass__south" />
        </span>
      </button>
    </div>
  )
}
