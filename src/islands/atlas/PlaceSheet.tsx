import { motion } from 'motion/react'
import { type CSSProperties, type RefObject, useId } from 'react'
import type { AtlasRef } from '../../lib/atlas/world/refs'
import { AtlasIcon } from './AtlasIcon'
import type { Dot, Sheet, SheetItem, SheetSection } from './describe'
import type { AtlasWords } from './measures'

type Props = {
  words: AtlasWords
  sheet: Sheet
  heading: RefObject<HTMLHeadingElement | null>
  canCentre: boolean
  onChoose: (ref: AtlasRef) => void
  onFrom: () => void
  onTo: () => void
  onCentre: () => void
  onClose: () => void
}

const RISE = { duration: 0.35, ease: [0.16, 1, 0.3, 1] } as const

export function dotStyle(dot: Dot): CSSProperties | undefined {
  return dot.colour ? { background: dot.colour } : undefined
}

export function Marker({ dot }: { dot: Dot }) {
  return (
    <span className="au-atlas-dot" data-dot={dot.mark} style={dotStyle(dot)} aria-hidden="true" />
  )
}

function ItemBody({ item }: { item: SheetItem }) {
  return (
    <>
      <Marker dot={item.dot} />
      <span className="au-atlas-item__text">
        <span className="au-atlas-item__name">{item.name}</span>
        <span className="au-atlas-item__detail">{item.detail}</span>
      </span>
    </>
  )
}

function Section({
  section,
  onChoose,
}: {
  section: SheetSection
  onChoose: (ref: AtlasRef) => void
}) {
  const title = useId()
  return (
    <section className="au-atlas-section" aria-labelledby={title}>
      <h4 className="au-atlas-section__title">
        <span id={title}>{section.title}</span>
        <span className="au-atlas-section__rule" aria-hidden="true" />
        <span className="au-atlas-section__count">{section.total}</span>
      </h4>
      <ul className="au-atlas-section__items">
        {section.items.map((item) => {
          const { ref } = item
          return (
            <li key={item.key}>
              {ref ? (
                <button type="button" className="au-atlas-item" onClick={() => onChoose(ref)}>
                  <ItemBody item={item} />
                </button>
              ) : (
                <div className="au-atlas-item au-atlas-item--static">
                  <ItemBody item={item} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function PlaceSheet({
  words,
  sheet,
  heading,
  canCentre,
  onChoose,
  onFrom,
  onTo,
  onCentre,
  onClose,
}: Props) {
  const title = useId()
  return (
    <motion.article
      className="au-atlas-sheet"
      aria-labelledby={title}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={RISE}
    >
      <div className="au-atlas-sheet__top">
        {sheet.crumbs.length > 0 && (
          <nav className="au-atlas-crumbs" aria-label={words.belongsTo}>
            <ol>
              {sheet.crumbs.map((crumb) => (
                <li key={crumb.key}>
                  <button
                    type="button"
                    className="au-atlas-crumbs__link"
                    aria-current={crumb.current ? 'location' : undefined}
                    onClick={() => onChoose(crumb.ref)}
                  >
                    {crumb.name}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <button
          type="button"
          className="au-atlas-round au-atlas-round--small au-atlas-sheet__close"
          aria-label={words.closeSheet}
          data-tooltip={words.closeSheet}
          onClick={onClose}
        >
          <AtlasIcon name="close" />
        </button>
      </div>
      <header className="au-atlas-sheet__head">
        <p className="au-atlas-sheet__eyebrow" data-tone={sheet.tone}>
          {sheet.colour && (
            <span
              className="au-atlas-sheet__swatch"
              style={{ background: sheet.colour }}
              aria-hidden="true"
            />
          )}
          {sheet.eyebrow}
        </p>
        <h3 className="au-atlas-sheet__title" id={title} ref={heading} tabIndex={-1}>
          {sheet.title}
        </h3>
      </header>
      {sheet.facts.length > 0 && (
        <dl className="au-atlas-facts">
          {sheet.facts.map((fact) => (
            <div key={fact.term} className="au-atlas-facts__fact">
              <dt>{fact.term}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {sheet.description && <p className="au-atlas-sheet__text">{sheet.description}</p>}
      <div className="au-atlas-sheet__actions">
        <button type="button" className="au-atlas-action au-atlas-action--from" onClick={onFrom}>
          <AtlasIcon name="ray-start-arrow" />
          <span>{words.fromHere}</span>
        </button>
        <button type="button" className="au-atlas-action au-atlas-action--to" onClick={onTo}>
          <AtlasIcon name="ray-end-arrow" />
          <span>{words.toHere}</span>
        </button>
        {canCentre && (
          <button
            type="button"
            className="au-atlas-action au-atlas-action--centre"
            onClick={onCentre}
          >
            <AtlasIcon name="image-filter-center-focus" />
            <span>{words.centre}</span>
          </button>
        )}
      </div>
      {sheet.sections.map((section) => (
        <Section key={section.kind} section={section} onChoose={onChoose} />
      ))}
    </motion.article>
  )
}
