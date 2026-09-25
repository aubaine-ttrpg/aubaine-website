const DRAFTS_KEY = 'aubaine.drafts'
const DRAFTS_ATTRIBUTE = 'data-drafts'
const REVEALED_ATTRIBUTE = 'data-revealed'

export const DRAFTS_TOGGLED = 'aubaine:drafts-toggled'
export const DRAFT_REVEALED = 'aubaine:draft-revealed'

export function draftsShown(): boolean {
  return document.documentElement.getAttribute(DRAFTS_ATTRIBUTE) === 'shown'
}

export function setDraftsShown(shown: boolean): void {
  const preference = shown ? 'shown' : 'hidden'
  document.documentElement.setAttribute(DRAFTS_ATTRIBUTE, preference)
  try {
    window.localStorage.setItem(DRAFTS_KEY, preference)
  } catch {
    return
  } finally {
    document.dispatchEvent(new Event(DRAFTS_TOGGLED))
  }
}

export function isDraft(entry: HTMLElement): boolean {
  return entry.getAttribute('data-facet-sta') === 'draft'
}

export function isRevealed(entry: HTMLElement): boolean {
  return entry.hasAttribute(REVEALED_ATTRIBUTE)
}

export function isHiddenDraft(entry: HTMLElement): boolean {
  return !draftsShown() && isDraft(entry) && !isRevealed(entry)
}

export function revealDraft(entry: HTMLElement): void {
  if (!isHiddenDraft(entry)) return
  entry.setAttribute(REVEALED_ATTRIBUTE, '')
  entry.hidden = false
  document.dispatchEvent(new Event(DRAFT_REVEALED))
}
