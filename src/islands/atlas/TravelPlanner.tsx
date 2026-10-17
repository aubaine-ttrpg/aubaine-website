import { motion } from 'motion/react'
import { type RefObject, useEffect, useId, useMemo, useRef, useState } from 'react'
import { VESSELS } from '../../lib/atlas/vocabulary'
import { type AtlasRef, refFromKey, refKey } from '../../lib/atlas/world/refs'
import { TRAVEL_MODES, type TravelMode } from '../../lib/atlas/world/travel'
import { AtlasIcon, type IconName } from './AtlasIcon'
import type { AtlasBook } from './book'
import { endpointLabel, type Gazetteer } from './describe'
import {
  crewLabel,
  type Endpoint,
  type JourneyBreakdown,
  type JourneyCard,
  type JourneyPlan,
  type JourneyView,
  skisLabel,
  vesselOptions,
} from './journey'
import type { AtlasWords } from './measures'
import { toneColour } from './swatches'

type Props = {
  words: AtlasWords
  gazetteer: Gazetteer
  book: AtlasBook
  chapter: { title: string; href: string }
  plan: JourneyPlan
  speedText: string
  speedValid: boolean
  outcome: JourneyView | undefined
  status: string
  pending: boolean
  picking: Endpoint | undefined
  heading: RefObject<HTMLHeadingElement | null>
  onEndpoint: (end: Endpoint, ref: AtlasRef | undefined) => void
  onPick: (end: Endpoint, origin: HTMLButtonElement) => void
  onSwap: () => void
  onPlan: (patch: Partial<JourneyPlan>) => void
  onSpeed: (text: string) => void
}

const VOYAGES: ReadonlySet<TravelMode> = new Set(['ship', 'dirigeable', 'rail'])
const MODE_ICONS: Readonly<Record<TravelMode, IconName>> = {
  foot: 'walk',
  fly: 'bird',
  ship: 'sail-boat',
  dirigeable: 'airballoon',
  rail: 'train',
}
const RISE = { duration: 0.35, ease: [0.16, 1, 0.3, 1] } as const

function BookText({
  template,
  className,
}: {
  template: HTMLTemplateElement | undefined
  className: string
}) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    host.current?.replaceChildren(template ? template.content.cloneNode(true) : '')
  }, [template])
  return <div className={className} ref={host} />
}

type EndpointFieldProps = {
  words: AtlasWords
  gazetteer: Gazetteer
  end: Endpoint
  value: AtlasRef | undefined
  options: readonly { key: string; label: string }[]
  picking: boolean
  onChange: (ref: AtlasRef | undefined) => void
  onPick: (origin: HTMLButtonElement) => void
}

function EndpointField({
  words,
  gazetteer,
  end,
  value,
  options,
  picking,
  onChange,
  onPick,
}: EndpointFieldProps) {
  const select = useId()
  const key = value ? refKey(value) : ''
  const listed = key === '' || options.some((option) => option.key === key)
  return (
    <div className="au-atlas-end" data-end={end}>
      <label className="au-atlas-end__label" htmlFor={select}>
        <span className="au-atlas-end__mark" aria-hidden="true" />
        {end === 'from' ? words.from : words.to}
      </label>
      <div className="au-atlas-end__row">
        <select
          id={select}
          className="au-atlas-select"
          value={key}
          onChange={(event) =>
            onChange(refFromKey(event.target.value, gazetteer.world, gazetteer.grid))
          }
        >
          <option value="">{words.choosePlace}</option>
          {value && !listed && <option value={key}>{endpointLabel(gazetteer, value)}</option>}
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="au-atlas-round au-atlas-end__pick"
          aria-label={end === 'from' ? words.pickFrom : words.pickTo}
          data-tooltip={end === 'from' ? words.pickFrom : words.pickTo}
          aria-pressed={picking}
          onClick={(event) => onPick(event.currentTarget)}
        >
          <AtlasIcon name="crosshairs-gps" />
        </button>
      </div>
    </div>
  )
}

