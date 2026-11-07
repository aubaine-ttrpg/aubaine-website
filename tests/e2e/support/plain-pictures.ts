import type { Page } from '@playwright/test'

import { GPU_KEY, type GpuVerdict } from '../../../src/scripts/gpu'

type Watched = { plainSeen: string[] }

export async function watchPlainPictures(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const watched = window as unknown as Watched
    watched.plainSeen = []
    const plain =
      '[data-drape] > .au-heraldry__plain, .au-prose__frame img, [data-almanach] > img[data-almanach-picture]'
    const kindOf = (picture: Element): string => {
      const drape = picture.closest('[data-drape]')?.getAttribute('data-drape')
      if (drape) return drape
      return picture.closest('[data-almanach]') ? 'almanach' : 'glass'
    }
    const painted = (picture: Element): boolean => {
      const style = getComputedStyle(picture)
      if (style.visibility !== 'visible' || Number(style.opacity) === 0) return false
      const box = picture.getBoundingClientRect()
      return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight
    }
    const sample = (): void => {
      for (const picture of document.querySelectorAll(plain)) {
        const kind = kindOf(picture)
        if (painted(picture) && !watched.plainSeen.includes(kind)) watched.plainSeen.push(kind)
      }
      window.requestAnimationFrame(sample)
    }
    window.requestAnimationFrame(sample)
  })
}

export function plainPicturesSeen(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as Watched).plainSeen)
}

export function storedGpu(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), GPU_KEY)
}

export async function rememberGpu(page: Page, verdict: GpuVerdict): Promise<void> {
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [
    GPU_KEY,
    verdict,
  ] as const)
}
