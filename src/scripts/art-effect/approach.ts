const LEAD = '200% 0px'
const STAYS_PLAIN = 'data-stays-plain'

export function prepareOnApproach(piece: Element, prepare: () => void, signal: AbortSignal): void {
  const near = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) prepare()
    },
    { rootMargin: LEAD },
  )
  near.observe(piece)
  signal.addEventListener('abort', () => near.disconnect(), { once: true })
}

export function stayPlain(piece: Element): void {
  piece.setAttribute(STAYS_PLAIN, '')
}
