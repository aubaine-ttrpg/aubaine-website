import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DRAFT_REVEALED, draftsShown, isDraft, isRevealed, setDraftsShown } from '../scripts/drafts'

export type FilterGroup = { key: string; label: string }
export type FilterKind = { key: string; label: string; dot: string }

export type FilterStrings = {
  filterHere: string
  filters: string
  byName: string
  clear: string
  close: string
  apply: string
  resetFilters: string
  result: string
  results: string
  emptyTitle: string
  emptyBody: string
  treeKind: string
  allTrees: string
  drafts: string
  emptyListTitle: string
  emptyListBody: string
}

type Props = {
  strings: FilterStrings
  groups: FilterGroup[]
  kinds?: FilterKind[] | undefined
  total: number
  drafts: number
  locale: string
  inputMaxWidth?: string | undefined
}

type Entry = {
  element: HTMLElement
  id: string
  name: string
  draft: boolean
  facets: Map<string, string[]>
}

type Chip = { value: string; label: string; count: number; dot: string }

const POP_EASE = [0.16, 1, 0.3, 1] as const

function readEntries(): Entry[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-entry]'))
  return nodes.map((element) => {
    const facets = new Map<string, string[]>()
    for (const attribute of Array.from(element.attributes)) {
      if (!attribute.name.startsWith('data-facet-') || attribute.name.endsWith('-labels')) continue
      const key = attribute.name.slice('data-facet-'.length)
      facets.set(key, attribute.value.split(' ').filter(Boolean))
    }
    return {
      element,
      id: element.dataset['entry'] ?? '',
      name: element.dataset['name'] ?? '',
      draft: isDraft(element),
      facets,
    }
  })
}

function readRevealed(entries: Entry[]): Set<string> {
  return new Set(entries.filter((entry) => isRevealed(entry.element)).map((entry) => entry.id))
}

function readLabels(entries: Entry[], group: string): Map<string, string> {
  const labels = new Map<string, string>()
  for (const entry of entries) {
    const values = entry.facets.get(group) ?? []
    const raw = entry.element.getAttribute(`data-facet-${group}-labels`) ?? ''
    const parts = raw.split('|')
    values.forEach((value, index) => {
      if (!labels.has(value)) labels.set(value, parts[index] ?? value)
    })
  }
  return labels
}

function matches(entry: Entry, query: string, selected: Map<string, Set<string>>): boolean {
  if (query && !entry.name.includes(query)) return false
  for (const [group, values] of selected) {
    if (values.size === 0) continue
    const owned = entry.facets.get(group) ?? []
    if (!owned.some((value) => values.has(value))) return false
  }
  return true
}

