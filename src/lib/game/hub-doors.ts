import type { Locale } from '../i18n/locales.ts'
import { type IndexKind, pathFor } from '../i18n/routes.ts'
import { strings } from '../i18n/strings.ts'
import { type StageLook, type StageSource, stageLook, stageSource } from '../stage-ambient.ts'
import type { Corpus } from './build.ts'
import { type EntryCard, speciesCards, treeCards } from './hub-cards.ts'
import { leadOrder } from './hubs.ts'
import { indexArt, indexDescriptors } from './indexes.ts'
import { type KindMark, kindInk } from './kind-marks.ts'

export type HubDoor = {
  key: string
  href: string
  name: string
  tagline: string
  mark: KindMark
  ink: string
  stage: StageSource
}

export type LookedDoor = { door: HubDoor; look: StageLook }

export type DoorContract = {
  nameId: string
  lineId: string
  lit: '' | undefined
  art: string | undefined
  backdrop: string
  colours: string | undefined
  style: string
}

export function doorLooks(doors: readonly HubDoor[]): Promise<LookedDoor[]> {
  return Promise.all(doors.map(async (door) => ({ door, look: await stageLook(door.stage) })))
}

export function doorContract(
  door: HubDoor,
  look: StageLook,
  index: number,
  lit: boolean,
): DoorContract {
  return {
    nameId: `door-${door.key}-name`,
    lineId: `door-${door.key}-line`,
    lit: lit ? '' : undefined,
    art: look.ambient,
    backdrop: look.backdrop,
    colours: door.stage.kind === 'field' ? door.stage.colours.join('|') : undefined,
    style: [`--door-ink:${door.ink}`, `--door-colour:${door.mark.colour}`, `--order:${index}`].join(
      '; ',
    ),
  }
}

function openingStage(ordered: readonly EntryCard[], page: string): StageSource {
  const lead = ordered[0]
  if (!lead) throw new Error(`${page} has no entry to open on`)
  return stageSource(lead.cover, lead.seal.colours)
}

async function indexStage(kind: IndexKind, corpus: Corpus, locale: Locale): Promise<StageSource> {
  if (kind === 'trees') {
    return openingStage(leadOrder(await treeCards(corpus, locale), locale), 'the trees index')
  }
  if (kind === 'species') {
    return openingStage(leadOrder(await speciesCards(corpus, locale), locale), 'the species index')
  }
  return { kind: 'art', art: indexArt(kind, corpus) }
}

export function codexDoors(corpus: Corpus, locale: Locale): Promise<HubDoor[]> {
  const t = strings(locale)
  return Promise.all(
    indexDescriptors(locale).map(async (entry) => ({
      key: entry.kind,
      href: pathFor(entry.kind, locale),
      name: entry.title,
      tagline: t.indexes[entry.kind].tagline,
      mark: entry.mark,
      ink: kindInk(entry.kind),
      stage: await indexStage(entry.kind, corpus, locale),
    })),
  )
}
