import { useEffect, useRef, useState } from 'react'

import {
  ALMANACH_ASSETS,
  ALMANACH_BOOTS,
  ALMANACH_CRYSTAL_BOOTS,
  ALMANACH_FINISHES,
  ALMANACH_FIT,
  ALMANACH_FITS,
  ALMANACH_MAGICS,
  ALMANACH_MODEL,
  ALMANACH_PAGE_BOOT,
  ALMANACH_STYLE,
  ALMANACH_STYLE_FIELDS,
  ALMANACH_STYLE_ID,
  type AlmanachBoot,
  type AlmanachColour,
  type AlmanachFinishName,
  type AlmanachFit,
  type AlmanachMagic,
  type AlmanachStyle,
  isAlmanachColour,
  isPortraitSource,
} from '../lib/art-effect/almanach-look'
import type { Locale } from '../lib/i18n/locales'
import { strings } from '../lib/i18n/strings'
import {
  ALMANACH_FINISH,
  type Almanach,
  type AlmanachLook,
  type AlmanachPicture,
  AlmanachUnavailable,
  mountAlmanach,
} from '../scripts/art-effect/almanach'
import {
  BOOT_NAMES,
  CLASSIC_GEMS,
  CRYSTAL_BOOT_NAMES,
  ELEMENTAL_GEMS,
  FINISH_NAMES,
  LIGHT_SWATCHES,
  WORKBENCH,
} from './copy'

export type WorkbenchMagic = { readonly magic: AlmanachMagic; readonly name: string }

export type WorkbenchArt = {
  readonly file: string
  readonly alt: string
  readonly thumb: string
  readonly full: string
}

type Props = {
  readonly arts: readonly WorkbenchArt[]
  readonly styles: Readonly<Record<string, AlmanachStyle>>
  readonly magics: readonly WorkbenchMagic[]
}

type Channel = {
  readonly key: string
  readonly src: string
  readonly alt: string
  readonly file: string | undefined
}

type Framing = { readonly fit: AlmanachFit; readonly focus: readonly [number, number] }

type Part = 'metal' | 'trim' | 'grip' | 'gem' | 'magic' | 'light'

type Family = 'metals' | 'woods' | 'leathers'

type Option = { readonly value: string; readonly name: string; readonly chip: string }

type Group = { readonly title: string; readonly options: readonly Option[] }

type Rgb = readonly [number, number, number]

type GlossPart = 'metal' | 'trim' | 'grip'

const PARTS: readonly Part[] = ['metal', 'trim', 'grip', 'gem', 'magic', 'light']
const FAMILIES: readonly Family[] = ['metals', 'woods', 'leathers']
const SOUND_LEVEL = 0.35
const FOCUS_CENTRE: readonly [number, number] = [0.5, 0.5]
const BRASS: readonly Rgb[] = [
  [32, 21, 13],
  [106, 58, 17],
  [203, 148, 58],
  [244, 221, 135],
]
const STEEL: readonly Rgb[] = [
  [20, 22, 26],
  [92, 96, 104],
  [168, 172, 180],
  [226, 228, 232],
]
const MAGIC_CHIPS: Readonly<Record<AlmanachMagic | 'none', string>> = {
  none: 'linear-gradient(135deg, #3a3d48, #15161b 60%, #0b0b0e)',
  fire: 'radial-gradient(circle at 50% 55%, #fff2b0 0 8%, #ff9a2e 22%, #e2410f 45%, #3a0a02 78%)',
  water: 'radial-gradient(circle at 50% 30%, #bfeaff 0 6%, #3a9bff 26%, #0c3c8a 58%, #03112b 88%)',
  wind: 'radial-gradient(circle, #ffffff 0 6%, #c4f2ff 22%, #4fa9c4 52%, #0c2a33 85%)',
  earth: 'radial-gradient(circle, #ffcf7a 0 6%, #d9822b 20%, #5a2e12 50%, #1c0f07 80%)',
  thunder: 'radial-gradient(circle, #ffffff 0 5%, #a9b0ff 16%, #4a3fd6 40%, #0d0b2e 78%)',
  slime: 'radial-gradient(circle at 40% 40%, #fbff9a 0 8%, #a6e22a 26%, #3f7a0a 55%, #0d1c02 85%)',
  light: 'radial-gradient(circle, #fffbe6 0 8%, #ffd76a 26%, #c47f1c 55%, #2e1904 88%)',
  void: 'radial-gradient(circle, #000000 0 18%, #b06bff 30%, #4b14a8 52%, #12032a 85%)',
  blood: 'radial-gradient(circle, #ff8a8a 0 6%, #d0102a 24%, #5a0410 55%, #1a0004 85%)',
  necrotic:
    'radial-gradient(circle at 50% 70%, #c8ff9a 0 6%, #3fbf5a 24%, #10462a 55%, #030f08 85%)',
  ether: 'radial-gradient(circle, #ffffff 0 5%, #8fa6ff 16%, #2a3fc0 44%, #050a2e 82%)',
  psychic: 'radial-gradient(circle, #ffd6f2 0 6%, #e0479a 26%, #6a0f50 56%, #1c0316 86%)',
  nature: 'radial-gradient(circle, #e6ff9a 0 8%, #5fd23f 28%, #1d5e14 58%, #07160a 85%)',
}
const PICTURE_CHIP = 'linear-gradient(135deg, #e3b062, #7c4a8c 50%, #3f7fa8)'

