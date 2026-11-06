import type {
  AlmanachBoot,
  AlmanachColour,
  AlmanachCrystalBoot,
  AlmanachFinishName,
} from '../lib/art-effect/almanach-look.ts'

type DevTool = { readonly tool: string; readonly name: string; readonly line: string }

export const DEV_HUB = {
  title: 'Dev Hub',
  description: "Les outils de fabrication d'Aubaine, qui n'existent que sous astro dev.",
  tape: 'Fabrication',
  lede: "Les outils qui servent à fabriquer le site. Ils n'existent que sous astro dev : la production, la préversion et les tests ne les construisent pas.",
  tools: [
    {
      tool: 'almanach',
      name: 'Almanach',
      line: "Composer le style d'un almanach, l'essayer sur n'importe quelle image et l'enregistrer pour une page.",
    },
  ] satisfies readonly DevTool[],
} as const

export const FINISH_NAMES: Readonly<Record<AlmanachFinishName, string>> = {
  or: 'Or',
  laiton: 'Laiton',
  bronze: 'Bronze',
  cuivre: 'Cuivre',
  'or-rose': 'Or rose',
  rose: 'Rose',
  argent: 'Argent',
  fer: 'Fer',
  'vert-de-gris': 'Vert-de-gris',
  noyer: 'Noyer',
  chene: 'Chêne',
  acajou: 'Acajou',
  ebene: 'Ébène',
  palissandre: 'Palissandre',
  merisier: 'Merisier',
  cuir: 'Cuir',
  'cuir-noir': 'Cuir noir',
  'cuir-bordeaux': 'Cuir bordeaux',
  'cuir-vieilli': 'Cuir vieilli',
}

type Swatch<T extends string> = { readonly value: T; readonly name: string }

export const CLASSIC_GEMS: readonly Swatch<AlmanachColour>[] = [
  { value: '#ff3b2f', name: 'Rubis' },
  { value: '#2fd27a', name: 'Émeraude' },
  { value: '#a46bff', name: 'Améthyste' },
  { value: '#ffb347', name: 'Ambre' },
  { value: '#f2efe6', name: 'Perle' },
]

export const ELEMENTAL_GEMS: readonly Swatch<AlmanachColour>[] = [
  { value: '#ff5a1f', name: 'Opale de feu' },
  { value: '#c27a2c', name: 'Topaze' },
  { value: '#4fc23a', name: 'Jade' },
  { value: '#9be22d', name: 'Péridot' },
  { value: '#2a8cff', name: 'Saphir' },
  { value: '#9fe6ff', name: 'Aigue-marine' },
  { value: '#7a7dff', name: 'Tanzanite' },
  { value: '#8a3cff', name: 'Violette' },
  { value: '#3a5bff', name: 'Lapis-lazuli' },
  { value: '#e0479a', name: 'Rhodolite' },
  { value: '#b3122e', name: 'Grenat' },
  { value: '#1f9e6a', name: 'Malachite' },
  { value: '#ffcf5a', name: 'Citrine' },
]

export const LIGHT_SWATCHES: readonly Swatch<AlmanachColour>[] = [
  { value: '#ffd27a', name: 'Bougie' },
  { value: '#7fd6ff', name: 'Givre' },
  { value: '#ff5a7a', name: 'Rose' },
]

export const BOOT_NAMES: Readonly<Record<AlmanachBoot, string>> = {
  instant: 'Instantané',
  fast: 'Flash',
  quick: 'CADRAN ×3',
  original: 'CADRAN',
}

export const CRYSTAL_BOOT_NAMES: Readonly<Record<AlmanachCrystalBoot, string>> = {
  instant: BOOT_NAMES.instant,
  fast: BOOT_NAMES.fast,
}