function Cards({ cards, book }: { cards: readonly JourneyCard[]; book: AtlasBook }) {
  return (
    <ol className="au-atlas-cards">
      {cards.map((card) => (
        <li
          key={card.kind === 'pace' ? card.pace : card.kind}
          className="au-atlas-card"
          data-highlighted={card.kind === 'voyage' || card.highlighted ? '' : undefined}
        >
          <span className="au-atlas-card__title">{card.title}</span>
          <span className="au-atlas-card__duration">{card.duration}</span>
          <span className="au-atlas-card__detail">{card.detail}</span>
          {card.kind === 'pace' && (
            <BookText className="au-atlas-card__effect" template={book.effects.get(card.pace)} />
          )}
        </li>
      ))}
    </ol>
  )
}

function Breakdown({ breakdown }: { breakdown: JourneyBreakdown }) {
  const title = useId()
  return (
    <section className="au-atlas-breakdown" aria-labelledby={title}>
      <h4 className="au-atlas-eyebrow" id={title}>
        {breakdown.title}
      </h4>
      <div className="au-atlas-breakdown__bar" aria-hidden="true">
        {breakdown.legs.map((leg) => (
          <span
            key={leg.key}
            title={leg.label}
            style={{ flexGrow: leg.share, background: toneColour(leg.tone) }}
          />
        ))}
      </div>
      <ul className="au-atlas-breakdown__legs">
        {breakdown.legs.map((leg) => (
          <li key={leg.key} className="au-atlas-leg">
            <span
              className="au-atlas-leg__swatch"
              style={{ background: toneColour(leg.tone) }}
              aria-hidden="true"
            />
            <span className="au-atlas-leg__label">
              {leg.href ? <a href={leg.href}>{leg.label}</a> : leg.label}
            </span>
            <span className="au-atlas-leg__distance">{leg.distance}</span>
            <span className="au-atlas-leg__pace">{leg.pace}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TravelPlanner({
  words,
  gazetteer,
  book,
  chapter,
  plan,
  speedText,
  speedValid,
  outcome,
  status,
  pending,
  picking,
  heading,
  onEndpoint,
  onPick,
  onSwap,
  onPlan,
  onSpeed,
}: Props) {
  const means = useId()
  const speed = useId()
  const speedUnit = useId()
  const speedError = useId()
  const vessel = useId()
  const extras = useId()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const options = useMemo(
    () =>
      gazetteer.world.travelPlaces.map((entry) => {
        const ref: AtlasRef =
          entry.kind === 'place'
            ? { kind: 'place', place: entry.place }
            : { kind: 'landmark', landmark: entry.landmark }
        return { key: refKey(ref), label: endpointLabel(gazetteer, ref) }
      }),
    [gazetteer],
  )
  const vessels = useMemo(() => vesselOptions(gazetteer), [gazetteer])
  const skis = useMemo(() => skisLabel(gazetteer), [gazetteer])
  const crew = useMemo(() => crewLabel(gazetteer), [gazetteer])
  const hasSettings =
    plan.mode === 'ship' ||
    plan.mode === 'fly' ||
    (plan.mode === 'foot' && skis !== undefined) ||
    VOYAGES.has(plan.mode)

  return (
    <motion.div
      className="au-atlas-travel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={RISE}
    >
      <header className="au-atlas-travel__head">
        <p className="au-atlas-travel__eyebrow">{words.travelEyebrow}</p>
        <h3 className="au-atlas-travel__title" ref={heading} tabIndex={-1}>
          {words.travelTitle}
        </h3>
      </header>
      <div className="au-atlas-ends">
        <div className="au-atlas-ends__fields">
          {(['from', 'to'] as const).map((end) => (
            <EndpointField
              key={end}
              words={words}
              gazetteer={gazetteer}
              end={end}
              value={plan[end]}
              options={options}
              picking={picking === end}
              onChange={(ref) => onEndpoint(end, ref)}
              onPick={(origin) => onPick(end, origin)}
            />
          ))}
        </div>
        <button
          type="button"
          className="au-atlas-round au-atlas-swap"
          aria-label={words.swap}
          data-tooltip={words.swap}
          onClick={onSwap}
        >
          <AtlasIcon name="swap-vertical" />
        </button>
      </div>
      <div className="au-atlas-means">
        <span className="au-atlas-eyebrow" id={means}>
          {words.means}
        </span>
        <div className="au-atlas-chips" role="radiogroup" aria-labelledby={means}>
          {TRAVEL_MODES.map((mode) => (
            <label
              key={mode}
              className="au-atlas-round au-atlas-mode"
              data-tooltip={words.modes[mode]}
            >
              <input
                type="radio"
                className="au-atlas-radio"
                name={means}
                value={mode}
                checked={plan.mode === mode}
                onChange={() => onPlan({ mode })}
              />
              <AtlasIcon name={MODE_ICONS[mode]} />
              <span className="au-atlas-hidden">{words.modes[mode]}</span>
            </label>
          ))}
          <span className="au-atlas-mode__name" aria-hidden="true">
            {words.modes[plan.mode]}
          </span>
        </div>
        {hasSettings && (
          <button
            type="button"
            className="au-atlas-settings"
            aria-expanded={settingsOpen}
            aria-controls={extras}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <span>{words.travelSettings}</span>
            <AtlasIcon name="chevron-down" className="au-atlas-settings__caret" />
          </button>
        )}
        <div className="au-atlas-settings__body" id={extras} hidden={!settingsOpen && speedValid}>
          {plan.mode === 'ship' && (
            <>
              <label className="au-atlas-hidden" htmlFor={vessel}>
                {words.vessel}
              </label>
              <select
                id={vessel}
                className="au-atlas-select"
                value={plan.vessel}
                onChange={(event) => {
                  const index = Number(event.target.value)
                  if (Number.isInteger(index) && index >= 0 && index < VESSELS.length) {
                    onPlan({ vessel: index })
                  }
                }}
              >
                {vessels.map((option) => (
                  <option key={option.index} value={option.index}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          )}
          {plan.mode === 'fly' && (
            <div className="au-atlas-speed">
              <label className="au-atlas-speed__label" htmlFor={speed}>
                {words.flyingSpeed}
              </label>
              <div className="au-atlas-speed__row">
                <input
                  id={speed}
                  className="au-atlas-speed__input"
                  type="number"
                  inputMode="decimal"
                  min={0.5}
                  step={0.5}
                  value={speedText}
                  aria-invalid={!speedValid}
                  aria-describedby={speedValid ? speedUnit : `${speedUnit} ${speedError}`}
                  onChange={(event) => onSpeed(event.target.value)}
                />
                <span className="au-atlas-speed__unit" id={speedUnit}>
                  {words.flyingSpeedUnit}
                </span>
              </div>
              {!speedValid && (
                <p className="au-atlas-speed__error" id={speedError}>
                  {words.flyingSpeedInvalid}
                </p>
              )}
            </div>
          )}
          {plan.mode === 'foot' && skis && (
            <label className="au-atlas-check">
              <input
                type="checkbox"
                checked={plan.skis}
                onChange={(event) => onPlan({ skis: event.target.checked })}
              />
              <span>{skis}</span>
            </label>
          )}
          {VOYAGES.has(plan.mode) && (
            <label className="au-atlas-check">
              <input
                type="checkbox"
                checked={plan.crew}
                onChange={(event) => onPlan({ crew: event.target.checked })}
              />
              <span>{crew}</span>
            </label>
          )}
        </div>
      </div>
      <p className="au-atlas-hidden" role="status">
        {status}
      </p>
      <div className="au-atlas-journey" aria-busy={pending} data-pending={pending ? '' : undefined}>
        {outcome?.kind === 'route' && (
          <>
            <p className="au-atlas-journey__distance">
              <span className="au-atlas-journey__km">{outcome.distance}</span>{' '}
              <span className="au-atlas-journey__measure">{outcome.measure}</span>
            </p>
            <Cards cards={outcome.cards} book={book} />
            {outcome.breakdown && <Breakdown breakdown={outcome.breakdown} />}
          </>
        )}
        {outcome?.kind === 'failure' && (
          <p className="au-atlas-journey__error">{outcome.message}</p>
        )}
      </div>
      <footer className="au-atlas-travel__rules">
        <BookText className="au-atlas-travel__rule" template={book.rule} />
        <a className="au-atlas-travel__chapter" href={chapter.href}>
          {words.fullChapter(chapter.title)}
        </a>
      </footer>
    </motion.div>
  )
}