function gradient(stops: readonly Rgb[]): string {
  const positions = [0, 38, 70, 100]
  const parts = stops.map(
    ([red, green, blue], index) =>
      `rgb(${Math.round(red)} ${Math.round(green)} ${Math.round(blue)}) ${positions[index] ?? 100}%`,
  )
  return `linear-gradient(135deg, ${parts.join(', ')})`
}

function lit(base: string): string {
  return `radial-gradient(circle at 34% 30%, rgb(255 255 255 / 0.55), transparent 42%), ${base}`
}

function familyOf(name: AlmanachFinishName): Family {
  const finish = ALMANACH_FINISH[name]
  if (finish === 'painted' || !finish.texture) return 'metals'
  return finish.texture.grain ? 'woods' : 'leathers'
}

function finishChip(name: AlmanachFinishName): string {
  const finish = ALMANACH_FINISH[name]
  if (finish === 'painted') return gradient(BRASS)
  if (finish.texture) {
    return `radial-gradient(circle at 34% 30%, rgb(255 255 255 / 0.35), transparent 45%), url("${ALMANACH_ASSETS}/${finish.texture.color}") center / 260% auto`
  }
  return gradient(finish.stops)
}

function finishGroups(): Group[] {
  return FAMILIES.map((family) => ({
    title: WORKBENCH.families[family],
    options: ALMANACH_FINISHES.filter((name) => familyOf(name) === family).map((name) => ({
      value: name,
      name: FINISH_NAMES[name],
      chip: finishChip(name),
    })),
  }))
}

function colourOptions(swatches: readonly { value: AlmanachColour; name: string }[]): Option[] {
  return swatches.map(({ value, name }) => ({ value, name, chip: lit(value) }))
}

