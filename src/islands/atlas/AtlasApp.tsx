import { MotionConfig } from 'motion/react'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { DEFAULT_VIEW, type View } from '../../lib/atlas/contract/camera'
import { DEFAULT_HOUR, DEFAULT_SEASON } from '../../lib/atlas/contract/time-of-day'
import type { Hud } from '../../lib/atlas/engine/hud'
import { levelOf } from '../../lib/atlas/engine/selection'
import { type AtlasRef, formatHash, parseHash, refKey } from '../../lib/atlas/world/refs'
import type { TravelRequest, TravelResult } from '../../lib/atlas/world/travel'
import type { BadgedStatus } from '../../lib/game/status'
import { strings } from '../../lib/i18n/strings'
import {
  onSoundPreferences,
  setSoundPreferences,
  soundPreferences,
} from '../../scripts/sound-preferences'
import { AtlasOptions } from './AtlasOptions'
import type { AtlasBook } from './book'
import { Cartouche } from './Cartouche'
import type { AtlasClient } from './client'
import {
  createGazetteer,
  describeRef,
  featuredEntries,
  findEntries,
  placeEntries,
} from './describe'
import { useFocusRequest } from './focus'
import {
  defaultFlyingSpeed,
  type Endpoint,
  type JourneyPlan,
  type JourneyView,
  journeyView,
  readFlyingSpeed,
  travelRequest,
} from './journey'
import { LegendPanel, LegendToggle } from './Legend'
import { LevelBar } from './LevelBar'
import { HoveredPlace, MapTooltip } from './MapTooltip'
import { PickBanner } from './PickBanner'
import { PlaceFinder } from './PlaceFinder'
import { PlaceSheet } from './PlaceSheet'
import type { AtlasProps, AtlasWorldCard } from './props'
import { type Pane, Sidebar } from './Sidebar'
import { StyleSwitch } from './StyleSwitch'
import {
  type AtlasSettings,
  storedSettings,
  storedView,
  storeSettings,
  storeView,
} from './settings'
import type { AtlasSound } from './sound'
import { TravelPlanner } from './TravelPlanner'
import { ViewBar } from './ViewBar'

type AppProps = {
  client: AtlasClient
  sound: AtlasSound
  props: AtlasProps
  book: AtlasBook
  world: AtlasWorldCard
  onSwitch: (key: string) => void
}

type Origin = 'map' | 'panel' | 'link'
type Selection = { ref: AtlasRef; focus: boolean; origin: Origin }
type Plan = Omit<JourneyPlan, 'flyingSpeed'>
type Journey = { request: TravelRequest; result: TravelResult }

