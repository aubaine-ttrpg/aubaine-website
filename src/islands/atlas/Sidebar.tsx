import type { ReactNode, RefObject } from 'react'
import type { BadgedStatus } from '../../lib/game/status'
import type { Locale } from '../../lib/i18n/locales'
import { AtlasIcon, type IconName } from './AtlasIcon'
import { MapSwitcher } from './MapSwitcher'
import type { AtlasWords } from './measures'
import type { AtlasWorldCard } from './props'

export const PANES = ['place', 'travel', 'options'] as const
export type Pane = (typeof PANES)[number]

const PANE_ICONS: Readonly<Record<Pane, IconName>> = {
  place: 'map-marker-outline',
  travel: 'map-marker-path',
  options: 'cog-outline',
}

type Props = {
  words: AtlasWords
  locale: Locale
  worlds: readonly AtlasWorldCard[]
  current: AtlasWorldCard
  badgeLabels: Readonly<Record<BadgedStatus, string>>
  onSwitch: (key: string) => void
  levels: ReactNode
  muted: boolean | undefined
  onMuted: (muted: boolean) => void
  panes: Readonly<Record<Pane, ReactNode>>
  open: Pane | undefined
  panel: string
  toggles: Readonly<Record<Pane, RefObject<HTMLButtonElement | null>>>
  onOpen: (pane: Pane | undefined) => void
}

export function Sidebar({
  words,
  locale,
  worlds,
  current,
  badgeLabels,
  onSwitch,
  levels,
  muted,
  onMuted,
  panes,
  open,
  panel,
  toggles,
  onOpen,
}: Props) {
  const shown = PANES.filter((pane) => panes[pane] !== undefined)
  return (
    <aside className="au-atlas-side" aria-label={words.panel}>
      <div className="au-atlas-rail">
        <MapSwitcher
          words={words}
          locale={locale}
          worlds={worlds}
          current={current}
          badgeLabels={badgeLabels}
          onSwitch={onSwitch}
        />
        {levels}
        <div className="au-atlas-rail__panes">
          {shown.map((pane) => (
            <button
              key={pane}
              type="button"
              ref={toggles[pane]}
              className="au-atlas-round"
              aria-label={words.panes[pane]}
              aria-expanded={open === pane}
              aria-controls={panel}
              data-tooltip={words.panes[pane]}
              onClick={() => onOpen(open === pane ? undefined : pane)}
            >
              <AtlasIcon name={PANE_ICONS[pane]} />
            </button>
          ))}
        </div>
        {muted !== undefined && (
          <button
            type="button"
            className="au-atlas-round"
            aria-label={words.sound}
            aria-pressed={!muted}
            data-tooltip={words.sound}
            onClick={() => onMuted(!muted)}
          >
            <AtlasIcon name={muted ? 'volume-off' : 'volume-high'} />
          </button>
        )}
      </div>
      <div
        className="au-atlas-panel"
        id={panel}
        inert={open === undefined}
        data-open={open ? '' : undefined}
      >
        {shown.map((pane) => (
          <section key={pane} className="au-atlas-pane" hidden={open !== pane}>
            <div className="au-atlas-pane__head">
              <span className="au-atlas-round au-atlas-round--quiet" aria-hidden="true">
                <AtlasIcon name={PANE_ICONS[pane]} />
              </span>
              <h2 className="au-atlas-pane__title">{words.panes[pane]}</h2>
              <button
                type="button"
                className="au-atlas-round au-atlas-round--small"
                aria-label={words.closePanel}
                data-tooltip={words.closePanel}
                onClick={() => {
                  onOpen(undefined)
                  toggles[pane].current?.focus()
                }}
              >
                <AtlasIcon name="close" />
              </button>
            </div>
            <div className="au-atlas-pane__body">{panes[pane]}</div>
          </section>
        ))}
      </div>
    </aside>
  )
}