function groupsFor(part: Part, magics: Props['magics']): readonly Group[] {
  switch (part) {
    case 'metal':
      return finishGroups()
    case 'trim':
      return [
        {
          title: WORKBENCH.families.painted,
          options: [{ value: 'painted', name: WORKBENCH.steel, chip: gradient(STEEL) }],
        },
        ...finishGroups(),
      ]
    case 'grip':
      return [
        {
          title: WORKBENCH.families.painted,
          options: [{ value: 'painted', name: WORKBENCH.paintedGrip, chip: lit('#2b2523') }],
        },
        ...finishGroups(),
      ]
    case 'gem':
      return [
        {
          title: WORKBENCH.classicGems,
          options: [
            { value: 'painted', name: WORKBENCH.cyan, chip: lit('#3fd2ff') },
            ...colourOptions(CLASSIC_GEMS),
          ],
        },
        { title: WORKBENCH.elementalGems, options: colourOptions(ELEMENTAL_GEMS) },
      ]
    case 'magic':
      return [
        {
          title: WORKBENCH.parts.magic,
          options: [
            { value: 'none', name: WORKBENCH.noMagic, chip: MAGIC_CHIPS.none },
            ...magics.map(({ magic, name }) => ({ value: magic, name, chip: MAGIC_CHIPS[magic] })),
          ],
        },
      ]
    case 'light':
      return [
        {
          title: WORKBENCH.parts.light,
          options: [
            { value: 'picture', name: WORKBENCH.picture, chip: PICTURE_CHIP },
            ...colourOptions(LIGHT_SWATCHES),
          ],
        },
      ]
  }
}

function patchFor(part: Part, value: string): Partial<AlmanachStyle> | undefined {
  const finish = ALMANACH_FINISHES.find((name) => name === value)
  const colour = isAlmanachColour(value) ? value : undefined
  switch (part) {
    case 'metal': {
      const metal = finish ?? colour
      return metal ? { metal } : undefined
    }
    case 'trim': {
      const trim = value === 'painted' ? 'painted' : (finish ?? colour)
      return trim ? { trim } : undefined
    }
    case 'grip': {
      const grip = value === 'painted' ? 'painted' : (finish ?? colour)
      return grip ? { grip } : undefined
    }
    case 'gem': {
      const gem = value === 'painted' ? 'painted' : colour
      return gem ? { gem } : undefined
    }
    case 'magic': {
      const magic = value === 'none' ? 'none' : ALMANACH_MAGICS.find((name) => name === value)
      return magic ? { magic } : undefined
    }
    case 'light': {
      const light = value === 'picture' ? 'picture' : colour
      return light ? { light } : undefined
    }
  }
}

function lookOf(style: AlmanachStyle): Partial<AlmanachLook> {
  return {
    metal: style.metal,
    trim: style.trim,
    grip: style.grip,
    gem: style.gem,
    magic: style.magic,
    light: style.light,
    gloss: style.gloss,
    metalGloss: style.metalGloss ?? style.gloss,
    trimGloss: style.trimGloss ?? style.gloss,
    gripGloss: style.gripGloss ?? style.gloss,
  }
}

type StyleField = (typeof ALMANACH_STYLE_FIELDS)[number]

const PART_GLOSSES: readonly StyleField[] = ['metalGloss', 'trimGloss', 'gripGloss']

function drawn(style: AlmanachStyle, field: StyleField): AlmanachStyle[StyleField] {
  return PART_GLOSSES.includes(field) ? (style[field] ?? style.gloss) : style[field]
}

function sameStyle(left: AlmanachStyle, right: AlmanachStyle | undefined): boolean {
  return (
    right !== undefined &&
    ALMANACH_STYLE_FIELDS.every((field) => drawn(left, field) === drawn(right, field))
  )
}

function channelOf(art: WorkbenchArt): Channel {
  return { key: art.file, src: art.full, alt: art.alt, file: art.file }
}

function literal(value: unknown): string {
  return typeof value === 'string' ? `"${value}"` : `{${String(value)}}`
}

function componentSnippet(
  style: AlmanachStyle,
  saved: string | undefined,
  channel: Channel | undefined,
): string {
  const picture = channel?.file
    ? `[{ art: '${channel.file}', alt: '${channel.alt.replaceAll("'", "\\'")}' }]`
    : 'pictures'
  if (saved) return `<Almanach pictures={${picture}} style="${saved}" />`
  const props = ALMANACH_STYLE_FIELDS.filter(
    (field) => drawn(style, field) !== drawn(ALMANACH_STYLE, field),
  ).map((field) => `  ${field}=${literal(drawn(style, field))}`)
  return [`<Almanach`, `  pictures={${picture}}`, ...props, '/>'].join('\n')
}

