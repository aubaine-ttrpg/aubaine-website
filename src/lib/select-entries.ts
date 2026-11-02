import type { CharacterSheet } from './game/character-sheet'
import type { EntryCard } from './game/hub-cards'
import { stageLook, stageSource } from './stage-ambient'

export type SelectEntry = {
  card: EntryCard
  sheet: CharacterSheet
  ambient: string | undefined
  backdrop: string
}

export type SelectGroup = {
  key: string
  label: string | undefined
  entries: SelectEntry[]
}

export async function selectEntries(
  cards: readonly EntryCard[],
  sheetOf: (id: string) => CharacterSheet,
): Promise<SelectEntry[]> {
  return Promise.all(
    cards.map(async (card) => {
      const { ambient, backdrop } = await stageLook(stageSource(card.cover, card.seal.colours))
      return { card, sheet: sheetOf(card.facets.id), ambient, backdrop }
    }),
  )
}
