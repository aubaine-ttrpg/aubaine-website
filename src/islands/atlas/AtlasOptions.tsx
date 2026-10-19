import { type KeyboardEvent, useId, useMemo, useRef, useState } from 'react'
import {
  EFFECT_GROUPS,
  LABEL_GROUPS,
  type MapDisplay,
  ROUTE_LAYERS,
} from '../../lib/atlas/contract/display'
import { QUALITY_CHOICES, type QualityChoice, type Tier } from '../../lib/atlas/contract/quality'
import type { Vocabulary } from '../../lib/atlas/world/model'
import { companionAngle, type StarPair } from '../../lib/atlas/world/stars'
import { HTML_LANG, type Locale } from '../../lib/i18n/locales'
import { SOUND_CATEGORIES, type SoundPreferences } from '../../scripts/sound-preferences'
import { AtlasIcon, type IconName } from './AtlasIcon'
import { word } from './describe'
import type { AtlasWords } from './measures'
import type { AtlasSettings } from './settings'

export const OPTION_CATEGORIES = ['graphics', 'sound', 'map', 'sky'] as const
type Category = (typeof OPTION_CATEGORIES)[number]

const CATEGORY_ICONS: Readonly<Record<Category, IconName>> = {
  graphics: 'monitor',
  sound: 'volume-high',
  map: 'layers-outline',
  sky: 'weather-sunset',
}

const MINUTES_PER_HOUR = 60

const PERCENT = 100
const VOLUME_STEP = 5

type Props = {
  words: AtlasWords
  locale: Locale
  vocabulary: Vocabulary
  pair: StarPair | undefined
  settings: AtlasSettings
  onSettings: (patch: Partial<AtlasSettings>) => void
  sound: SoundPreferences
  onSound: (patch: Partial<SoundPreferences>) => void
  animated: boolean
  onAnimated: (on: boolean) => void
  autoTier: Tier | undefined
  hour: number
  onHour: (hour: number) => void
  season: number
  onSeason: (season: number) => void
  underground: boolean
  parchment: boolean
}

function clock(words: AtlasWords, hour: number): string {
  let hours = Math.floor(hour)
  let minutes = Math.round((hour - hours) * MINUTES_PER_HOUR)
  if (minutes === MINUTES_PER_HOUR) {
    hours += 1
    minutes = 0
  }
  return words.clock(String(hours % 24).padStart(2, '0'), String(minutes).padStart(2, '0'))
}

function pressed(values: readonly boolean[]): boolean | 'mixed' {
  if (values.every(Boolean)) return true
  if (!values.some(Boolean)) return false
  return 'mixed'
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string
  on: boolean | 'mixed'
  onChange: (on: boolean) => void
}) {
  return (
    <button
      type="button"
      className="au-atlas-toggle"
      aria-pressed={on}
      onClick={() => onChange(on !== true)}
    >
      <svg className="au-atlas-toggle__mark" viewBox="0 0 26 30" aria-hidden="true">
        <polygon points="13,2 24,8.5 24,21.5 13,28 2,21.5 2,8.5" />
      </svg>
      <span>{label}</span>
    </button>
  )
}

function Group<K extends string>({
  words,
  label,
  keys,
  names,
  values,
  note,
  onChange,
}: {
  words: AtlasWords
  label: string
  keys: readonly K[]
  names: (key: K) => string
  values: Readonly<Record<K, boolean>>
  note: string | undefined
  onChange: (values: Record<K, boolean>) => void
}) {
  const [open, setOpen] = useState(false)
  const list = useId()
  const state = pressed(keys.map((key) => values[key]))
  const all = (on: boolean) => {
    const next: Record<K, boolean> = { ...values }
    for (const key of keys) next[key] = on
    onChange(next)
  }
  return (
    <li className="au-atlas-group">
      <div className="au-atlas-group__row">
        <Toggle label={label} on={state} onChange={all} />
        <button
          type="button"
          className="au-atlas-round au-atlas-round--small"
          aria-label={words.details(label)}
          data-tooltip={words.details(label)}
          aria-expanded={open}
          aria-controls={list}
          onClick={() => setOpen(!open)}
        >
          <AtlasIcon name="chevron-down" className="au-atlas-group__caret" />
        </button>
      </div>
      {note && <p className="au-atlas-range__note">{note}</p>}
      <ul className="au-atlas-group__list" id={list} hidden={!open}>
        {keys.map((key) => (
          <li key={key}>
            <Toggle
              label={names(key)}
              on={values[key]}
              onChange={(on) => onChange({ ...values, [key]: on })}
            />
          </li>
        ))}
      </ul>
    </li>
  )
}

