import { motion } from 'motion/react'
import { useEffect, useId, useState } from 'react'
import {
  CAVE_GLYPH,
  LANDMARK_GLYPHS,
  PARCHMENT_GLYPHS,
  type ParchmentGlyph,
  SETTING_PATTERNS,
  SETTLEMENT_GLYPHS,
  TILE_PATTERNS,
} from '../../lib/atlas/contract/parchment'
import type { MapStyle } from '../../lib/atlas/contract/style'
import { SETTING_WASHES, TILE_WASHES } from '../../lib/atlas/engine/parchment-palette'
import { svgPath } from '../../lib/atlas/svg-path'
import { LANDMARK_KINDS, SETTINGS, TILE_TYPES } from '../../lib/atlas/vocabulary'
import type { Vocabulary } from '../../lib/atlas/world/model'
import { AtlasIcon } from './AtlasIcon'
import { word } from './describe'
import type { AtlasWords } from './measures'
import { TILE_SWATCHES } from './swatches'

type PanelProps = {
  words: AtlasWords
  vocabulary: Vocabulary
  id: string
  style: MapStyle
  underground: boolean
}

type GlyphPaths = ReadonlyMap<ParchmentGlyph, string>

type KeyEntry = { key: string; name: string; wash: string | undefined; glyph: ParchmentGlyph }

const RISE = { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const

function useGlyphPaths(): GlyphPaths | undefined {
  const [paths, setPaths] = useState<GlyphPaths>()
  useEffect(() => {
    let live = true
    import('../../lib/atlas/engine/parchment-glyphs').then(
      ({ PARCHMENT_GLYPH_FILES }) => {
        if (!live) return
        setPaths(
          new Map(
            PARCHMENT_GLYPHS.map((glyph) => [glyph, svgPath(PARCHMENT_GLYPH_FILES[glyph]).d]),
          ),
        )
      },
      (error: unknown) => console.error('[atlas] the legend glyphs could not load', error),
    )
    return () => {
      live = false
    }
  }, [])
  return paths
}

function GlyphHex({ wash, path }: { wash: string | undefined; path: string | undefined }) {
  return (
    <span
      className="au-atlas-legend__hex"
      style={wash ? { background: wash } : undefined}
      aria-hidden="true"
    >
      {path && (
        <svg
          className="au-atlas-legend__glyph"
          viewBox="0 0 512 512"
          aria-hidden="true"
          focusable="false"
        >
          <path d={path} fill="currentColor" />
        </svg>
      )}
    </span>
  )
}

function KeyList({
  title,
  entries,
  paths,
}: {
  title: string
  entries: readonly KeyEntry[]
  paths: GlyphPaths | undefined
}) {
  const heading = useId()
  return (
    <>
      <h2 className="au-atlas-legend__title" id={heading}>
        {title}
      </h2>
      <ul className="au-atlas-legend__tiles" aria-labelledby={heading}>
        {entries.map((entry) => (
          <li key={entry.key} className="au-atlas-legend__tile">
            <GlyphHex wash={entry.wash} path={paths?.get(entry.glyph)} />
            <span className="au-atlas-legend__name">{entry.name}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function ParchmentKey({
  words,
  vocabulary,
  underground,
}: {
  words: AtlasWords
  vocabulary: Vocabulary
  underground: boolean
}) {
  const paths = useGlyphPaths()
  const tiles = useId()
  const settlement = (kind: 'city' | 'village' | 'hold') =>
    word(vocabulary.placeKinds, kind, 'place kind').label
  const symbols: KeyEntry[] = [
    {
      key: 'capital',
      name: words.facts.capital,
      wash: undefined,
      glyph: SETTLEMENT_GLYPHS.capital,
    },
    underground
      ? { key: 'hold', name: settlement('hold'), wash: undefined, glyph: SETTLEMENT_GLYPHS.city }
      : { key: 'city', name: settlement('city'), wash: undefined, glyph: SETTLEMENT_GLYPHS.city },
  ]
  if (!underground) {
    symbols.push(
      {
        key: 'village',
        name: settlement('village'),
        wash: undefined,
        glyph: SETTLEMENT_GLYPHS.village,
      },
      { key: 'cave', name: words.caveMouth, wash: undefined, glyph: CAVE_GLYPH },
      ...LANDMARK_KINDS.map((kind) => ({
        key: kind,
        name: word(vocabulary.landmarkKinds, kind, 'landmark kind').label,
        wash: undefined,
        glyph: LANDMARK_GLYPHS[kind],
      })),
    )
  }
  return (
    <>
      {underground ? (
        <KeyList
          title={words.undergroundSettings}
          paths={paths}
          entries={SETTINGS.flatMap((setting) => {
            const glyph = SETTING_PATTERNS[setting]?.glyph
            if (!glyph) return []
            return [
              {
                key: setting,
                name: word(vocabulary.settings, setting, 'setting').label,
                wash: SETTING_WASHES[setting],
                glyph,
              },
            ]
          })}
        />
      ) : (
        <>
          <h2 className="au-atlas-legend__title" id={tiles}>
            {words.tileTypes}
          </h2>
          <ul className="au-atlas-legend__tiles" aria-labelledby={tiles}>
            {TILE_TYPES.map((type) => {
              const glyph = TILE_PATTERNS[type]?.glyph
              return (
                <li key={type} className="au-atlas-legend__tile">
                  <GlyphHex wash={TILE_WASHES[type]} path={glyph && paths?.get(glyph)} />
                  <span className="au-atlas-legend__name">
                    {word(vocabulary.tileTypes, type, 'tile type').label}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
      <KeyList title={words.symbols} entries={symbols} paths={paths} />
    </>
  )
}

export function LegendPanel({ words, vocabulary, id, style, underground }: PanelProps) {
  const tiles = useId()
  const routes = useId()
  return (
    <motion.section
      className="au-atlas-legend"
      id={id}
      aria-label={words.legend}
      data-style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={RISE}
    >
      {style === 'parchment' ? (
        <ParchmentKey words={words} vocabulary={vocabulary} underground={underground} />
      ) : (
        <>
          <h2 className="au-atlas-legend__title" id={tiles}>
            {words.tileTypes}
          </h2>
          <ul className="au-atlas-legend__tiles" aria-labelledby={tiles}>
            {TILE_TYPES.map((type) => (
              <li key={type} className="au-atlas-legend__tile">
                <span
                  className="au-atlas-legend__swatch"
                  style={{ background: TILE_SWATCHES[type] }}
                  aria-hidden="true"
                />
                <span className="au-atlas-legend__name">{vocabulary.tileTypes[type]?.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="au-atlas-legend__title" id={routes}>
        {words.routeKinds}
      </h2>
      <ul className="au-atlas-legend__routes" aria-labelledby={routes}>
        {Object.entries(vocabulary.routeKinds).map(([kind, route]) => (
          <li key={kind} className="au-atlas-legend__route">
            <span className="au-atlas-legend__sample" data-route={kind} aria-hidden="true" />
            <span className="au-atlas-legend__name">{route.label}</span>
          </li>
        ))}
      </ul>
    </motion.section>
  )
}

type ToggleProps = {
  words: AtlasWords
  open: boolean
  controls: string
  onToggle: (open: boolean) => void
}

export function LegendToggle({ words, open, controls, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      className="au-atlas-round"
      aria-label={words.legend}
      data-tooltip={words.legend}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={() => onToggle(!open)}
    >
      <AtlasIcon name="map-legend" />
    </button>
  )
}
