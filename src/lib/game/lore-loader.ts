import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Loader, LoaderContext } from 'astro/loaders'
import { LORE_PARTS, lorePartId, splitLore } from './lore-parts.ts'

const LORE_EXTENSION = '.md'

const posix = (path: string): string => path.split(sep).join('/')

const pageOf = (directory: string, path: string): string =>
  posix(relative(directory, path)).slice(0, -LORE_EXTENSION.length)

async function storePart(
  { config, store, parseData, renderMarkdown, generateDigest }: LoaderContext,
  path: string,
  id: string,
  body: string,
): Promise<void> {
  const digest = generateDigest(body)
  if (store.get(id)?.digest === digest) return
  const rendered = await renderMarkdown(body, { fileURL: pathToFileURL(path) })
  const imagePaths = rendered.metadata?.imagePaths
  store.set({
    id,
    data: await parseData({ id, data: {}, filePath: path }),
    body,
    filePath: posix(relative(fileURLToPath(config.root), path)),
    digest,
    rendered,
    ...(imagePaths ? { assetImports: imagePaths } : {}),
  })
}

async function syncPage(
  context: LoaderContext,
  directory: string,
  path: string,
): Promise<string[]> {
  const page = pageOf(directory, path)
  const parts = splitLore(await readFile(path, 'utf8'))
  const stored: string[] = []
  for (const part of LORE_PARTS) {
    const id = lorePartId(page, part)
    const body = parts[part]
    if (body === undefined) {
      context.store.delete(id)
    } else {
      await storePart(context, path, id, body)
      stored.push(id)
    }
  }
  return stored
}

function watchPages(context: LoaderContext, directory: string): void {
  const { watcher, store, logger } = context
  if (!watcher) return
  watcher.add(directory)
  const isLorePage = (path: string): boolean =>
    path.startsWith(directory) && path.endsWith(LORE_EXTENSION)
  const reload = (path: string): void => {
    if (!isLorePage(path)) return
    syncPage(context, directory, path).then(
      () => logger.info(`Reloaded ${pageOf(directory, path)}`),
      (error: unknown) =>
        logger.error(`Failed to reload ${pageOf(directory, path)}: ${String(error)}`),
    )
  }
  watcher.on('change', reload)
  watcher.on('add', reload)
  watcher.on('unlink', (path: string) => {
    if (!isLorePage(path)) return
    for (const part of LORE_PARTS) store.delete(lorePartId(pageOf(directory, path), part))
  })
}

export function loreLoader(base: string): Loader {
  return {
    name: 'lore-loader',
    load: async (context) => {
      const directory = fileURLToPath(new URL(base, context.config.root))
      const stale = new Set(context.store.keys())
      const files = (await readdir(directory, { recursive: true })).filter((file) =>
        file.endsWith(LORE_EXTENSION),
      )
      for (const file of files) {
        for (const id of await syncPage(context, directory, join(directory, file))) {
          stale.delete(id)
        }
      }
      for (const id of stale) context.store.delete(id)
      watchPages(context, directory)
    },
  }
}
