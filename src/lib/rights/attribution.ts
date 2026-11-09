import { armsFiles, type FrameKind } from '../art-effect/presets.ts'

export type Licence = { id: string; url: string }

export const ATTRIBUTION_SECTIONS = {
  icons: 'credits-icons',
  fonts: 'credits-fonts',
  sounds: 'credits-sounds',
  textures: 'credits-textures',
  arms: 'credits-arms',
} as const

const APACHE_2: Licence = {
  id: 'Apache License 2.0',
  url: 'https://www.apache.org/licenses/LICENSE-2.0',
}

const CC_BY_3: Licence = {
  id: 'CC BY 3.0',
  url: 'https://creativecommons.org/licenses/by/3.0/',
}

const OFL: Licence = {
  id: 'SIL Open Font License 1.1',
  url: 'https://openfontlicense.org/',
}

const CC0: Licence = {
  id: 'CC0 1.0',
  url: 'https://creativecommons.org/publicdomain/zero/1.0/',
}

const MIT: Licence = {
  id: 'MIT',
  url: 'https://opensource.org/license/mit',
}

const CC_BY_NC_SA_3: Licence = {
  id: 'CC BY-NC-SA 3.0',
  url: 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
}

export type IconSet = {
  prefix: string
  name: string
  author: string
  home: string
  licence: Licence
}

export const ICON_SETS = [
  {
    prefix: 'mdi',
    name: 'Material Design Icons',
    author: 'Pictogrammers',
    home: 'https://pictogrammers.com/library/mdi/',
    licence: APACHE_2,
  },
  {
    prefix: 'material-symbols',
    name: 'Material Symbols',
    author: 'Google',
    home: 'https://fonts.google.com/icons',
    licence: APACHE_2,
  },
  {
    prefix: 'game-icons',
    name: 'Game-icons.net',
    author: 'Game-icons.net contributors',
    home: 'https://game-icons.net/',
    licence: CC_BY_3,
  },
] as const satisfies readonly IconSet[]

export const ICON_PREFIXES: readonly string[] = ICON_SETS.map((set) => set.prefix)

export const ICON_NAME_PATTERN = new RegExp(`^(${ICON_PREFIXES.join('|')}):[a-z0-9-]+$`)

export type FontFamily = {
  slug: string
  name: string
  query: string
  token: string
  fallback: string
  licence: Licence
}

export const FONT_FAMILIES = [
  {
    slug: 'cinzel',
    name: 'Cinzel',
    query: 'Cinzel:wght@400;500;600;700',
    token: '--font-display',
    fallback: 'serif',
    licence: OFL,
  },
  {
    slug: 'spectral',
    name: 'Spectral',
    query: 'Spectral:ital,wght@0,300;0,400;0,600;1,400',
    token: '--font-body',
    fallback: 'Georgia, serif',
    licence: OFL,
  },
  {
    slug: 'barlow-semi-condensed',
    name: 'Barlow Semi Condensed',
    query: 'Barlow+Semi+Condensed:wght@400;500;600;700',
    token: '--font-ui',
    fallback: 'sans-serif',
    licence: OFL,
  },
  {
    slug: 'eb-garamond',
    name: 'EB Garamond',
    query: 'EB+Garamond:ital,wght@0,400;0,500;0,600;1,400',
    token: '--font-garamond',
    fallback: 'Georgia, serif',
    licence: OFL,
  },
  {
    slug: 'tinos',
    name: 'Tinos',
    query: 'Tinos:ital,wght@0,400;0,700;1,400',
    token: '--font-epic',
    fallback: "'Times New Roman', serif",
    licence: OFL,
  },
  {
    slug: 'jetbrains-mono',
    name: 'JetBrains Mono',
    query: 'JetBrains+Mono:wght@400;500',
    token: '--font-mono',
    fallback: 'ui-monospace, SFMono-Regular, monospace',
    licence: OFL,
  },
] as const satisfies readonly FontFamily[]

export const FONT_SLUGS: readonly string[] = FONT_FAMILIES.map((family) => family.slug)

export function fontTokenRule(family: FontFamily): string {
  return `  ${family.token}: '${family.name}', ${family.fallback};`
}

export type SoundShape = 'loop' | 'shot'

export type SoundCut = {
  file: string
  original: string
  shape: SoundShape
  start?: number
  length?: number
  lowpass?: number
}

export type SoundWork = {
  title: string
  author: string
  source: string
  licence: Licence
  cuts: readonly SoundCut[]
}

