import { expect, test } from '@playwright/test'

test.describe('RSS page for guests', () => {
  test('rss page is publicly accessible without redirecting to login', async ({ page }) => {
    await page.goto('/rss')

    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /rss/i }).first()).toBeVisible()
  })

  test('guest users see an unlock prompt instead of management controls', async ({ page }) => {
    await page.goto('/rss')

    const main = page.locator('main')

    await expect(main.getByRole('button').first()).toBeVisible()
    await expect(main.getByRole('heading', { level: 4 }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /add rss/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /export opml/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /import opml/i })).toHaveCount(0)
  })

  test('rss page remains keyboard accessible from the main navigation', async ({ page }) => {
    await page.goto('/')

    let tabCount = 0
    let foundRssLink = false

    while (tabCount < 20 && !foundRssLink) {
      await page.keyboard.press('Tab')
      tabCount++

      const focusedElement = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null
        return {
          href: element?.getAttribute('href'),
          text: element?.textContent,
        }
      })

      if (focusedElement.href === '/rss' || /rss/i.test(focusedElement.text ?? '')) {
        foundRssLink = true
      }
    }

    expect(foundRssLink).toBe(true)
  })

  test('rss page preserves a valid document structure for guests', async ({ page }) => {
    await page.goto('/rss')

    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('invalid rss subpages fall back to the 404 experience', async ({ page }) => {
    await page.goto('/rss/invalid-page')

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
  })

  test('browser navigation stays stable after visiting the public rss page', async ({ page }) => {
    await page.goto('/')
    await page.goto('/rss')

    await expect(page).toHaveURL('/rss')

    await page.goBack()
    await expect(page).toHaveURL('/')
  })

  test('rss page remains usable on mobile viewports', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }

    await page.goto('/rss')

    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /rss/i }).first()).toBeVisible()
  })
})