function Range({
  label,
  value,
  min,
  max,
  step,
  text,
  shown,
  disabled,
  note,
  tone,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  text: string
  shown: string
  disabled: boolean
  note: string | undefined
  tone: 'sky' | 'plain'
  onChange: (value: number) => void
}) {
  const input = useId()
  const hint = useId()
  return (
    <div className="au-atlas-range" data-tone={tone}>
      <div className="au-atlas-range__row">
        <label htmlFor={input}>{label}</label>
        <output htmlFor={input}>{shown}</output>
      </div>
      <input
        id={input}
        className="au-atlas-range__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={text}
        aria-describedby={note ? hint : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {note && (
        <p className="au-atlas-range__note" id={hint}>
          {note}
        </p>
      )}
    </div>
  )
}

export function AtlasOptions({
  words,
  locale,
  vocabulary,
  pair,
  settings,
  onSettings,
  sound,
  onSound,
  animated,
  onAnimated,
  autoTier,
  hour,
  onHour,
  season,
  onSeason,
  underground,
  parchment,
}: Props) {
  const [category, setCategory] = useState<Category>('graphics')
  const tabs = useRef(new Map<Category, HTMLButtonElement>())
  const ids = { tab: useId(), panel: useId(), quality: useId() }
  const display = settings.display
  const show = (patch: Partial<MapDisplay>) => onSettings({ display: { ...display, ...patch } })
  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = OPTION_CATEGORIES.indexOf(category)
    const last = OPTION_CATEGORIES.length - 1
    const next =
      event.key === 'ArrowRight'
        ? OPTION_CATEGORIES[index === last ? 0 : index + 1]
        : event.key === 'ArrowLeft'
          ? OPTION_CATEGORIES[index === 0 ? last : index - 1]
          : event.key === 'Home'
            ? OPTION_CATEGORIES[0]
            : event.key === 'End'
              ? OPTION_CATEGORIES[last]
              : undefined
    if (!next) return
    event.preventDefault()
    setCategory(next)
    tabs.current.get(next)?.focus()
  }
  const degrees = pair ? String(Math.round(companionAngle(pair, season))) : ''
  const percent = useMemo(
    () => new Intl.NumberFormat(HTML_LANG[locale], { style: 'percent' }),
    [locale],
  )
  const volumeRange = (label: string, volume: number, onVolume: (volume: number) => void) => (
    <Range
      key={label}
      label={label}
      value={Math.round(volume * PERCENT)}
      min={0}
      max={PERCENT}
      step={VOLUME_STEP}
      text={percent.format(volume)}
      shown={percent.format(volume)}
      disabled={false}
      note={undefined}
      tone="plain"
      onChange={(value) => onVolume(value / PERCENT)}
    />
  )

  return (
    <div className="au-atlas-options">
      <div className="au-atlas-categories" role="tablist" aria-label={words.optionCategories}>
        {OPTION_CATEGORIES.map((entry) => (
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
            aria-selected={category === entry}
            aria-controls={ids.panel}
            tabIndex={category === entry ? 0 : -1}
            onClick={() => setCategory(entry)}
            onKeyDown={onKey}
          >
            <span className="au-atlas-round au-atlas-round--quiet" aria-hidden="true">
              <AtlasIcon name={CATEGORY_ICONS[entry]} />
            </span>
            <span className="au-atlas-category__name">{words.categories[entry]}</span>
          </button>
        ))}
      </div>
      <div
        className="au-atlas-options__panel"
        role="tabpanel"
        id={ids.panel}
        aria-labelledby={`${ids.tab}-${category}`}
      >
        {category === 'graphics' && (
          <>
            <span className="au-atlas-options__label" id={ids.quality}>
              {words.quality}
            </span>
            <div className="au-atlas-segmented" role="radiogroup" aria-labelledby={ids.quality}>
              {QUALITY_CHOICES.map((choice: QualityChoice) => (
                <label key={choice} className="au-atlas-segmented__option">
                  <input
                    type="radio"
                    className="au-atlas-radio"
                    name={ids.quality}
                    value={choice}
                    checked={settings.quality === choice}
                    onChange={() => onSettings({ quality: choice })}
                  />
                  <span>{words.qualities[choice]}</span>
                </label>
              ))}
            </div>
            {settings.quality === 'auto' && autoTier && (
              <p className="au-atlas-options__note">{words.autoTier(words.qualities[autoTier])}</p>
            )}
            <ul className="au-atlas-options__list">
              <li>
                <Toggle
                  label={words.screenEffect}
                  on={settings.screen}
                  onChange={(screen) => onSettings({ screen })}
                />
              </li>
              <li>
                <Toggle label={words.animations} on={animated} onChange={onAnimated} />
              </li>
            </ul>
          </>
        )}
        {category === 'sound' && (
          <>
            <ul className="au-atlas-options__list">
              <li>
                <Toggle
                  label={words.sound}
                  on={!sound.muted}
                  onChange={(on) => onSound({ muted: !on })}
                />
              </li>
            </ul>
            {volumeRange(words.masterVolume, sound.master, (master) => onSound({ master }))}
            {SOUND_CATEGORIES.map((entry) =>
              volumeRange(words.soundLevels[entry], sound.levels[entry], (level) =>
                onSound({ levels: { ...sound.levels, [entry]: level } }),
              ),
            )}
          </>
        )}
        {category === 'map' && (
          <ul className="au-atlas-options__list">
            <Group
              words={words}
              label={words.display.labels}
              keys={LABEL_GROUPS}
              names={(key) => words.labelGroups[key]}
              values={display.labels}
              note={undefined}
              onChange={(labels) => show({ labels })}
            />
            <li>
              <Toggle
                label={words.display.borders}
                on={display.borders}
                onChange={(borders) => show({ borders })}
              />
            </li>
            <li>
              <Toggle
                label={words.display.grid}
                on={display.grid}
                onChange={(grid) => show({ grid })}
              />
            </li>
            <Group
              words={words}
              label={words.display.routes}
              keys={ROUTE_LAYERS}
              names={(key) => word(vocabulary.routeKinds, key, 'route kind').label}
              values={display.routes}
              note={undefined}
              onChange={(routes) => show({ routes })}
            />
            <Group
              words={words}
              label={words.display.effects}
              keys={EFFECT_GROUPS}
              names={(key) => words.effectGroups[key]}
              values={display.effects}
              note={parchment ? words.effectsOnParchment : undefined}
              onChange={(effects) => show({ effects })}
            />
          </ul>
        )}
        {category === 'sky' && (
          <>
            <Range
              label={words.time}
              value={hour}
              min={0}
              max={24}
              step={0.1}
              text={clock(words, hour)}
              shown={clock(words, hour)}
              disabled={underground}
              note={underground ? words.skyUnderground : undefined}
              tone="sky"
              onChange={onHour}
            />
            <Range
              label={words.season}
              value={season}
              min={0}
              max={1}
              step={0.005}
              text={words.seasonText(degrees)}
              shown={words.seasonValue(degrees)}
              disabled={underground || !pair}
              note={undefined}
              tone="plain"
              onChange={onSeason}
            />
          </>
        )}
      </div>
    </div>
  )
}
