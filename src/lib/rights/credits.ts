import type { UiStrings } from '../i18n/strings'
import {
  ALMANACH_MATERIAL_WORKS,
  ARMS_WORKS,
  ATTRIBUTION_SECTIONS,
  type Licence,
  SOUND_WORKS,
  TEXTURE_WORKS,
} from './attribution'

export type CreditedWork = { title: string; author: string; source: string; licence: Licence }

export type CreditSection = { id: string; heading: string } & (
  | { kind: 'icons' }
  | { kind: 'fonts' }
  | { kind: 'works'; works: readonly CreditedWork[] }
)

export function creditSections(t: UiStrings): readonly CreditSection[] {
  return [
    { kind: 'icons', id: ATTRIBUTION_SECTIONS.icons, heading: t.creditsIcons },
    { kind: 'fonts', id: ATTRIBUTION_SECTIONS.fonts, heading: t.creditsFonts },
    {
      kind: 'works',
      id: ATTRIBUTION_SECTIONS.sounds,
      heading: t.creditsSounds,
      works: SOUND_WORKS,
    },
    {
      kind: 'works',
      id: ATTRIBUTION_SECTIONS.textures,
      heading: t.creditsTextures,
      works: [...TEXTURE_WORKS, ...ALMANACH_MATERIAL_WORKS],
    },
    { kind: 'works', id: ATTRIBUTION_SECTIONS.arms, heading: t.creditsArms, works: ARMS_WORKS },
  ]
}
