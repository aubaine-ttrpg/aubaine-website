import { type PageRoute, pageRoutes } from '../../lib/game/pages'
import { POLICY_KINDS, type ViewKind } from '../../lib/i18n/routes'

const IMPLEMENTED_VIEWS = new Set<ViewKind>([
  ...POLICY_KINDS,
  'home',
  'books',
  'almanach',
  'skills',
  'equipment',
  'materials',
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

export async function builtRoutes(): Promise<PageRoute[]> {
  const routes = await pageRoutes()
  return routes.filter(({ page }) => IMPLEMENTED_VIEWS.has(page.kind))
}
