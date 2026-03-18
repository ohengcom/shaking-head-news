import { expect, test } from '@playwright/test'

test.describe('Authentication and route protection', () => {
  test('login page renders the available auth options', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /microsoft/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /continue|继续浏览|无需登录/i })).toBeVisible()
  })

  test('continue browsing link returns the user to the homepage', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /continue|继续浏览|无需登录/i }).click()

    await expect(page).toHaveURL('/')
  })

  test('settings page remains protected for guests', async ({ page }) => {
    await page.goto('/settings')

    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirect to login preserves the callback URL for protected settings', async ({ page }) => {
    await page.goto('/settings')

    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/callbackUrl=%2Fsettings|callbackUrl=\/settings/)
  })

  test('stats page is public for guests', async ({ page }) => {
    await page.goto('/stats')

    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('rss page is public for guests', async ({ page }) => {
    await page.goto('/rss')

    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /rss/i }).first()).toBeVisible()
  })

  test('login page exposes terms and privacy notice', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText(/服务条款|Terms/i)).toBeVisible()
    await expect(page.getByText(/隐私政策|Privacy/i)).toBeVisible()
  })

  test('login page keeps a stable, accessible form structure', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }

    await page.goto('/login')

    const forms = page.locator('form')
    await expect(forms).toHaveCount(2)
    await expect(forms.first().locator('button[type="submit"]')).toBeVisible()
    await expect(forms.last().locator('button[type="submit"]')).toBeVisible()

    const loginCard = page.locator('.shadow-xl')
    await expect(loginCard).toBeVisible()

    const primaryButton = page.getByRole('button', { name: /google/i })
    const buttonBox = await primaryButton.boundingBox()
    const cardBox = await loginCard.boundingBox()

    if (buttonBox && cardBox) {
      expect(buttonBox.width).toBeGreaterThan(cardBox.width * 0.8)
    }
  })
})
