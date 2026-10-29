import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DRAFT_REVEALED, draftsShown, isDraft, isRevealed, setDraftsShown } from '../scripts/drafts'

export type FilterGroup = { key: string; label: string }
export type FilterKind = { key: string; label: string; dot: string }
export type UnmatchedEntries = 'hidden' | 'dimmed'

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
  treeKind: string
  allTrees: string
  hideDrafts: string
}

type Props = {
  strings: FilterStrings
  groups: FilterGroup[]
  kinds?: FilterKind[] | undefined
  total: number
  drafts: number
  locale: string
  unmatched: UnmatchedEntries
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
  unmatched,
  inputMaxWidth = '340px',
}: Props) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [withDrafts, setWithDrafts] = useState(true)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map())
  const [kind, setKind] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [kindOpen, setKindOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
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
    for (const entry of entries) {
      const matched = shown.has(entry.element)
      if (unmatched === 'dimmed') entry.element.toggleAttribute('data-dimmed', !matched)
      else entry.element.hidden = !matched
    }
  }, [entries, visible, unmatched])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      setModalOpen(false)
    }
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) setModalOpen(false)
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('click', onBackdrop)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('click', onBackdrop)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!modalOpen || !dialog) return
    if (!dialog.open) dialog.showModal()
    closeRef.current?.focus()
  }, [modalOpen])

  const settleClosed = useCallback(() => {
    dialogRef.current?.close()
    openerRef.current?.focus()
  }, [])

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

  const reset = useCallback(() => {
    setSelected(new Map())
    setQuery('')
  }, [])

  const nothingShown = entries.length > 0 && visible.length === 0

  useEffect(() => {
    for (const panel of document.querySelectorAll<HTMLElement>('[data-filter-empty]')) {
      const forFilters = panel.dataset['filterEmpty'] === 'filtered'
      panel.hidden = !nothingShown || forFilters !== narrowed
    }
  }, [nothingShown, narrowed])

  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-filter-reset]'))
    const onReset = () => {
      reset()
      inputRef.current?.focus()
    }
    for (const button of buttons) button.addEventListener('click', onReset)
    return () => {
      for (const button of buttons) button.removeEventListener('click', onReset)
    }
  }, [reset])

  const showDrafts = (shown: boolean) => {
    setDraftsShown(shown)
    setWithDrafts(shown)
  }

  const resultLabel = (value: number) =>
    `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR').format(value)} ${value === 1 ? strings.result : strings.results}`
  const hydrated = entries.length > 0
  const count = hydrated ? visible.length : total
  const kindLabel = kinds?.find((entry) => entry.key === kind)?.label ?? strings.allTrees

  const populated = groups
    .map((group) => ({ ...group, chips: chipsFor(group.key) }))
    .filter((group) => group.chips.length > 1)

  return (
    <>
      <div className="au-filterbar">
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
                className="au-filterbar__field au-filterbar__kind"
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
                      border: '1px solid var(--gold)',
                      background: 'var(--bg2)',
                      boxShadow: '6px 7px 0 rgba(6,5,13,.55)',
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
            ref={inputRef}
            type="search"
            name="filter"
            autoComplete="off"
            aria-label={strings.filterHere}
            placeholder={strings.filterHere}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="au-filterbar__field au-filterbar__search"
            style={{ maxWidth: kinds ? '300px' : inputMaxWidth }}
          />
        </div>

        <div className="au-filterbar__tools">
          {drafts > 0 && (
            <label data-drafts-control="" className="au-drafts-switch">
              <input
                type="checkbox"
                role="switch"
                aria-checked={!withDrafts}
                className="au-switch"
                checked={!withDrafts}
                onChange={(event) => showDrafts(!event.target.checked)}
              />
              <span>{strings.hideDrafts}</span>
            </label>
          )}
          <span aria-live="polite" className="au-filterbar__count">
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
            className="au-filterbar__open"
            data-active={activeCount > 0 ? '' : undefined}
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
            {activeCount > 0 && <span className="au-filterbar__active">{activeCount}</span>}
          </button>
        </div>
      </div>

      <dialog ref={dialogRef} aria-label={strings.filters} className="au-filterbar__modal">
        <AnimatePresence onExitComplete={settleClosed}>
          {modalOpen && (
            <div key="modal" style={{ display: 'contents' }}>
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={scrimTiming}
                className="au-filterbar__scrim"
              />
              <motion.div
                initial={popFrom}
                animate={popTo}
                exit={popFrom}
                transition={dialogTiming}
                className="au-filterbar__dialog"
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
                  <h2 className="au-filterbar__heading">{strings.filters}</h2>
                  <button
                    type="button"
                    ref={closeRef}
                    onClick={() => setModalOpen(false)}
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
                          <p className="au-filterbar__tape">{group.label}</p>
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
                                className="au-filterbar__chip"
                              >
                                <span>{chip.label}</span>
                                <span className="au-filterbar__chip-count">{chip.count}</span>
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
                    className="au-filterbar__apply"
                  >
                    {`${strings.apply} · ${count}`}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </dialog>
    </>
  )
}
