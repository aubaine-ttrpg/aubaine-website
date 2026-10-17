import { useId } from 'react'
import type { AtlasWords } from './measures'

type Props = {
  words: AtlasWords
  levels: readonly number[]
  level: number
  busy: boolean
  onLevel: (level: number) => void
}

export function LevelBar({ words, levels, level, busy, onLevel }: Props) {
  const caption = useId()
  return (
    <div className="au-atlas-levels" role="radiogroup" aria-labelledby={caption} aria-busy={busy}>
      <span className="au-atlas-hidden" id={caption}>
        {words.level}
      </span>
      {levels.map((entry) => {
        const name = entry === 0 ? words.surface : words.stratum(entry)
        return (
          <label
            key={entry}
            className="au-atlas-level"
            data-level={Math.min(entry, 2)}
            data-busy={busy && entry === level ? '' : undefined}
            data-tooltip={name}
          >
            <input
              type="radio"
              className="au-atlas-radio"
              name={caption}
              value={entry}
              checked={entry === level}
              onChange={() => onLevel(entry)}
            />
            <span className="au-atlas-level__tile" aria-hidden="true">
              <span className="au-atlas-level__left" />
              <span className="au-atlas-level__right" />
              <span className="au-atlas-level__top" />
              <span className="au-atlas-level__mark">{words.levelMark(entry)}</span>
            </span>
            <span className="au-atlas-level__name">{name}</span>
          </label>
        )
      })}
    </div>
  )
}
