export const OWNED_DIRECTORIES = ['art', 'items', 'skills', 'unassigned', 'video'] as const

export const OWNED_FILES = [
  'aubaine-logo.svg',
  'aubaine-logo-light.svg',
  'aubaine-logo-void.svg',
  'qr-aubaine.png',
] as const

export const STRIPPED_DIRECTORIES = ['flags'] as const

export const FOREIGN_DIRECTORIES = ['fonts', 'icons'] as const

export const GENERATED_DIRECTORIES = ['pdf', 'pdf-archive'] as const

export const FOREIGN_PROVENANCE: readonly string[] = [
  'caBX',
  'c2pa',
  'jumd',
  'gpt-image',
  'trainedAlgorithmicMedia',
  'OpenAI',
]
