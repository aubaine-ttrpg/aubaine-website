export const OWNED_DIRECTORIES = [
  'art',
  'emblems',
  'items',
  'masks',
  'skills',
  'unassigned',
  'video',
] as const

export const OWNED_FILES = [
  'aubaine-logo.svg',
  'aubaine-logo-light.svg',
  'aubaine-logo-void.svg',
  'atlas-eden-emblem.svg',
  'qr-aubaine.png',
] as const

export const OWNED_MODEL_DIRECTORIES = ['almanach'] as const

export const STAMPED_EXTENSIONS: readonly string[] = ['.png', '.jpg', '.svg', '.mp4']

export const STRIPPED_DIRECTORIES = ['flags'] as const

export const FOREIGN_DIRECTORIES = [
  'almanach-materials',
  'arms',
  'fonts',
  'icons',
  'sounds',
  'textures',
] as const

export const GENERATED_DIRECTORIES = ['pdf', 'pdf-archive'] as const

export const FOREIGN_PROVENANCE: readonly string[] = [
  'caBX',
  'c2pa',
  'jumd',
  'gpt-image',
  'trainedAlgorithmicMedia',
  'OpenAI',
]
