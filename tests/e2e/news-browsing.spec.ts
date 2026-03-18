import { expect, test } from '@playwright/test'

test.describe('Public browsing', () => {
  test('homepage renders the public layout', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(page.getByTestId('tilt-wrapper')).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('stats page is public', async ({ page }) => {
    await page.goto('/stats')

    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })

  test('rss page is public', async ({ page }) => {
    await page.goto('/rss')

    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /RSS/i }).first()).toBeVisible()
  })

  test('settings page remains protected', async ({ page }) => {
    await page.goto('/settings')

    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/\/login/)
  })

  test('404 page is rendered for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
  })
})