const EMPTY_PLAN: Plan = {
  from: undefined,
  to: undefined,
  mode: 'foot',
  vessel: 0,
  skis: false,
  crew: false,
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function writeHash(hash: string): void {
  const url = new URL(window.location.href)
  url.hash = hash
  window.history.replaceState(window.history.state, '', url)
}

export function AtlasApp({ client, sound, props, book, world: shown, onSwitch }: AppProps) {
  const snapshot = useSyncExternalStore(client.subscribe, client.read)
  const listening = useSyncExternalStore(onSoundPreferences, soundPreferences)
  const { world, grid, stars, engine, state, readyLevels, autoTier } = snapshot
  const all = strings(props.locale)
  const t = all.atlas

  const map = useRef<HTMLDivElement>(null)
  const tooltip = useRef<HTMLDivElement>(null)
  const compass = useRef<HTMLSpanElement>(null)
  const scaleBar = useRef<HTMLSpanElement>(null)
  const scaleText = useRef<HTMLSpanElement>(null)
  const sheetHeading = useRef<HTMLHeadingElement>(null)
  const travelHeading = useRef<HTMLHeadingElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const placeToggle = useRef<HTMLButtonElement>(null)
  const travelToggle = useRef<HTMLButtonElement>(null)
  const optionsToggle = useRef<HTMLButtonElement>(null)
  const pickOrigin = useRef<HTMLButtonElement | null>(null)
  const routeHeard = useRef<string | undefined>(undefined)
  const legendPanel = useId()
  const sidePanel = useId()
  const unavailable = useId()
  const requestFocus = useFocusRequest()

  const [selection, setSelection] = useState<Selection>()
  const [notice, setNotice] = useState('')
  const [pane, setPane] = useState<Pane | undefined>(() =>
    snapshot.state === 'map-unavailable' ? 'place' : undefined,
  )
  const [view, setView] = useState<View>(() => storedView() ?? DEFAULT_VIEW)
  const [level, setLevel] = useState(0)
  const [settings, setSettings] = useState<AtlasSettings>(storedSettings)
  const [animated, setAnimated] = useState(() => !prefersReducedMotion())
  const [hour, setHour] = useState(DEFAULT_HOUR)
  const [season, setSeason] = useState(DEFAULT_SEASON)
  const [hovered] = useState(() => new HoveredPlace())
  const [picking, setPicking] = useState<Endpoint>()
  const [plan, setPlan] = useState(EMPTY_PLAN)
  const [speedText, setSpeedText] = useState<string>()
  const [journey, setJourney] = useState<Journey>()

  const gazetteer = useMemo(
    () =>
      world && grid
        ? createGazetteer({
            world,
            grid,
            locale: props.locale,
            words: t,
            paces: props.paces,
            terrains: props.terrains,
          })
        : undefined,
    [world, grid, props.locale, props.paces, props.terrains, t],
  )
  const sheet = useMemo(
    () => (gazetteer && selection ? describeRef(gazetteer, selection.ref) : undefined),
    [gazetteer, selection],
  )
  const featured = useMemo(() => (gazetteer ? featuredEntries(gazetteer) : []), [gazetteer])
  const entries = useMemo(() => (gazetteer ? placeEntries(gazetteer) : []), [gazetteer])
  const find = useCallback(
    (query: string) => (gazetteer ? findEntries(gazetteer, entries, query) : []),
    [gazetteer, entries],
  )
  const levels = useMemo(
    () => [0, ...(world?.underground.map((record) => record.level) ?? [])].sort((a, b) => a - b),
    [world],
  )
  const defaultSpeed = gazetteer ? defaultFlyingSpeed(gazetteer) : undefined
  const speed = speedText === undefined ? defaultSpeed : readFlyingSpeed(speedText)
  const request = useMemo(
    () => (gazetteer ? travelRequest(gazetteer, { ...plan, flyingSpeed: speed }) : undefined),
    [gazetteer, plan, speed],
  )
  const pending = request !== undefined && journey?.request !== request
  const oneEnd = (plan.from === undefined) !== (plan.to === undefined)
  const outcome: JourneyView | undefined =
    gazetteer && request && journey
      ? journeyView(gazetteer, journey.request, journey.result)
      : oneEnd
        ? { kind: 'failure', message: t.failures.missing }
        : undefined
  const status = pending
    ? t.computing
    : outcome?.kind === 'route'
      ? outcome.announcement
      : (outcome?.message ?? '')
  const shownResult = request ? journey?.result : undefined
  const mapShown = state !== 'map-unavailable'
  const { style, legend } = settings
  const parchment = style === 'parchment'
  const levelBusy = level > 0 && !readyLevels.has(level) && !parchment
  const toggles = { place: placeToggle, travel: travelToggle, options: optionsToggle }
  const badgeLabels: Record<BadgedStatus, string> = {
    draft: all.draft,
    playtest: all.playtest,
    beta: all.beta,
  }
  const badge = shown.badge ? { status: shown.badge, label: badgeLabels[shown.badge] } : undefined

  function focusInSheet(): boolean {
    const article = sheetHeading.current?.closest('article')
    return article?.contains(document.activeElement) ?? false
  }

  function clearSelection() {
    if (!selection) return
    setSelection(undefined)
    setNotice(t.sheetClosed)
    writeHash('')
  }

  function choose(ref: AtlasRef | undefined, focus: boolean, origin: Origin) {
    if (!ref) {
      clearSelection()
      return
    }
    setSelection({ ref, focus, origin })
    setPane('place')
    if (origin !== 'link' && world && grid) writeHash(formatHash(ref, world, grid))
    const shown = gazetteer && describeRef(gazetteer, ref)
    setNotice(shown ? t.sheetShown(shown.title, shown.eyebrow) : '')
    if (origin === 'panel') requestFocus(sheetHeading)
  }

  function endPick() {
    setPicking(undefined)
    const origin = pickOrigin.current
    pickOrigin.current = null
    origin?.focus()
  }

  function startPick(end: Endpoint, origin: HTMLButtonElement) {
    if (picking === end) {
      endPick()
      return
    }
    pickOrigin.current = origin
    setPicking(end)
  }

  function dismiss() {
    if (picking) {
      endPick()
      return
    }
    if (!selection) return
    const refocus = focusInSheet()
    clearSelection()
    if (refocus) requestFocus(search)
  }

  function setEndpoint(end: Endpoint, ref: AtlasRef | undefined) {
    setPlan((current) => (end === 'from' ? { ...current, from: ref } : { ...current, to: ref }))
  }

  function openPlanner() {
    setPane('travel')
    requestFocus(travelHeading)
  }

  function updateSettings(patch: Partial<AtlasSettings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    storeSettings(next)
    if (patch.quality) client.setQuality(patch.quality)
  }

  function changeLevel(next: number) {
    if (next === level) return
    engine?.setLevel(next)
    const current = selection?.ref
    if (!current || !world) return
    if (current.kind === 'tile' || current.kind === 'under') {
      choose(
        next > 0
          ? { kind: 'under', level: next, tile: current.tile }
          : { kind: 'tile', tile: current.tile },
        false,
        'map',
      )
    } else if (levelOf(world, current) !== next) clearSelection()
  }

  const onView = useEffectEvent((next: View) => {
    setView(next)
    storeView(next)
  })
  const onLevel = useEffectEvent((next: number) => {
    setLevel(next)
    if (next > 0 && !readyLevels.has(next)) client.askLevel(next)
  })
  function openPane(next: Pane | undefined) {
    sound.cue(next ? 'open' : 'close')
    setPane(next)
  }

  function chooseFromPanel(ref: AtlasRef) {
    sound.cue('select')
    choose(ref, true, 'panel')
  }

  const onSelect = useEffectEvent((ref: AtlasRef | undefined, focus: boolean) => {
    if (ref) sound.cue('select')
    choose(ref, focus, 'map')
  })
  const onPick = useEffectEvent((ref: AtlasRef) => {
    if (!picking) return
    sound.cue('select')
    setEndpoint(picking, ref)
    endPick()
  })
  const onRoute = useEffectEvent((request: TravelRequest, result: TravelResult) => {
    setJourney({ request, result })
    const route = `${refKey(request.from)} ${refKey(request.to)}`
    if (!result.ok || route === routeHeard.current) return
    routeHeard.current = route
    sound.cue('route')
  })
  const onEscape = useEffectEvent(() => dismiss())
  const onRootKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    if (event.target instanceof HTMLCanvasElement) return
    dismiss()
  })
  const followLink = useEffectEvent(() => {
    if (!world || !grid) return
    const ref = parseHash(window.location.hash, world, grid)
    if (ref && (engine?.discovered(ref) ?? true)) choose(ref, true, 'link')
  })

  const label = parchment ? t.parchmentLabel(shown.name) : t.mapLabel(shown.name)
  useEffect(() => {
    const container = map.current
    if (!container || !world) return
    client.attach(container, {
      label,
      unexploredLabel: t.unexplored,
      view,
      style,
      animated,
      display: settings.display,
      screen: settings.screen,
      events: {
        view: (next) => onView(next),
        level: (next) => onLevel(next),
        select: (ref, focus) => onSelect(ref, focus),
        pick: (ref) => onPick(ref),
        hover: (target) => hovered.set(target),
        escape: () => onEscape(),
      },
    })
  }, [client, world, label, t.unexplored, view, style, animated, hovered, settings])

  useEffect(() => {
    if (!engine) return
    const hud: Hud = {}
    if (compass.current) hud.compass = compass.current
    if (scaleBar.current) hud.scaleBar = scaleBar.current
    if (scaleText.current) hud.scaleText = scaleText.current
    engine.bindHud(hud)
    engine.bindTooltip(tooltip.current ?? undefined)
  }, [engine])

  useEffect(() => (engine ? sound.attach(engine) : undefined), [sound, engine])

  useEffect(() => {
    engine?.select(selection?.ref, selection?.focus ?? false)
  }, [engine, selection])

  useEffect(() => {
    engine?.setDisplay(settings.display)
  }, [engine, settings.display])

  useEffect(() => {
    engine?.setScreenEffect(settings.screen)
  }, [engine, settings.screen])

  useEffect(() => {
    engine?.setStyle(style)
  }, [engine, style])

  useEffect(() => {
    engine?.setLabel(label)
  }, [engine, label])

  useEffect(() => {
    engine?.setSky(hour, season)
  }, [engine, hour, season])

  useEffect(() => {
    engine?.setAnimated(animated)
  }, [engine, animated])

  useEffect(() => {
    engine?.setPicking(picking !== undefined)
  }, [engine, picking])

  useEffect(() => {
    if (!engine) return
    if (shownResult?.ok) engine.showTravel(shownResult)
    else engine.clearTravel()
  }, [engine, shownResult])

  useEffect(() => {
    if (!request) return
    let live = true
    void client.travel(request).then((result) => {
      if (live) onRoute(request, result)
    })
    return () => {
      live = false
    }
  }, [client, request])

  useEffect(() => {
    if (!world) return
    followLink()
    const listener = () => followLink()
    window.addEventListener('hashchange', listener)
    return () => window.removeEventListener('hashchange', listener)
  }, [world])

  useEffect(() => {
    const root = map.current?.parentElement
    if (!root) return
    const listener = (event: KeyboardEvent) => onRootKey(event)
    root.addEventListener('keydown', listener)
    return () => root.removeEventListener('keydown', listener)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="au-atlas-ui" data-side={pane ? 'open' : 'closed'} data-style={style}>
        <div className="au-atlas-column">
          <Cartouche
            words={t}
            world={shown.name}
            badge={badge}
            hexScale={
              gazetteer && mapShown
                ? t.hexScale(gazetteer.measures.number(gazetteer.world.hexKm, 1))
                : undefined
            }
            scaleBar={scaleBar}
            scaleText={scaleText}
          />
        </div>
        {state === 'map-unavailable' && (
          <section className="au-atlas-unavailable" aria-labelledby={unavailable}>
            <h2 className="au-atlas-unavailable__title" id={unavailable}>
              {t.unavailableTitle}
            </h2>
            <p className="au-atlas-unavailable__body">{t.unavailableBody}</p>
          </section>
        )}
        {gazetteer && (
          <>
            <Sidebar
              words={t}
              locale={props.locale}
              worlds={props.worlds}
              current={shown}
              badgeLabels={badgeLabels}
              onSwitch={onSwitch}
              levels={
                mapShown ? (
                  <LevelBar
                    words={t}
                    levels={levels}
                    level={level}
                    busy={levelBusy}
                    onLevel={changeLevel}
                  />
                ) : null
              }
              muted={mapShown ? listening.muted : undefined}
              onMuted={(muted) => setSoundPreferences({ muted })}
              open={pane}
              panel={sidePanel}
              toggles={toggles}
              onOpen={openPane}
              panes={{
                place: (
                  <PlaceFinder
                    words={t}
                    featured={featured}
                    find={find}
                    search={search}
                    onChoose={chooseFromPanel}
                  >
                    {sheet && selection ? (
                      <PlaceSheet
                        key={refKey(selection.ref)}
                        words={t}
                        sheet={sheet}
                        heading={sheetHeading}
                        canCentre={engine !== undefined}
                        onChoose={chooseFromPanel}
                        onFrom={() => {
                          setEndpoint('from', selection.ref)
                          openPlanner()
                        }}
                        onTo={() => {
                          setEndpoint('to', selection.ref)
                          openPlanner()
                        }}
                        onCentre={() => setSelection({ ...selection, focus: true })}
                        onClose={() => {
                          clearSelection()
                          requestFocus(search)
                        }}
                      />
                    ) : undefined}
                  </PlaceFinder>
                ),
                travel: (
                  <TravelPlanner
                    words={t}
                    gazetteer={gazetteer}
                    book={book}
                    chapter={props.chapter}
                    plan={{ ...plan, flyingSpeed: speed }}
                    speedText={speedText ?? String(defaultSpeed ?? '')}
                    speedValid={plan.mode !== 'fly' || speed !== undefined}
                    outcome={outcome}
                    status={status}
                    pending={pending}
                    picking={picking}
                    heading={travelHeading}
                    onEndpoint={setEndpoint}
                    onPick={startPick}
                    onSwap={() =>
                      setPlan((current) => ({ ...current, from: current.to, to: current.from }))
                    }
                    onPlan={(patch) => setPlan((current) => ({ ...current, ...patch }))}
                    onSpeed={setSpeedText}
                  />
                ),
                options: mapShown ? (
                  <AtlasOptions
                    words={t}
                    locale={props.locale}
                    vocabulary={gazetteer.world.vocabulary}
                    pair={stars?.pair}
                    settings={settings}
                    onSettings={updateSettings}
                    sound={listening}
                    onSound={setSoundPreferences}
                    animated={animated}
                    onAnimated={setAnimated}
                    autoTier={autoTier}
                    hour={hour}
                    onHour={setHour}
                    season={season}
                    onSeason={setSeason}
                    underground={level > 0}
                    parchment={parchment}
                  />
                ) : undefined,
              }}
            />
            {mapShown && (
              <div className="au-atlas-dock">
                {legend && (
                  <LegendPanel
                    words={t}
                    vocabulary={gazetteer.world.vocabulary}
                    id={legendPanel}
                    style={style}
                    underground={level > 0}
                  />
                )}
                <div className="au-atlas-dock__bars">
                  <StyleSwitch
                    words={t}
                    style={style}
                    onPrepare={() => engine?.prepareParchment()}
                    onStyle={(next) => updateSettings({ style: next })}
                  />
                  <ViewBar
                    words={t}
                    view={view}
                    locked={parchment}
                    onView={(next) => engine?.setView(next)}
                    onZoom={(factor) => engine?.zoom(factor)}
                    onNorth={() => engine?.resetNorth()}
                    compass={compass}
                  />
                </div>
                <div className="au-atlas-dock__row">
                  <LegendToggle
                    words={t}
                    open={legend}
                    controls={legendPanel}
                    onToggle={(open) => updateSettings({ legend: open })}
                  />
                  <p className="au-atlas-hint">{t.controls[parchment ? 'parchment' : view]}</p>
                </div>
              </div>
            )}
            <PickBanner words={t} picking={picking} onCancel={endPick} />
          </>
        )}
        <p className="au-atlas-hidden" aria-live="polite">
          {notice}
        </p>
      </div>
      <div className="au-atlas__map" ref={map} />
      <MapTooltip hovered={hovered} gazetteer={gazetteer} element={tooltip} />
    </MotionConfig>
  )
}