const BIGSOUNDBANK = 'https://bigsoundbank.com'

export const SOUND_WORKS = [
  {
    title: 'Sea: Waves',
    author: 'DenisChardonnet',
    source: `${BIGSOUNDBANK}/sea-waves-s0266.html`,
    licence: CC0,
    cuts: [{ file: 'sea', original: 's0266.wav', shape: 'loop', start: 7, length: 20 }],
  },
  {
    title: 'Small Waves Facing the Ocean',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/small-waves-facing-the-ocean-s1046.html`,
    licence: CC0,
    cuts: [{ file: 'shore', original: 's1046.wav', shape: 'loop', start: 16, length: 20 }],
  },
  {
    title: 'Strong wind #4',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/strong-wind-4-s0154.html`,
    licence: CC0,
    cuts: [{ file: 'wind', original: 's0154.wav', shape: 'loop', start: 29, length: 20 }],
  },
  {
    title: 'Forest #3',
    author: 'Pierre SIBANARCO',
    source: `${BIGSOUNDBANK}/forest-3-s2715.html`,
    licence: CC0,
    cuts: [{ file: 'forest', original: 's2715.wav', shape: 'loop', start: 128, length: 20 }],
  },
  {
    title: 'Countryside',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/countryside-s0097.html`,
    licence: CC0,
    cuts: [{ file: 'fields', original: 's0097.wav', shape: 'loop', start: 84, length: 20 }],
  },
  {
    title: 'Field cricket',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/field-cricket-s1020.html`,
    licence: CC0,
    cuts: [{ file: 'night', original: 's1020.wav', shape: 'loop', start: 15, length: 20 }],
  },
  {
    title: 'Outdoor Market #1',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/outdoor-market-1-s2728.html`,
    licence: CC0,
    cuts: [
      { file: 'town', original: 's2728.wav', shape: 'loop', start: 29, length: 20, lowpass: 1600 },
    ],
  },
  {
    title: 'Cave #1',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/cave-1-s2135.html`,
    licence: CC0,
    cuts: [{ file: 'cave', original: 's2135.wav', shape: 'loop', start: 29, length: 20 }],
  },
  {
    title: 'Gulls on the Harbor',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/gulls-on-the-harbor-s2573.html`,
    licence: CC0,
    cuts: [{ file: 'gull', original: 's2573.wav', shape: 'shot', start: 110.1, length: 3 }],
  },
  {
    title: "Bell 1 O'clock",
    author: 'Joseph SARDIN & Axeline T.',
    source: `${BIGSOUNDBANK}/bell-1-o-clock-s3446.html`,
    licence: CC0,
    cuts: [{ file: 'bell', original: 's3446.wav', shape: 'shot' }],
  },
  {
    title: 'Anvil #1',
    author: 'Pablo BERGEL',
    source: `${BIGSOUNDBANK}/anvil-1-s3589.html`,
    licence: CC0,
    cuts: [{ file: 'anvil', original: 's3589.wav', shape: 'shot', start: 12.8, length: 3 }],
  },
  {
    title: 'Robin #1',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/robin-1-s1667.html`,
    licence: CC0,
    cuts: [{ file: 'bird', original: 's1667.wav', shape: 'shot' }],
  },
  {
    title: 'Tawny Owl #1',
    author: 'Joseph SARDIN',
    source: `${BIGSOUNDBANK}/tawny-owl-1-s1763.html`,
    licence: CC0,
    cuts: [{ file: 'owl', original: 's1763.wav', shape: 'shot', start: 4.1, length: 4 }],
  },
  {
    title: 'Interface Sounds',
    author: 'Kenney',
    source: 'https://kenney.nl/assets/interface-sounds',
    licence: CC0,
    cuts: [
      { file: 'cue-select', original: 'select_008.ogg', shape: 'shot' },
      { file: 'cue-open', original: 'open_002.ogg', shape: 'shot' },
      { file: 'cue-close', original: 'close_002.ogg', shape: 'shot' },
      { file: 'cue-route', original: 'confirmation_003.ogg', shape: 'shot' },
    ],
  },
] as const satisfies readonly SoundWork[]

export const SOUND_FILES: readonly string[] = SOUND_WORKS.flatMap((work) =>
  work.cuts.map((cut) => cut.file),
)

export type Retouch = {
  x: number
  y: number
  width: number
  height: number
  from: { x: number; y: number }
}

