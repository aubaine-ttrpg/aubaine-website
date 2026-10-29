import { expect, type Page } from '@playwright/test'

export async function freezeAnimations(page: Page): Promise<void> {
  const devtools = await page.context().newCDPSession(page)
  await devtools.send('Animation.enable')
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 0 })
}

export async function atMoment(page: Page, milliseconds: number, animated: string): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        (selector) => (document.querySelector(selector)?.getAnimations().length ?? 0) > 0,
        animated,
      ),
    )
    .toBe(true)
  await page.evaluate((time) => {
    for (const animation of document.getAnimations()) {
      animation.pause()
      animation.currentTime = time
    }
  }, milliseconds)
}
