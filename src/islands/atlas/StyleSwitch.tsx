import { AnimatePresence, motion } from 'motion/react'
import type { MapStyle } from '../../lib/atlas/contract/style'
import { AtlasIcon, type IconName } from './AtlasIcon'
import type { AtlasWords } from './measures'

type Props = {
  words: AtlasWords
  style: MapStyle
  onPrepare: () => void
  onStyle: (style: MapStyle) => void
}

const STYLE_ICONS: Readonly<Record<MapStyle, IconName>> = {
  '3d': 'video-3d',
  parchment: 'video-2d',
}

const SPIN = { type: 'spring', stiffness: 520, damping: 28, mass: 0.6 } as const

export function StyleSwitch({ words, style, onPrepare, onStyle }: Props) {
  const parchment = style === 'parchment'
  return (
    <motion.button
      type="button"
      role="switch"
      className="au-atlas-round au-atlas-style"
      aria-checked={parchment}
      aria-label={words.styleToggle}
      data-tooltip={words.styleToggle}
      whileTap={{ scale: 0.88 }}
      onPointerEnter={onPrepare}
      onPointerDown={onPrepare}
      onFocus={onPrepare}
      onClick={() => onStyle(parchment ? '3d' : 'parchment')}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={style}
          className="au-atlas-style__icon"
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={SPIN}
        >
          <AtlasIcon name={STYLE_ICONS[style]} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
