import { motion } from 'motion/react'
import { useId } from 'react'
import { TILE_TYPES } from '../../lib/atlas/vocabulary'
import type { Vocabulary } from '../../lib/atlas/world/model'
import { AtlasIcon } from './AtlasIcon'
import type { AtlasWords } from './measures'
import { TILE_SWATCHES } from './swatches'

type PanelProps = { words: AtlasWords; vocabulary: Vocabulary; id: string }

const RISE = { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const

export function LegendPanel({ words, vocabulary, id }: PanelProps) {
  const tiles = useId()
  const routes = useId()
  return (
    <motion.section
      className="au-atlas-legend"
      id={id}
      aria-label={words.legend}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={RISE}
    >
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
      <h2 className="au-atlas-legend__title" id={routes}>
        {words.routeKinds}
      </h2>
      <ul className="au-atlas-legend__routes" aria-labelledby={routes}>
        {Object.entries(vocabulary.routeKinds).map(([kind, word]) => (
          <li key={kind} className="au-atlas-legend__route">
            <span className="au-atlas-legend__sample" data-route={kind} aria-hidden="true" />
            <span className="au-atlas-legend__name">{word.label}</span>
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
