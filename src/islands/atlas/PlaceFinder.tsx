import { type ReactNode, type RefObject, useId, useMemo, useState } from 'react'
import type { AtlasRef } from '../../lib/atlas/world/refs'
import { AtlasIcon } from './AtlasIcon'
import type { PlaceEntry } from './describe'
import type { AtlasWords } from './measures'
import { Marker } from './PlaceSheet'

type Props = {
  words: AtlasWords
  featured: readonly PlaceEntry[]
  find: (query: string) => PlaceEntry[]
  search: RefObject<HTMLInputElement | null>
  onChoose: (ref: AtlasRef) => void
  children: ReactNode
}

function EntryList({
  entries,
  labelledBy,
  onChoose,
}: {
  entries: readonly PlaceEntry[]
  labelledBy: string
  onChoose: (ref: AtlasRef) => void
}) {
  return (
    <ul className="au-atlas-entries" aria-labelledby={labelledBy}>
      {entries.map((entry) => (
        <li key={entry.key}>
          <button type="button" className="au-atlas-entry" onClick={() => onChoose(entry.ref)}>
            <Marker dot={entry.dot} />
            <span className="au-atlas-entry__name">{entry.name}</span>
            <span className="au-atlas-entry__kind">{entry.kind}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function PlaceFinder({ words, featured, find, search, onChoose, children }: Props) {
  const [query, setQuery] = useState('')
  const input = useId()
  const count = useId()
  const jump = useId()
  const results = useMemo(() => find(query), [find, query])
  const searching = query.trim() !== ''
  const choose = (ref: AtlasRef) => {
    setQuery('')
    onChoose(ref)
  }

  return (
    <div className="au-atlas-place">
      <search className="au-atlas-find">
        <label className="au-atlas-find__label" htmlFor={input}>
          {words.findPlace}
        </label>
        <span className="au-atlas-find__field">
          <AtlasIcon name="magnify" className="au-atlas-find__icon" />
          <input
            ref={search}
            id={input}
            className="au-atlas-find__input"
            type="search"
            value={query}
            placeholder={words.findPlaceHint}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={count}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || query === '') return
              event.preventDefault()
              setQuery('')
            }}
          />
        </span>
        <p className="au-atlas-find__count" id={count} aria-live="polite">
          {searching ? words.placesFound(results.length) : ''}
        </p>
      </search>
      {searching ? (
        results.length > 0 ? (
          <EntryList entries={results} labelledBy={count} onChoose={choose} />
        ) : (
          <p className="au-atlas-place__empty">{words.noPlaceFound}</p>
        )
      ) : (
        (children ?? (
          <div className="au-atlas-place__intro">
            <p className="au-atlas-place__hint">{words.hint}</p>
            <h3 className="au-atlas-eyebrow" id={jump}>
              {words.jumpTo}
            </h3>
            <EntryList entries={featured} labelledBy={jump} onChoose={choose} />
          </div>
        ))
      )}
    </div>
  )
}
