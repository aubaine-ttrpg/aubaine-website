import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'

import { ALMANACH_SAVE_PATH, saveAlmanachStyle } from './almanach-store.ts'

const STYLE_REGISTRY = fileURLToPath(
  new URL('../lib/art-effect/almanach-styles.ts', import.meta.url),
)

export function devHubRuns(
  command: string,
  environment: Readonly<Record<string, string | undefined>>,
): boolean {
  return command === 'dev' && environment['VITEST'] === undefined
}

export function devHub(): AstroIntegration {
  let styles: URL | undefined
  return {
    name: 'aubaine:dev-hub',
    hooks: {
      'astro:config:setup': ({ command, config, injectRoute }) => {
        if (!devHubRuns(command, process.env)) return
        styles = new URL('data/almanachs/', config.root)
        injectRoute({
          pattern: '/[locale]/dev',
          entrypoint: new URL('./pages/hub.astro', import.meta.url),
        })
        injectRoute({
          pattern: '/[locale]/dev/almanach',
          entrypoint: new URL('./pages/almanach.astro', import.meta.url),
        })
      },
      'astro:server:setup': ({ server, logger }) => {
        const directory = styles
        if (!directory) return
        server.middlewares.use(ALMANACH_SAVE_PATH, (request, response) => {
          saveAlmanachStyle(request, response, directory).catch((error: unknown) => {
            logger.error(`the almanach style could not be saved: ${String(error)}`)
            response.statusCode = 500
            response.end()
          })
        })
        const folder = fileURLToPath(directory)
        const reloadRegistry = (file: string): void => {
          if (!file.startsWith(folder)) return
          for (const environment of Object.values(server.environments)) {
            for (const module of environment.moduleGraph.getModulesByFile(STYLE_REGISTRY) ?? []) {
              environment.reloadModule(module).catch((error: unknown) => {
                logger.error(`the almanach styles could not be reloaded: ${String(error)}`)
              })
            }
          }
        }
        server.watcher.on('add', reloadRegistry)
        server.watcher.on('unlink', reloadRegistry)
      },
    },
  }
}
