export const LORE_PARTS = ['opening', 'sections'] as const

export type LorePart = (typeof LORE_PARTS)[number]

export type LoreParts = Record<LorePart, string | undefined>

const SECTION_HEADING = /^## /m

export const lorePartId = (page: string, part: LorePart): string => `${page}/${part}`

export function splitLore(markdown: string): LoreParts {
  const start = markdown.search(SECTION_HEADING)
  const opening = (start === -1 ? markdown : markdown.slice(0, start)).trim()
  const sections = start === -1 ? '' : markdown.slice(start).trim()
  return { opening: opening || undefined, sections: sections || undefined }
}
