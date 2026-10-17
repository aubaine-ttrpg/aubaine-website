import { PACES, type Pace } from '../../lib/atlas/vocabulary'

export type AtlasBook = {
  effects: ReadonlyMap<Pace, HTMLTemplateElement>
  rule: HTMLTemplateElement
}

function template(section: HTMLElement, selector: string): HTMLTemplateElement {
  const found = section.querySelector(selector)
  if (!(found instanceof HTMLTemplateElement)) {
    throw new Error(`the Atlas page has no template ${selector}`)
  }
  return found
}

export function readAtlasBook(section: HTMLElement): AtlasBook {
  return {
    effects: new Map(
      PACES.map((pace) => [pace, template(section, `template[data-atlas-pace-effect="${pace}"]`)]),
    ),
    rule: template(section, 'template[data-atlas-travel-rule]'),
  }
}