type LoreLine = { readonly kind: 'line' | 'hint'; readonly text: string }

function loreLine(
  style: AlmanachStyle,
  saved: string | undefined,
  channel: Channel | undefined,
): LoreLine {
  if (channel?.file && isPortraitSource(channel.file)) {
    return { kind: 'hint', text: WORKBENCH.lorePortrait }
  }
  const word = sameStyle(style, ALMANACH_STYLE)
    ? 'almanach'
    : saved
      ? `almanach ${saved}`
      : undefined
  if (!word || !channel?.file) return { kind: 'hint', text: WORKBENCH.loreHint }
  return { kind: 'line', text: `![${channel.alt}](../../media/art/${channel.file} "${word}")` }
}

function glossOf(style: AlmanachStyle, part: GlossPart): number {
  switch (part) {
    case 'metal':
      return style.metalGloss ?? style.gloss
    case 'trim':
      return style.trimGloss ?? style.gloss
    case 'grip':
      return style.gripGloss ?? style.gloss
  }
}

function glossPatch(part: GlossPart, gloss: number): Partial<AlmanachStyle> {
  switch (part) {
    case 'metal':
      return { metalGloss: gloss }
    case 'trim':
      return { trimGloss: gloss }
    case 'grip':
      return { gripGloss: gloss }
  }
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100
}

function Segmented<T extends string>(props: {
  readonly label: string
  readonly options: readonly T[]
  readonly names: Readonly<Record<T, string>>
  readonly value: T | undefined
  readonly onPick: (value: T) => void
}) {
  return (
    <fieldset className="au-dev-row">
      <legend>{props.label}</legend>
      <span className="au-dev-segmented">
        {props.options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={props.value === option}
            onClick={() => props.onPick(option)}
          >
            {props.names[option]}
          </button>
        ))}
      </span>
    </fieldset>
  )
}

function Gloss(props: {
  readonly label: string
  readonly value: number
  readonly onChange: (value: number) => void
}) {
  return (
    <label className="au-dev-gloss">
      <span>{props.label}</span>
      <small>{WORKBENCH.matte}</small>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(props.value * 100)}
        onChange={(event) => props.onChange(Number(event.currentTarget.value) / 100)}
      />
      <small>{WORKBENCH.glossy}</small>
      <output>{props.value.toFixed(2)}</output>
    </label>
  )
}

function CopyButton(props: { readonly text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="au-dev-pill"
      onClick={() => {
        void navigator.clipboard.writeText(props.text).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        })
      }}
    >
      {copied ? WORKBENCH.copied : WORKBENCH.copyCode}
    </button>
  )
}