const FRAME_PASSES = ['beauty', 'surface', 'relief'] as const

export type FramePass = (typeof FRAME_PASSES)[number]

export type TextureCut =
  | { file: string; kind: 'environment'; original: string }
  | { file: string; kind: 'relief'; original: string; size: number }
  | {
      file: string
      kind: 'frame'
      frame: FrameKind
      original: string
      pass: FramePass
      retouch: readonly Retouch[]
    }
  | { file: string; kind: 'hanger'; original: string }

export type TextureWork = {
  title: string
  author: string
  source: string
  licence: Licence
  cuts: readonly TextureCut[]
}

const POLY_HAVEN = 'https://polyhaven.com/a'

const FRAME_RETOUCH: readonly Retouch[] = [
  { x: 1566, y: 1196, width: 34, height: 35, from: { x: -38, y: 0 } },
]

function frameCuts(
  frame: FrameKind,
  original: string,
  stem: string,
  retouch: readonly Retouch[],
): Extract<TextureCut, { kind: 'frame' }>[] {
  return FRAME_PASSES.map((pass) => ({
    file: pass === 'beauty' ? `${stem}.webp` : `${stem}-${pass}.avif`,
    kind: 'frame',
    frame,
    original,
    pass,
    retouch,
  }))
}

export const TEXTURE_WORKS = [
  {
    title: 'Fancy Picture Frame 01',
    author: 'Rob Tuytel, Rico Cilliers',
    source: `${POLY_HAVEN}/fancy_picture_frame_01`,
    licence: CC0,
    cuts: frameCuts(
      'gilt',
      'fancy_picture_frame_01/fancy_picture_frame_01_4k.gltf',
      'fancy-picture-frame-01',
      FRAME_RETOUCH,
    ),
  },
  {
    title: 'Wood Table Worn',
    author: 'Dimitrios Savva, Rico Cilliers',
    source: `${POLY_HAVEN}/wood_table_worn`,
    licence: CC0,
    cuts: frameCuts('wood', 'wood_table_worn', 'wooden-frame', []),
  },
  {
    title: 'Rough Linen',
    author: 'colormass, Rico Cilliers',
    source: `${POLY_HAVEN}/rough_linen`,
    licence: CC0,
    cuts: [
      {
        file: 'rough-linen-relief.avif',
        kind: 'relief',
        original: 'rough_linen_disp_2k.png',
        size: 1024,
      },
    ],
  },
  {
    title: 'Velour Velvet',
    author: 'colormass, Rico Cilliers',
    source: `${POLY_HAVEN}/velour_velvet`,
    licence: CC0,
    cuts: [
      {
        file: 'velour-velvet-relief.avif',
        kind: 'relief',
        original: 'velour_velvet_disp_2k.png',
        size: 512,
      },
    ],
  },
  {
    title: 'Combination Room',
    author: 'Sergej Majboroda',
    source: `${POLY_HAVEN}/combination_room`,
    licence: CC0,
    cuts: [
      { file: 'combination-room.webp', kind: 'environment', original: 'combination_room_2k.hdr' },
    ],
  },
  {
    title: 'Dark Wood',
    author: 'Dimitrios Savva, Dario Barresi, Rico Cilliers',
    source: `${POLY_HAVEN}/dark_wood`,
    licence: CC0,
    cuts: [{ file: 'banner-hanger.webp', kind: 'hanger', original: 'dark_wood' }],
  },
] as const satisfies readonly TextureWork[]

export const TEXTURE_FILES: readonly string[] = TEXTURE_WORKS.flatMap((work) =>
  work.cuts.map((cut) => cut.file),
)

export type AlmanachMaterialWork = {
  title: string
  author: string
  source: string
  licence: Licence
  files: readonly string[]
}

const AMBIENT_CG = 'https://ambientcg.com/view?id='
const AMBIENT_CG_AUTHOR = 'ambientCG'

function finishFiles(finish: string): readonly string[] {
  return [`${finish}-color.avif`, `${finish}-surface.avif`]
}

