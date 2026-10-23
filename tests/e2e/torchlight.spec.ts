import { expect, test } from '@playwright/test'

const TORCH_PICTURE = /\/_astro\/nnor-fresque-3_1-og\.[^/]+$/

test('a lore picture left before it loads holds no GPU context', async ({ page }) => {
  await page.addInitScript(() => {
    const created: WebGLRenderingContext[] = []
    const kept = window as unknown as { torchContexts: WebGLRenderingContext[] }
    kept.torchContexts = created
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        const context: unknown = Reflect.apply(original, this, [kind, ...rest])
        if (kind === 'webgl' && context instanceof WebGLRenderingContext) created.push(context)
        return context
      },
    })
  })
  let held = 0
  await page.route(TORCH_PICTURE, async (route) => {
    held += 1
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await route.continue()
  })
  await page.goto('/fr/espece/nnor', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => 'swup' in window)
  await expect.poll(() => held).toBeGreaterThan(0)
  await page.locator('#site-header [data-nav="home"]').click()
  await expect(page).toHaveURL('/fr')
  await page.waitForTimeout(3000)
  const alive = await page.evaluate(
    () =>
      (window as unknown as { torchContexts: WebGLRenderingContext[] }).torchContexts.filter(
        (context) => !context.isContextLost(),
      ).length,
  )
  expect(alive).toBe(0)
})