export const WORKBENCH = {
  title: 'Almanach',
  description: "Composer, essayer et enregistrer le style d'un almanach.",
  tape: 'Dev Hub · Almanach',
  lede: "Touchez le cristal pour allumer ou éteindre l'almanach, et l'écran pour changer de chaîne ou zoomer. Un style enregistré va dans data/almanachs/, et une page le donne à son almanach.",
  stage: 'Almanach en essai',
  weight: 'modèle 328 Ko · textures 525 Ko · 48 000 triangles',
  loading: 'chargement',
  ready: (seconds: string) => `prêt en ${seconds} s`,
  unavailable:
    "Ce navigateur ne peut pas dessiner l'almanach sur sa carte graphique : les images restent visibles sans le tube.",
  failed: "L'almanach n'a pas pu démarrer. La console du navigateur dit pourquoi.",
  pictures: 'Images',
  picturesHint: "Chaque image choisie devient une chaîne, dans l'ordre du choix.",
  upload: '+ Votre image',
  dropped: (name: string) =>
    `${name} n'est pas une image. Choisissez un PNG, un JPEG, un WebP ou un AVIF.`,
  framing: 'Cadrage',
  whole: 'Entière',
  fill: 'Remplie',
  focusX: 'Point gardé, horizontal',
  focusY: 'Point gardé, vertical',
  tube: 'Tube',
  powerOn: 'Allumer',
  powerOff: 'Éteindre',
  soundOn: 'Son activé',
  soundOff: 'Son coupé',
  zoomIn: 'Agrandir',
  zoomOut: "Voir l'image entière",
  motion: 'Mouvement',
  full: 'Complet',
  calm: 'Calme',
  play: 'Jouer un démarrage',
  crystalBoot: 'Démarrage au cristal',
  battery: 'Batterie',
  batteryNone: 'Aucune',
  batteryLevel: 'Niveau',
  batteryDevice: 'Appareil',
  batteryValue: 'Niveau de la batterie',
  osd: 'Incrustations',
  controls: 'Boutons du site',
  copy: 'Langue',
  lighting: 'Éclairage',
  studio: 'Studio',
  room: 'Pièce',
  on: 'Oui',
  off: 'Non',
  case: 'Style',
  part: 'Pièce',
  caseHint: 'Chaque pièce, pour cet almanach seul.',
  parts: {
    metal: 'Boîtier',
    trim: 'Garnitures',
    grip: 'Poignée',
    gem: 'Cristal',
    magic: 'Magie',
    light: 'Bandes lumineuses',
  },
  families: { metals: 'Métaux', woods: 'Bois', leathers: 'Cuirs', painted: 'Peint' },
  steel: 'Acier',
  paintedGrip: 'Peinte',
  cyan: 'Cyan',
  classicGems: 'Pierres',
  elementalGems: 'Éléments',
  noMagic: 'Aucune',
  nature: 'Nature',
  picture: "Suit l'image",
  anyColour: 'Toute couleur',
  gloss: {
    metal: 'Brillant du boîtier',
    trim: 'Brillant des garnitures',
    grip: 'Brillant de la poignée',
  },
  overallGloss: 'Brillant général',
  matte: 'mat',
  glossy: 'brillant',
  code: 'Code',
  component: 'Composant',
  lore: 'Image de lore',
  loreHint: 'Enregistrez le style pour obtenir la ligne Markdown.',
  lorePortrait:
    "Un almanach de lore montre une image large : choisissez une image qui n'est pas en portrait.",
  json: 'Fichier',
  copyCode: 'Copier',
  copied: 'Copié',
  save: 'Enregistrer',
  saveName: 'Nom du style',
  saveHint: 'En minuscules, avec des tirets, comme humain ou elfe-des-bois.',
  saved: (id: string) => `Enregistré dans data/almanachs/${id}.json.`,
  saveFailed: (reason: string) => `Rien n'a été enregistré : ${reason}.`,
  savedStyles: 'Styles enregistrés',
  open: 'Ouvrir',
  gallery: 'Tous les styles',
  galleryHint: 'Chaque style enregistré, rendu par le composant Almanach comme sur une page.',
  openInEditor: "Ouvrir dans l'éditeur",
} as const
