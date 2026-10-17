import { AnimatePresence, motion } from 'motion/react'
import type { Endpoint } from './journey'
import type { AtlasWords } from './measures'

type Props = { words: AtlasWords; picking: Endpoint | undefined; onCancel: () => void }

const RISE = { duration: 0.25, ease: [0.16, 1, 0.3, 1] } as const

export function PickBanner({ words, picking, onCancel }: Props) {
  const prompt = picking === 'from' ? words.pickFromPrompt : words.pickToPrompt
  return (
    <div className="au-atlas-pick-slot">
      <p className="au-atlas-hidden" role="status">
        {picking ? prompt : ''}
      </p>
      <AnimatePresence>
        {picking && (
          <motion.div
            className="au-atlas-pick"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={RISE}
          >
            <span className="au-atlas-pick__pulse" aria-hidden="true" />
            <span className="au-atlas-pick__text">{prompt}</span>
            <button type="button" className="au-atlas-pick__cancel" onClick={onCancel}>
              {words.cancel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
