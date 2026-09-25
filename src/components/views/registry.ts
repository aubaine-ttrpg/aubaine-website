import { POLICY_KINDS, type ViewKind } from '../../lib/i18n/routes'

export const IMPLEMENTED_VIEWS = new Set<ViewKind>([
  ...POLICY_KINDS,
  'home',
  'books',
  'almanach',
  'skills',
  'equipment',
  'rules',
  'search',
  'trees',
  'tree',
  'species',
  'speciesEntry',
  'book',
  'archives',
  'archive',
  'notFound',
])
