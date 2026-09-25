import { unified } from '@astrojs/markdown-remark'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import swup from '@swup/astro'
import { defineConfig } from 'astro/config'
import { defListHastHandlers, remarkDefinitionList } from 'remark-definition-list'

import {
  rehypeCodexTerms,
  rehypeProseQuotes,
  rehypeProseTables,
} from './src/lib/game/book-markup.ts'
import { DEFAULT_LOCALE, LOCALES } from './src/lib/i18n/locales.ts'
import { inlineScriptPolicy } from './src/lib/security/script-policy.ts'

export default defineConfig({
  site: 'https://aubaine.io',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  image: {
    service: { entrypoint: './src/lib/rights/image-service.ts', config: {} },
    responsiveStyles: true,
    layout: 'constrained',
  },
  markdown: {
    processor: unified({
      gfm: true,
      remarkPlugins: [remarkDefinitionList],
      remarkRehype: { handlers: { ...defListHastHandlers } },
      rehypePlugins: [
        rehypeProseQuotes,
        rehypeCodexTerms(new URL('.', import.meta.url).pathname),
        rehypeProseTables,
      ],
    }),
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    react(),
    swup({
      theme: false,
      animationClass: 'au-swup-',
      containers: ['#swup', '#site-footer'],
      cache: true,
      forms: false,
      loadOnIdle: false,
      preload: { hover: true, visible: false },
      progress: false,
      accessibility: true,
      reloadScripts: false,
      smoothScrolling: false,
      updateBodyClass: false,
      updateHead: true,
      globalInstance: true,
      ignore: [/\.pdf($|\?)/, /\.mp4($|\?)/, /\.zip($|\?)/],
    }),
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: { fr: 'fr-FR', en: 'en-GB' } },
      filter: (page) => new URL(page).pathname !== '/' && !/\/(recherche|search)(\/|$)/.test(page),
    }),
    inlineScriptPolicy(),
  ],
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
        '@game': new URL('./src/lib/codex', import.meta.url).pathname,
        '@i18n': new URL('./src/lib/i18n', import.meta.url).pathname,
        '@components': new URL('./src/components', import.meta.url).pathname,
        '@islands': new URL('./src/islands', import.meta.url).pathname,
        '@layouts': new URL('./src/layouts', import.meta.url).pathname,
      },
    },
  },
})
