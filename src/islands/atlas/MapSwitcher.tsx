import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { MAP_KINDS, type MapKind } from '../../lib/atlas/vocabulary'
import type { BadgedStatus } from '../../lib/game/status'
import type { Locale } from '../../lib/i18n/locales'
import { AtlasIcon, type IconName } from './AtlasIcon'
import { folded } from './describe'
import { MapEmblem } from './MapEmblem'
import type { AtlasWords } from './measures'
import { paintTiles, worldTiles } from './preview'
import type { AtlasWorldCard } from './props'

const KIND_ICONS: Readonly<Record<MapKind, IconName>> = {
  land: 'map-outline',
  area: 'grid',
}

type Shared = {
  words: AtlasWords
  locale: Locale
  worlds: readonly AtlasWorldCard[]
  current: AtlasWorldCard
  badgeLabels: Readonly<Record<BadgedStatus, string>>
}

type Props = Shared & { onSwitch: (key: string) => void }

export function MapSwitcher({ onSwitch, ...shared }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useId()
  const [open, setOpen] = useState(false)
  const { words, current } = shared
  const close = () => dialog.current?.close()
  return (
    <>
      <button
        type="button"
        className="au-atlas-switch"
        aria-haspopup="dialog"
        aria-label={words.openMaps(current.name)}
        data-tooltip={words.openMaps(current.name)}
        onClick={() => {
          dialog.current?.showModal()
          setOpen(true)
        }}
      >
        <MapEmblem emblem={current.emblem} />
      </button>
      <dialog
        ref={dialog}
        className="au-atlas-maps"
        aria-labelledby={title}
        onClose={() => setOpen(false)}
      >
        {open && (
          <MapCatalogue
            {...shared}
            title={title}
            onClose={close}
            onChoose={(key) => {
              close()
              if (key !== current.key) onSwitch(key)
            }}
          />
        )}
      </dialog>
    </>
  )
}

type CatalogueProps = Shared & {
  title: string
  onClose: () => void
  onChoose: (key: string) => void
}

function MapCatalogue({
  words,
  locale,
  worlds,
  current,
  badgeLabels,
  title,
  onClose,
  onChoose,
}: CatalogueProps) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<MapKind>(current.kind)
  const tabs = useRef(new Map<MapKind, HTMLButtonElement>())
  const ids = { tab: useId(), panel: useId() }
  const wanted = folded(locale, query.trim())
  const matching = worlds.filter((world) => folded(locale, world.name).includes(wanted))
  const shown = matching.filter((world) => world.kind === kind)
  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = MAP_KINDS.indexOf(kind)
    const last = MAP_KINDS.length - 1
    const next =
      event.key === 'ArrowRight'
        ? MAP_KINDS[index === last ? 0 : index + 1]
        : event.key === 'ArrowLeft'
          ? MAP_KINDS[index === 0 ? last : index - 1]
          : event.key === 'Home'
            ? MAP_KINDS[0]
            : event.key === 'End'
              ? MAP_KINDS[last]
              : undefined
    if (!next) return
    event.preventDefault()
    setKind(next)
    tabs.current.get(next)?.focus()
  }
  return (
    <div className="au-atlas-maps__body">
      <div className="au-atlas-maps__head">
        <h2 className="au-atlas-maps__title" id={title}>
          {words.maps}
        </h2>
        <button
          type="button"
          className="au-atlas-round au-atlas-round--small"
          aria-label={words.closeMaps}
          onClick={onClose}
        >
          <AtlasIcon name="close" />
        </button>
      </div>
      <label className="au-atlas-find__field au-atlas-maps__find">
        <AtlasIcon name="magnify" className="au-atlas-find__icon" />
        <span className="au-atlas-hidden">{words.findMap}</span>
        <input
          type="search"
          className="au-atlas-find__input"
          placeholder={words.findMapHint}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="au-atlas-categories" role="tablist" aria-label={words.mapKindsLabel}>
        {MAP_KINDS.map((entry) => (
          <button
            key={entry}
            ref={(element) => {
              if (element) tabs.current.set(entry, element)
              else tabs.current.delete(entry)
            }}
            type="button"
            role="tab"
            id={`${ids.tab}-${entry}`}
            className="au-atlas-category"
            aria-selected={kind === entry}
            aria-controls={ids.panel}
            tabIndex={kind === entry ? 0 : -1}
            onClick={() => setKind(entry)}
            onKeyDown={onKey}
          >
            <span className="au-atlas-round au-atlas-round--quiet" aria-hidden="true">
              <AtlasIcon name={KIND_ICONS[entry]} />
            </span>
            <span className="au-atlas-category__name">
              {words.mapKind(
                words.mapKinds[entry],
                matching.filter((world) => world.kind === entry).length,
              )}
            </span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={ids.panel} aria-labelledby={`${ids.tab}-${kind}`}>
        {shown.length === 0 ? (
          <p className="au-atlas-maps__empty">
            {wanted === '' ? words.noMapsYet : words.noMapFound}
          </p>
        ) : (
          <ul className="au-atlas-maps__grid">
            {shown.map((world) => {
              const here = world.key === current.key
              return (
                <li key={world.key}>
                  <button
                    type="button"
                    className="au-atlas-map"
                    aria-current={here ? 'true' : undefined}
                    onClick={() => onChoose(world.key)}
                  >
                    <MapPreview world={world} />
                    <span className="au-atlas-map__head">
                      <MapEmblem emblem={world.emblem} />
                      <span className="au-atlas-map__name">{world.name}</span>
                    </span>
                    <span className="au-atlas-map__meta">
                      {words.mapSize(world.columns, world.rows)}
                      {world.badge && (
                        <span className="au-atlas-map__badge">{badgeLabels[world.badge]}</span>
                      )}
                      {here && <span className="au-atlas-map__here">{words.currentMap}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function MapPreview({ world }: { world: AtlasWorldCard }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let live = true
    worldTiles(world.key).then(
      (tiles) => {
        if (live && canvas.current) paintTiles(canvas.current, tiles)
      },
      (error: unknown) => console.error('[atlas] the map preview could not load', error),
    )
    return () => {
      live = false
    }
  }, [world.key])
  return (
    <canvas
      ref={canvas}
      className="au-atlas-map__preview"
      width={world.columns}
      height={world.rows}
    />
  )
}
