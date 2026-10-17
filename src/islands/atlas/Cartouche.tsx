import { motion } from 'motion/react'
import type { RefObject } from 'react'
import type { BadgedStatus } from '../../lib/game/status'
import type { AtlasWords } from './measures'

type Props = {
  words: AtlasWords
  world: string
  badge: { status: BadgedStatus; label: string } | undefined
  hexScale: string | undefined
  scaleBar: RefObject<HTMLSpanElement | null>
  scaleText: RefObject<HTMLSpanElement | null>
}

const RISE = { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as const

export function Cartouche({ words, world, badge, hexScale, scaleBar, scaleText }: Props) {
  return (
    <motion.div
      className="au-atlas-cartouche"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={RISE}
    >
      <div className="au-atlas-cartouche__head">
        <h1 className="au-atlas-cartouche__title">{words.title}</h1>
        <span className="au-atlas-cartouche__world">{world}</span>
        {badge && (
          <span className={`au-badge au-badge--sm au-badge--${badge.status}`}>{badge.label}</span>
        )}
      </div>
      {hexScale !== undefined && (
        <p className="au-atlas-scale">
          <span className="au-atlas-hidden">{words.scale}</span>
          <span className="au-atlas-scale__bar" ref={scaleBar} aria-hidden="true" />
          <span className="au-atlas-scale__km" ref={scaleText} />
          <span className="au-atlas-scale__hex">
            <span aria-hidden="true">· </span>
            {hexScale}
          </span>
        </p>
      )}
    </motion.div>
  )
}