export default function FilterBar({
  strings,
  groups,
  kinds,
  total,
  drafts,
  locale,
  inputMaxWidth = '340px',
}: Props) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [withDrafts, setWithDrafts] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map())
  const [kind, setKind] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [kindOpen, setKindOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const reducedMotion = useReducedMotion()

  const popFrom = reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.985 }
  const popTo = reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
  const menuTiming = reducedMotion ? { duration: 0 } : { duration: 0.2, ease: POP_EASE }
  const scrimTiming = reducedMotion ? { duration: 0 } : { duration: 0.2 }
  const dialogTiming = reducedMotion ? { duration: 0 } : { duration: 0.24, ease: POP_EASE }

  useEffect(() => {
    const read = readEntries()
    setEntries(read)
    setWithDrafts(draftsShown())
    setRevealed(readRevealed(read))
    const onRevealed = () => setRevealed(readRevealed(read))
    document.addEventListener(DRAFT_REVEALED, onRevealed)
    return () => document.removeEventListener(DRAFT_REVEALED, onRevealed)
  }, [])

  const pool = useMemo(
    () => entries.filter((entry) => withDrafts || !entry.draft || revealed.has(entry.id)),
    [entries, withDrafts, revealed],
  )

  const kindFiltered = useMemo(
    () =>
      kind === 'all'
        ? pool
        : pool.filter((entry) => (entry.facets.get('kind') ?? []).includes(kind)),
    [pool, kind],
  )

  const visible = useMemo(
    () => kindFiltered.filter((entry) => matches(entry, query.trim().toLowerCase(), selected)),
    [kindFiltered, query, selected],
  )

  useEffect(() => {
    if (entries.length === 0) return
    const shown = new Set(visible.map((entry) => entry.element))
    for (const entry of entries) entry.element.hidden = !shown.has(entry.element)
  }, [entries, visible])

  useEffect(() => {
    if (!modalOpen) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const chipsFor = useCallback(
    (group: string): Chip[] => {
      const labels = readLabels(kindFiltered, group)
      const counts = new Map<string, number>()
      for (const entry of kindFiltered) {
        for (const value of entry.facets.get(group) ?? []) {
          counts.set(value, (counts.get(value) ?? 0) + 1)
        }
      }
      return [...counts.entries()]
        .map(([value, count]) => ({
          value,
          count,
          label: labels.get(value) ?? value,
          dot: '',
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, locale))
    },
    [kindFiltered, locale],
  )

  const activeCount = useMemo(() => {
    let sum = 0
    for (const values of selected.values()) sum += values.size
    return sum
  }, [selected])

  const narrowed = query.trim() !== '' || activeCount > 0 || kind !== 'all'

  useEffect(() => {
    document.documentElement.toggleAttribute('data-filtering', narrowed)
    return () => document.documentElement.removeAttribute('data-filtering')
  }, [narrowed])

  const toggle = (group: string, value: string) => {
    setSelected((current) => {
      const next = new Map(current)
      const values = new Set(next.get(group) ?? [])
      if (values.has(value)) values.delete(value)
      else values.add(value)
      next.set(group, values)
      return next
    })
  }

  const clearGroup = (group: string) => {
    setSelected((current) => {
      const next = new Map(current)
      next.set(group, new Set())
      return next
    })
  }

  const reset = () => {
    setSelected(new Map())
    setQuery('')
  }

  const showDrafts = (shown: boolean) => {
    setDraftsShown(shown)
    setWithDrafts(shown)
  }

  const resultLabel = (value: number) =>
    `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR').format(value)} ${value === 1 ? strings.result : strings.results}`
  const hydrated = entries.length > 0
  const count = hydrated ? visible.length : total
  const filterBc = activeCount > 0 ? 'var(--gold)' : 'var(--line)'
  const filterBg = activeCount > 0 ? 'var(--accent-soft)' : 'var(--field)'
  const kindLabel = kinds?.find((entry) => entry.key === kind)?.label ?? strings.allTrees

  const populated = groups
    .map((group) => ({ ...group, chips: chipsFor(group.key) }))
    .filter((group) => group.chips.length > 1)

  return (
    <>
      <div
        style={{
          maxWidth: '1560px',
          margin: '0 auto',
          padding: '22px 26px 14px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px 20px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            flex: kinds ? '1 1 300px' : '1 1 240px',
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: kinds ? '10px' : undefined,
          }}
        >
          {kinds && (
            <div style={{ flex: 'none', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setKindOpen((open) => !open)}
                onBlur={(event) => {
                  if (!event.currentTarget.parentElement?.contains(event.relatedTarget))
                    setKindOpen(false)
                }}
                aria-haspopup="listbox"
                aria-expanded={kindOpen}
                aria-label={strings.treeKind}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  background: 'var(--field)',
                  transition: 'border-color .2s var(--ease)',
                }}
              >
                <span>{kindLabel}</span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '5px solid var(--ink3)',
                  }}
                />
              </button>
              <AnimatePresence>
                {kindOpen && (
                  <motion.ul
                    aria-label={strings.treeKind}
                    initial={popFrom}
                    animate={popTo}
                    exit={popFrom}
                    transition={menuTiming}
                    style={{
                      listStyle: 'none',
                      position: 'absolute',
                      left: 0,
                      top: 'calc(100% + 7px)',
                      zIndex: 60,
                      minWidth: '190px',
                      margin: 0,
                      padding: '5px',
                      border: '1px solid var(--accent-line)',
                      background: 'var(--bg2)',
                      boxShadow: '0 18px 44px rgba(0,0,0,.45)',
                    }}
                  >
                    {kinds.map((entry) => (
                      <li key={entry.key}>
                        <button
                          type="button"
                          aria-current={kind === entry.key ? 'true' : undefined}
                          onClick={() => {
                            setKind(entry.key)
                            setKindOpen(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '9px 11px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'var(--font-ui)',
                            fontSize: '15px',
                            fontWeight: 600,
                            letterSpacing: '.06em',
                            textTransform: 'uppercase',
                            color: kind === entry.key ? 'var(--ink)' : 'var(--ink2)',
                            background: kind === entry.key ? 'var(--accent-soft)' : 'transparent',
                            transition: 'background-color .18s var(--ease), color .18s var(--ease)',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{ width: '6px', height: '6px', background: entry.dot }}
                          />
                          <span>{entry.label}</span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
          <input
            type="search"
            name="filter"
            autoComplete="off"
            aria-label={strings.filterHere}
            placeholder={strings.filterHere}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              maxWidth: kinds ? '300px' : inputMaxWidth,
              padding: '10px 13px',
              color: 'var(--ink)',
              background: 'var(--field)',
              border: '1px solid var(--line)',
              outline: 'none',
              fontFamily: 'var(--font-ui)',
              fontSize: '15px',
              transition: 'border-color .2s var(--ease)',
            }}
          />
        </div>

        <div
          style={{
            flex: 'none',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px 14px',
          }}
        >
          {drafts > 0 && (
            <label data-drafts-control="" className="au-drafts-switch">
              <input
                type="checkbox"
                role="switch"
                aria-checked={withDrafts}
                className="au-switch"
                checked={withDrafts}
                onChange={(event) => showDrafts(event.target.checked)}
              />
              <span>{strings.drafts}</span>
            </label>
          )}
          <span
            aria-live="polite"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'var(--ink3)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {hydrated || drafts === 0 ? (
              resultLabel(count)
            ) : (
              <>
                <span data-drafts-count="all">{resultLabel(total)}</span>
                <span data-drafts-count="public">{resultLabel(total - drafts)}</span>
              </>
            )}
          </span>
          <button
            type="button"
            ref={openerRef}
            onClick={() => setModalOpen(true)}
            aria-haspopup="dialog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '10px 15px',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: '14.5px',
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              border: `1px solid ${filterBc}`,
              background: filterBg,
              transition: 'border-color .2s var(--ease)',
            }}
          >
            <span
              aria-hidden="true"
              style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}
            >
              <span
                style={{
                  display: 'block',
                  width: '13px',
                  height: '1.5px',
                  background: 'currentColor',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '9px',
                  height: '1.5px',
                  background: 'currentColor',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '5px',
                  height: '1.5px',
                  background: 'currentColor',
                }}
              />
            </span>
            <span>{strings.filters}</span>
            {activeCount > 0 && (
              <span
                style={{
                  padding: '1px 7px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--on-gold)',
                  background: 'var(--gold)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {entries.length > 0 && visible.length === 0 && (
        <div style={{ margin: '0 auto', padding: '46px 26px', maxWidth: 'min(1560px,46ch)' }}>
          {!narrowed && (
            <svg
              aria-hidden="true"
              width="30"
              height="34"
              viewBox="0 0 30 34"
              style={{ display: 'block', margin: '0 0 16px', color: 'var(--ink3)' }}
            >
              <path
                d="M15 1.5 28.5 9.25v15.5L15 32.5 1.5 24.75V9.25Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
          <p
            style={{
              margin: '0 0 10px',
              fontFamily: 'var(--font-display)',
              fontSize: '19px',
              color: 'var(--ink)',
            }}
          >
            {narrowed ? strings.emptyTitle : strings.emptyListTitle}
          </p>
          <p
            style={{
              margin: narrowed ? '0 0 18px' : 0,
              fontSize: '15.5px',
              lineHeight: 1.64,
              color: 'var(--ink2)',
            }}
          >
            {narrowed ? strings.emptyBody : strings.emptyListBody}
          </p>
          {narrowed && (
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '9px 15px',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                border: '1px solid var(--line2)',
              }}
            >
              {strings.resetFilters}
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 80,
              display: 'grid',
              placeItems: 'center',
              padding: '24px',
            }}
          >
            <motion.button
              type="button"
              aria-label={strings.close}
              onClick={() => setModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={scrimTiming}
              style={{
                position: 'absolute',
                inset: 0,
                cursor: 'default',
                background: 'rgba(4,3,10,.72)',
                backdropFilter: 'blur(6px)',
              }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={strings.filters}
              initial={popFrom}
              animate={popTo}
              exit={popFrom}
              transition={dialogTiming}
              style={{
                position: 'relative',
                width: 'min(560px,100%)',
                maxHeight: '82dvh',
                overflowX: 'clip',
                overflowY: 'auto',
                border: '1px solid var(--accent-line)',
                background: 'var(--bg2)',
                boxShadow: '0 30px 80px rgba(0,0,0,.6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '20px 22px 16px',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: '21px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  {strings.filters}
                </h2>
                <button
                  type="button"
                  ref={closeRef}
                  onClick={() => {
                    setModalOpen(false)
                    openerRef.current?.focus()
                  }}
                  aria-label={strings.close}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    border: '1px solid var(--line)',
                    color: 'var(--ink2)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '15px',
                    transition: 'border-color .2s var(--ease), color .2s var(--ease)',
                  }}
                >
                  {'×'}
                </button>
              </div>

              <div
                style={{
                  padding: '20px 22px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '22px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '9px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '.2em',
                      textTransform: 'uppercase',
                      color: 'var(--ink3)',
                    }}
                  >
                    {strings.byName}
                    <input
                      type="search"
                      autoComplete="off"
                      placeholder={strings.filterHere}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '9px',
                        padding: '11px 13px',
                        color: 'var(--ink)',
                        background: 'var(--field)',
                        border: '1px solid var(--line)',
                        outline: 'none',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '16px',
                        transition: 'border-color .2s var(--ease)',
                      }}
                    />
                  </label>
                </div>

                {populated.map((group) => {
                  const active = selected.get(group.key)?.size ?? 0
                  return (
                    <div key={group.key}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: '12px',
                          margin: '0 0 10px',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            letterSpacing: '.2em',
                            textTransform: 'uppercase',
                            color: 'var(--ink3)',
                          }}
                        >
                          {group.label}
                        </p>
                        {active > 0 && (
                          <button
                            type="button"
                            onClick={() => clearGroup(group.key)}
                            style={{
                              cursor: 'pointer',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              letterSpacing: '.14em',
                              textTransform: 'uppercase',
                              color: 'var(--gold)',
                            }}
                          >
                            {strings.clear}
                          </button>
                        )}
                      </div>
                      <fieldset
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          border: 'none',
                          margin: 0,
                          padding: 0,
                          minInlineSize: 0,
                        }}
                      >
                        <legend
                          style={{
                            position: 'absolute',
                            width: '1px',
                            height: '1px',
                            overflow: 'hidden',
                            clipPath: 'inset(50%)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {group.label}
                        </legend>
                        {group.chips.map((chip) => {
                          const on = selected.get(group.key)?.has(chip.value) ?? false
                          return (
                            <button
                              key={chip.value}
                              type="button"
                              onClick={() => toggle(group.key, chip.value)}
                              aria-pressed={on}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 13px',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-ui)',
                                fontSize: '14.5px',
                                fontWeight: 600,
                                letterSpacing: '.06em',
                                textTransform: 'uppercase',
                                color: on ? 'var(--ink)' : 'var(--ink2)',
                                border: `1px solid ${on ? 'var(--accent-line)' : 'var(--line)'}`,
                                background: on ? 'var(--accent-soft)' : 'transparent',
                                transition:
                                  'border-color .2s var(--ease), color .2s var(--ease), background-color .2s var(--ease)',
                              }}
                            >
                              <span>{chip.label}</span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '10px',
                                  opacity: 0.7,
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {chip.count}
                              </span>
                            </button>
                          )
                        })}
                      </fieldset>
                    </div>
                  )
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  justifyContent: 'space-between',
                  padding: '16px 22px 20px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink2)',
                    border: '1px solid var(--line)',
                    transition: 'border-color .2s var(--ease), color .2s var(--ease)',
                  }}
                >
                  {strings.resetFilters}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--on-gold)',
                    background: 'var(--gold)',
                    transition: 'filter .2s var(--ease)',
                  }}
                >
                  {`${strings.apply} · ${count}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
