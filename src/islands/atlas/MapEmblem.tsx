const FRAME = '50,6 88,28 88,72 50,94 12,72 12,28'
const INNER_FRAME = '50,17 78.5,33.5 78.5,66.5 50,83 21.5,66.5 21.5,33.5'
const MEDIA = '/data/media/'

const EMBLEMS = import.meta.glob<string>('/data/media/*-emblem.svg', {
  query: '?url',
  import: 'default',
  eager: true,
})

function emblemUrl(emblem: string): string {
  const url = EMBLEMS[`${MEDIA}${emblem}`]
  if (url === undefined) throw new Error(`the Atlas has no emblem file ${emblem}`)
  return url
}

export function MapEmblem({ emblem }: { emblem: string | undefined }) {
  const mask = emblem === undefined ? undefined : `url("${emblemUrl(emblem)}")`
  return (
    <span className="au-atlas-emblem" aria-hidden="true">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon className="au-atlas-emblem__frame" points={FRAME} strokeWidth={2.6} />
        {mask === undefined && (
          <polygon className="au-atlas-emblem__inner" points={INNER_FRAME} strokeWidth={2.6} />
        )}
      </svg>
      {mask !== undefined && (
        <span
          className="au-atlas-emblem__tree"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        />
      )}
    </span>
  )
}
