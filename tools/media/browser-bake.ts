import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

import { chromium } from 'playwright-core'

export const BAKE_ORIGIN = 'https://bake.local'

export type BakeSize = { width: number; height: number }

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.gltf': 'model/gltf+json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

export async function bakeInBrowser(
  html: string,
  size: BakeSize,
  fileAt: (path: string) => string,
): Promise<Record<string, Buffer>> {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  try {
    const page = await browser.newPage({ viewport: size })
    const broken = new Promise<never>((_, reject) => page.once('pageerror', reject))
    await page.route(`${BAKE_ORIGIN}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/bake.html') {
        await route.fulfill({ contentType: 'text/html', body: html })
        return
      }
      const file = fileAt(path)
      await route.fulfill({
        contentType: CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
        body: await readFile(file),
      })
    })
    await page.goto(`${BAKE_ORIGIN}/bake.html`)
    const baked = await Promise.race([
      page.waitForFunction(
        () => (window as unknown as { baked?: Record<string, string> }).baked,
        undefined,
        { timeout: 240_000 },
      ),
      broken,
    ])
    const urls = await baked.jsonValue()
    if (!urls) throw new Error('the bake finished without its pictures')
    return Object.fromEntries(
      Object.entries(urls).map(([name, url]) => [
        name,
        Buffer.from(url.replace(/^data:image\/png;base64,/, ''), 'base64'),
      ]),
    )
  } finally {
    await browser.close()
  }
}
