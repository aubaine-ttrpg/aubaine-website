import { appendBlankLeaves, fillContents, numberLeaves, paginate } from './reflow.ts'

declare global {
  interface Window {
    __bookletPaginated?: boolean
  }
}

void document.fonts.ready.then(() => {
  paginate()
  const multiple = Number(document.body.dataset['pageMultiple'] ?? '1') || 1
  appendBlankLeaves(multiple)
  fillContents(numberLeaves())
  window.__bookletPaginated = true
})
