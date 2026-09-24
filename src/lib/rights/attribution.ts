export type Licence = { id: string; url: string }

export const ATTRIBUTION_SECTIONS = { icons: 'credits-icons', fonts: 'credits-fonts' } as const

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