export default function AlmanachWorkbench({ arts, styles, magics }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const almanach = useRef<Almanach | undefined>(undefined)
  const uploads = useRef<string[]>([])
  const dropped = useRef<((file: File) => void) | undefined>(undefined)
  const firstArt = arts[0]
  const [channels, setChannels] = useState<readonly Channel[]>(
    firstArt ? [channelOf(firstArt)] : [],
  )
  const [framing, setFraming] = useState<Readonly<Record<string, Framing>>>({})
  const [style, setStyle] = useState<AlmanachStyle>(ALMANACH_STYLE)
  const [saved, setSaved] = useState<string>('')
  const [part, setPart] = useState<Part>('metal')
  const [index, setIndex] = useState(0)
  const [power, setPower] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [motion, setMotion] = useState<'full' | 'calm'>('full')
  const [sound, setSound] = useState(false)
  const [osd, setOsd] = useState(true)
  const [controls, setControls] = useState(false)
  const [copyLocale, setCopyLocale] = useState<Locale>('fr')
  const [lighting, setLighting] = useState<'studio' | 'room'>('studio')
  const [readout, setReadout] = useState<string>(WORKBENCH.loading)
  const [message, setMessage] = useState<string>('')
  const [restored, setRestored] = useState(false)
  const latest = useRef({ style, index, motion, sound, framing })
  latest.current = { style, index, motion, sound, framing }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const named = params.get('almanach') ?? ''
    const opened = styles[named]
    if (opened) {
      setStyle(opened)
      setSaved(named)
    }
    const files = (params.get('images') ?? '').split(',').filter(Boolean)
    const picked = files.flatMap((file) => {
      const art = arts.find((each) => each.file === file)
      return art ? [channelOf(art)] : []
    })
    if (picked.length > 0) setChannels(picked)
    setRestored(true)
  }, [arts, styles])

  useEffect(() => {
    if (!restored) return
    const params = new URLSearchParams()
    if (saved) params.set('almanach', saved)
    const files = channels.flatMap((channel) => (channel.file ? [channel.file] : []))
    if (files.length > 0) params.set('images', files.join(','))
    const query = params.toString()
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}`,
    )
  }, [restored, saved, channels])

  useEffect(() => {
    const element = host.current
    if (!element || !restored || channels.length === 0) return
    const current = latest.current
    const started = performance.now()
    const pictures: AlmanachPicture[] = channels.map((channel) => {
      const frame = current.framing[channel.key]
      return {
        src: channel.src,
        alt: channel.alt,
        fit: frame?.fit ?? ALMANACH_FIT,
        ...(frame ? { focus: frame.focus } : {}),
      }
    })
    const mounted = mountAlmanach(element, {
      model: ALMANACH_MODEL,
      pictures,
      look: lookOf(current.style),
      boot: ALMANACH_PAGE_BOOT,
      crystalBoot: style.crystalBoot,
      battery: current.style.battery,
      start: Math.min(current.index, channels.length - 1),
      motion: current.motion,
      osd,
      controls,
      copy: strings(copyLocale).almanachDevice,
      ...(lighting === 'room' ? { environment: false } : {}),
      volume: current.sound ? SOUND_LEVEL : 0,
      onState: (state) => {
        setPower(state.power)
        setIndex(state.index)
        setZoom(state.zoom)
      },
    })
    almanach.current = mounted
    setReadout(WORKBENCH.loading)
    mounted.ready.then(
      () => setReadout(WORKBENCH.ready(((performance.now() - started) / 1000).toFixed(2))),
      (error: unknown) => {
        if (almanach.current !== mounted) return
        setReadout(error instanceof AlmanachUnavailable ? WORKBENCH.unavailable : WORKBENCH.failed)
      },
    )
    return () => {
      mounted.destroy()
      if (almanach.current === mounted) almanach.current = undefined
    }
  }, [restored, channels, osd, controls, copyLocale, lighting, style.crystalBoot])

  useEffect(() => {
    almanach.current?.look(lookOf(style))
  }, [style])

  useEffect(() => {
    almanach.current?.battery(style.battery)
  }, [style.battery])

  useEffect(() => {
    almanach.current?.motion(motion)
  }, [motion])

  useEffect(() => {
    almanach.current?.volume(sound ? SOUND_LEVEL : 0)
  }, [sound])

  useEffect(
    () => () => {
      for (const url of uploads.current) URL.revokeObjectURL(url)
    },
    [],
  )

  useEffect(() => {
    const element = host.current
    if (!element) return
    const hold = (event: DragEvent): void => event.preventDefault()
    const drop = (event: DragEvent): void => {
      event.preventDefault()
      const file = event.dataTransfer?.files[0]
      if (file) dropped.current?.(file)
    }
    element.addEventListener('dragover', hold)
    element.addEventListener('drop', drop)
    return () => {
      element.removeEventListener('dragover', hold)
      element.removeEventListener('drop', drop)
    }
  }, [])

  const current = channels[index]
  const frame: Framing | undefined = current
    ? (framing[current.key] ?? { fit: ALMANACH_FIT, focus: FOCUS_CENTRE })
    : undefined
  const savedStyle = saved ? styles[saved] : undefined
  const savedMatches = sameStyle(style, savedStyle)

  const update = (patch: Partial<AlmanachStyle>): void =>
    setStyle((before) => ({ ...before, ...patch }))

  const reframe = (next: Framing): void => {
    if (!current) return
    setFraming((before) => ({ ...before, [current.key]: next }))
    almanach.current?.reframe(next.fit, next.focus)
  }

  const toggleArt = (art: WorkbenchArt): void => {
    setChannels((before) =>
      before.some((channel) => channel.key === art.file)
        ? before.filter((channel) => channel.key !== art.file)
        : [...before, channelOf(art)],
    )
  }

  const addUpload = (file: File): void => {
    if (!file.type.startsWith('image/')) {
      setMessage(WORKBENCH.dropped(file.name))
      return
    }
    const src = URL.createObjectURL(file)
    uploads.current.push(src)
    setChannels((before) => [...before, { key: src, src, alt: file.name, file: undefined }])
    setIndex(channels.length)
  }

  dropped.current = addUpload

  const playBoot = (boot: AlmanachBoot): void => {
    almanach.current?.power(false)
    almanach.current?.power(true, boot)
  }

  const save = (): void => {
    const name = saved.trim()
    if (!ALMANACH_STYLE_ID.test(name)) {
      setMessage(WORKBENCH.saveFailed(WORKBENCH.saveHint))
      return
    }
    void fetch(`/__aubaine/almanachs/${name}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(style),
    }).then(
      async (response) => {
        const body: unknown = await response.json().catch(() => ({}))
        const reason =
          typeof body === 'object' && body !== null && 'error' in body ? String(body.error) : ''
        setMessage(
          response.ok
            ? WORKBENCH.saved(name)
            : WORKBENCH.saveFailed(reason || String(response.status)),
        )
      },
      (error: unknown) => setMessage(WORKBENCH.saveFailed(String(error))),
    )
  }

  const partGloss: GlossPart | undefined =
    part === 'metal' || part === 'trim' || part === 'grip' ? part : undefined
  const choosesColour = part !== 'magic'
  const component = componentSnippet(style, savedMatches ? saved : undefined, current)
  const lore = loreLine(style, savedMatches ? saved : undefined, current)
  const json = `${JSON.stringify(style, null, 2)}\n`
  const selectedValue = style[part]
  const colourValue = isAlmanachColour(selectedValue) ? selectedValue : '#5b8fd6'

  return (
    <div className="au-dev-workbench">
      <section className="au-dev-stage" aria-label={WORKBENCH.stage}>
        <div ref={host} className="au-dev-stage__host" />
        <p className="au-dev-readout" aria-live="polite">
          {WORKBENCH.weight} · {readout}
        </p>
      </section>

      <div className="au-dev-deck">
        <section className="au-dev-plate" aria-labelledby="au-dev-pictures">
          <h2 id="au-dev-pictures">{WORKBENCH.pictures}</h2>
          <p className="au-dev-hint">{WORKBENCH.picturesHint}</p>
          <div className="au-dev-arts">
            {arts.map((art) => {
              const position = channels.findIndex((channel) => channel.key === art.file)
              return (
                <button
                  key={art.file}
                  type="button"
                  className="au-dev-art"
                  aria-pressed={position >= 0}
                  title={art.file}
                  onClick={() => toggleArt(art)}
                >
                  <img src={art.thumb} alt={art.alt} />
                  {position >= 0 && <span>CH {String(position + 1).padStart(2, '0')}</span>}
                </button>
              )
            })}
            <label className="au-dev-art au-dev-upload">
              {WORKBENCH.upload}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (file) addUpload(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
          </div>
          {frame && (
            <>
              <Segmented
                label={WORKBENCH.framing}
                options={ALMANACH_FITS}
                names={{ contain: WORKBENCH.whole, cover: WORKBENCH.fill }}
                value={frame.fit}
                onPick={(fit) => reframe({ ...frame, fit })}
              />
              {frame.fit === 'cover' && (
                <div className="au-dev-focus">
                  {([0, 1] as const).map((axis) => (
                    <label key={axis}>
                      <span>{axis === 0 ? WORKBENCH.focusX : WORKBENCH.focusY}</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(frame.focus[axis] * 100)}
                        onChange={(event) => {
                          const value = Number(event.currentTarget.value) / 100
                          const focus: readonly [number, number] =
                            axis === 0 ? [value, frame.focus[1]] : [frame.focus[0], value]
                          reframe({ ...frame, focus })
                        }}
                      />
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="au-dev-plate" aria-labelledby="au-dev-tube">
          <h2 id="au-dev-tube">{WORKBENCH.tube}</h2>
          <div className="au-dev-switches">
            <button
              type="button"
              className="au-dev-switch"
              aria-pressed={power}
              onClick={() => almanach.current?.power()}
            >
              {power ? WORKBENCH.powerOff : WORKBENCH.powerOn}
            </button>
            <button
              type="button"
              className="au-dev-switch"
              aria-pressed={sound}
              onClick={() => setSound(!sound)}
            >
              {sound ? WORKBENCH.soundOn : WORKBENCH.soundOff}
            </button>
            <button
              type="button"
              className="au-dev-switch"
              aria-pressed={zoom}
              disabled={!power}
              onClick={() => almanach.current?.zoom()}
            >
              {zoom ? WORKBENCH.zoomOut : WORKBENCH.zoomIn}
            </button>
          </div>
          <Segmented
            label={WORKBENCH.motion}
            options={['full', 'calm'] as const}
            names={{ full: WORKBENCH.full, calm: WORKBENCH.calm }}
            value={motion}
            onPick={setMotion}
          />
          <Segmented
            label={WORKBENCH.play}
            options={ALMANACH_BOOTS}
            names={BOOT_NAMES}
            value={undefined}
            onPick={playBoot}
          />
          <Segmented
            label={WORKBENCH.crystalBoot}
            options={ALMANACH_CRYSTAL_BOOTS}
            names={CRYSTAL_BOOT_NAMES}
            value={style.crystalBoot}
            onPick={(crystalBoot) => update({ crystalBoot })}
          />
          <Segmented
            label={WORKBENCH.battery}
            options={['none', 'level', 'device'] as const}
            names={{
              none: WORKBENCH.batteryNone,
              level: WORKBENCH.batteryLevel,
              device: WORKBENCH.batteryDevice,
            }}
            value={
              style.battery === false ? 'none' : style.battery === 'device' ? 'device' : 'level'
            }
            onPick={(kind) =>
              update({ battery: kind === 'none' ? false : kind === 'device' ? 'device' : 72 })
            }
          />
          {typeof style.battery === 'number' && (
            <label className="au-dev-gloss">
              <span>{WORKBENCH.batteryValue}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={style.battery}
                onChange={(event) => update({ battery: Number(event.currentTarget.value) })}
              />
              <output>{style.battery} %</output>
            </label>
          )}
          <Segmented
            label={WORKBENCH.osd}
            options={['on', 'off'] as const}
            names={{ on: WORKBENCH.on, off: WORKBENCH.off }}
            value={osd ? 'on' : 'off'}
            onPick={(value) => setOsd(value === 'on')}
          />
          <Segmented
            label={WORKBENCH.controls}
            options={['on', 'off'] as const}
            names={{ on: WORKBENCH.on, off: WORKBENCH.off }}
            value={controls ? 'on' : 'off'}
            onPick={(value) => setControls(value === 'on')}
          />
          <Segmented
            label={WORKBENCH.copy}
            options={['fr', 'en'] as const}
            names={{ fr: 'Français', en: 'English' }}
            value={copyLocale}
            onPick={setCopyLocale}
          />
          <Segmented
            label={WORKBENCH.lighting}
            options={['studio', 'room'] as const}
            names={{ studio: WORKBENCH.studio, room: WORKBENCH.room }}
            value={lighting}
            onPick={setLighting}
          />
        </section>

        <section className="au-dev-plate au-dev-plate--wide" aria-labelledby="au-dev-case">
          <h2 id="au-dev-case">
            {WORKBENCH.case} <small>{WORKBENCH.caseHint}</small>
          </h2>
          <Segmented
            label={WORKBENCH.part}
            options={PARTS}
            names={WORKBENCH.parts}
            value={part}
            onPick={setPart}
          />
          <div className="au-dev-palette">
            {groupsFor(part, magics).map((group) => (
              <fieldset key={group.title} className="au-dev-family">
                <legend>{group.title}</legend>
                <div className="au-dev-swatches">
                  {group.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="au-dev-swatch"
                      aria-pressed={selectedValue === option.value}
                      onClick={() => {
                        const patch = patchFor(part, option.value)
                        if (patch) update(patch)
                      }}
                    >
                      <span className="au-dev-swatch__chip" style={{ background: option.chip }} />
                      <span>{option.name}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="au-dev-row au-dev-row--case">
            {choosesColour && (
              <label className="au-dev-colour">
                <span>{WORKBENCH.anyColour}</span>
                <input
                  type="color"
                  value={colourValue}
                  onChange={(event) => {
                    const patch = patchFor(part, event.currentTarget.value)
                    if (patch) update(patch)
                  }}
                />
              </label>
            )}
            {partGloss && (
              <Gloss
                label={WORKBENCH.gloss[partGloss]}
                value={glossOf(style, partGloss)}
                onChange={(value) => update(glossPatch(partGloss, rounded(value)))}
              />
            )}
            <Gloss
              label={WORKBENCH.overallGloss}
              value={style.gloss}
              onChange={(value) => update({ gloss: rounded(value) })}
            />
          </div>
        </section>

        <section className="au-dev-plate au-dev-plate--wide" aria-labelledby="au-dev-save">
          <h2 id="au-dev-save">{WORKBENCH.save}</h2>
          <div className="au-dev-row">
            <label className="au-dev-name">
              <span>{WORKBENCH.saveName}</span>
              <input
                type="text"
                value={saved}
                pattern={ALMANACH_STYLE_ID.source}
                spellCheck={false}
                aria-describedby="au-dev-save-hint"
                onChange={(event) => setSaved(event.currentTarget.value)}
              />
            </label>
            <button type="button" className="au-dev-pill au-dev-pill--gold" onClick={save}>
              {WORKBENCH.save}
            </button>
          </div>
          <p id="au-dev-save-hint" className="au-dev-hint">
            {WORKBENCH.saveHint}
          </p>
          <p className="au-dev-message" aria-live="polite">
            {message}
          </p>
          {Object.keys(styles).length > 0 && (
            <div className="au-dev-row">
              <span className="au-dev-label">{WORKBENCH.savedStyles}</span>
              {Object.entries(styles).map(([id, savedStyle]) => (
                <button
                  key={id}
                  type="button"
                  className="au-dev-pill"
                  aria-pressed={saved === id && savedMatches}
                  onClick={() => {
                    setStyle(savedStyle)
                    setSaved(id)
                  }}
                >
                  {id}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="au-dev-plate au-dev-plate--wide" aria-labelledby="au-dev-code">
          <h2 id="au-dev-code">{WORKBENCH.code}</h2>
          <div className="au-dev-snippet">
            <h3>{WORKBENCH.component}</h3>
            <pre>{component}</pre>
            <CopyButton text={component} />
          </div>
          <div className="au-dev-snippet">
            <h3>{WORKBENCH.lore}</h3>
            {lore.kind === 'line' ? (
              <>
                <pre>{lore.text}</pre>
                <CopyButton text={lore.text} />
              </>
            ) : (
              <p className="au-dev-hint">{lore.text}</p>
            )}
          </div>
          <div className="au-dev-snippet">
            <h3>{WORKBENCH.json}</h3>
            <pre>{json}</pre>
            <CopyButton text={json} />
          </div>
        </section>
      </div>
    </div>
  )
}
