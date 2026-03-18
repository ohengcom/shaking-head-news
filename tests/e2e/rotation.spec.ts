import { test, expect } from '@playwright/test'

test.describe('Page Rotation Wrapper', () => {
  test('should render rotation wrapper on home page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const wrapper = page.locator('[data-testid="tilt-wrapper"]')
    await expect(wrapper).toBeVisible()
  })

  test('should render wrapper with reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const wrapper = page.locator('[data-testid="tilt-wrapper"]')
    await expect(wrapper).toBeVisible()
  })
})
