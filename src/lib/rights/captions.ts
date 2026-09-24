import { type MediaCaption, mediaCaptions } from '../game/schema.ts'

export function indexCaptions(raw: unknown): Map<string, MediaCaption> {
  const parsed = mediaCaptions.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`data/media-captions.json does not match the contract\n${issues}`)
  }

  const out = new Map<string, MediaCaption>()
  for (const caption of parsed.data.captions) {
    if (out.has(caption.file)) throw new Error(`${caption.file} has two captions`)
    out.set(caption.file, caption)
  }
  return out
}

export function serialiseCaptions(captions: Iterable<MediaCaption>): string {
  const sorted = [...captions].sort((a, b) => a.file.localeCompare(b.file))
  return `${JSON.stringify({ captions: sorted }, null, 2)}\n`
}