export const ALMANACH_MATERIAL_WORKS = [
  {
    title: 'Wood 066',
    author: AMBIENT_CG_AUTHOR,
    source: `${AMBIENT_CG}Wood066`,
    licence: CC0,
    files: finishFiles('noyer'),
  },
  {
    title: 'Wood 058',
    author: AMBIENT_CG_AUTHOR,
    source: `${AMBIENT_CG}Wood058`,
    licence: CC0,
    files: finishFiles('chene'),
  },
  {
    title: 'Wood 009',
    author: AMBIENT_CG_AUTHOR,
    source: `${AMBIENT_CG}Wood009`,
    licence: CC0,
    files: finishFiles('acajou'),
  },
  {
    title: 'Wood 067',
    author: AMBIENT_CG_AUTHOR,
    source: `${AMBIENT_CG}Wood067`,
    licence: CC0,
    files: finishFiles('ebene'),
  },
  {
    title: 'Rosewood Veneer1',
    author: 'Jenelle van Heerden',
    source: `${POLY_HAVEN}/rosewood_veneer1`,
    licence: CC0,
    files: finishFiles('palissandre'),
  },
  {
    title: 'Lacquered Cherry Wood',
    author: 'Jenelle van Heerden, Rico Cilliers',
    source: `${POLY_HAVEN}/lacquered_cherry_wood`,
    licence: CC0,
    files: finishFiles('merisier'),
  },
  {
    title: 'Leather 023',
    author: AMBIENT_CG_AUTHOR,
    source: `${AMBIENT_CG}Leather023`,
    licence: CC0,
    files: finishFiles('cuir'),
  },
  {
    title: 'Leather 026',
    author: AMBIENT_CG_AUTHOR,
    source: `${AMBIENT_CG}Leather026`,
    licence: CC0,
    files: finishFiles('cuir-noir'),
  },
  {
    title: 'Leather 037',
    author: AMBIENT_CG_AUTHOR,
    source: `${AMBIENT_CG}Leather037`,
    licence: CC0,
    files: finishFiles('cuir-bordeaux'),
  },
  {
    title: 'Leather 033 A',
    author: AMBIENT_CG_AUTHOR,
    source: `${AMBIENT_CG}Leather033A`,
    licence: CC0,
    files: finishFiles('cuir-vieilli'),
  },
  {
    title: 'Studio Kontrast 03',
    author: 'Grzegorz Wronkowski',
    source: `${POLY_HAVEN}/studio_kontrast_03`,
    licence: CC0,
    files: ['almanach-environment.hdr'],
  },
  {
    title: 'Particle Pack',
    author: 'Kenney',
    source: 'https://kenney.nl/assets/particle-pack',
    licence: CC0,
    files: ['almanach-magic.avif'],
  },
] as const satisfies readonly AlmanachMaterialWork[]

export const ALMANACH_MATERIAL_FILES: readonly string[] = ALMANACH_MATERIAL_WORKS.flatMap(
  (work) => work.files,
)

export type ArmsWork = {
  key: string
  title: string
  author: string
  source: string
  licence: Licence
}

const WAPPENWIKI = 'https://wappenwiki.org'

export const ARMS_WORKS = [
  {
    key: 'armoria',
    title: 'Armoria',
    author: 'Azgaar',
    source: 'https://azgaar.github.io/Armoria/',
    licence: MIT,
  },
  {
    key: 'lionRampant',
    title: 'Lion Rampant',
    author: 'WappenWiki',
    source: WAPPENWIKI,
    licence: CC_BY_NC_SA_3,
  },
  {
    key: 'estoile',
    title: 'Estoile',
    author: 'WappenWiki',
    source: WAPPENWIKI,
    licence: CC_BY_NC_SA_3,
  },
  {
    key: 'bookClosed',
    title: 'Book Closed',
    author: 'WappenWiki',
    source: `${WAPPENWIKI}/index.php/File:Perm.svg`,
    licence: CC_BY_NC_SA_3,
  },
  {
    key: 'raven',
    title: 'Raven',
    author: 'WappenWiki',
    source: WAPPENWIKI,
    licence: CC_BY_NC_SA_3,
  },
] as const satisfies readonly ArmsWork[]

export type ArmsWorkKey = (typeof ARMS_WORKS)[number]['key']

export type ArmsComposition = { file: string; source: string; works: readonly ArmsWorkKey[] }

export const ARMS_COMPOSITIONS = [
  {
    file: 'victoria.svg',
    source: 'victoria-armoria.png',
    works: ['armoria', 'lionRampant', 'estoile', 'bookClosed', 'raven'],
  },
] as const satisfies readonly ArmsComposition[]

export const ARMS_FILES: readonly string[] = ARMS_COMPOSITIONS.flatMap((composition) => [
  composition.source,
  composition.file,
  ...Object.values(armsFiles(composition.file)),
])
