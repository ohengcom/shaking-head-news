import { expect, test } from '@playwright/test'

test.describe('Core journey', () => {
  test('guest can navigate through public pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()

    await page.goto('/stats')
    await expect(page).not.toHaveURL(/\/login/)

    await page.goto('/rss')
    await expect(page).not.toHaveURL(/\/login/)

    await page.goto('/features')
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })

  test('login page exposes the available auth options', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Microsoft/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /继续浏览|Continue/i })).toBeVisible()
  })

  test('browser back and forward navigation stays stable', async ({ page }) => {
    await page.goto('/')
    await page.goto('/login')
    await page.goBack()
    await expect(page).toHaveURL('/')
    await page.goForward()
    await expect(page).toHaveURL(/\/login/)
  })
})
