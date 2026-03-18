# E2E Tests

This directory contains end-to-end tests for the Shaking Head News application using Playwright.

## Test Files

### 1. `news-browsing.spec.ts`

Tests the news browsing functionality:

- Homepage display and layout
- Feature cards rendering
- Navigation functionality
- Responsive design
- Accessibility compliance
- Error handling

### 2. `auth-and-settings.spec.ts`

Tests user authentication and settings flow:

- Login page display and functionality
- Protected route access
- Redirect behavior
- Settings page structure
- Form validation
- Mobile responsiveness

### 3. `rotation.spec.ts`

Tests page rotation functionality:

- Rotation wrapper rendering
- Reduced motion preference handling

### 4. `rss-management.spec.ts`

Tests RSS source management:

- RSS page access control
- Navigation behavior
- Expected features (documented for authenticated users)
- Error handling
- Mobile responsiveness

### 5. `user-journey.spec.ts`

Tests complete user journeys:

- Full browsing sessions
- Multi-page navigation
- Browser back/forward
- State persistence
- Viewport responsiveness
- Performance metrics
- Touch interactions (mobile)

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run specific test file

```bash
npx playwright test tests/e2e/news-browsing.spec.ts
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

### Run tests for specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests for mobile

```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- Base URL: `http://localhost:3000` (configurable via `PLAYWRIGHT_TEST_BASE_URL`)
- Browsers: Chromium, Firefox, WebKit
- Mobile devices: Pixel 5, iPhone 12
- Automatic dev server startup
- Screenshot on failure
- Trace on first retry

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('selector')

    // Act
    await element.click()

    // Assert
    await expect(element).toBeVisible()
  })
})
```

### Best Practices

1. **Use data-testid for stable selectors**

   ```typescript
   const button = page.locator('[data-testid="submit-button"]')
   ```

2. **Wait for network idle when needed**

   ```typescript
   await page.waitForLoadState('networkidle')
   ```

3. **Use proper assertions**

   ```typescript
   await expect(element).toBeVisible()
   await expect(element).toHaveText('Expected text')
   await expect(page).toHaveURL('/expected-url')
   ```

4. **Handle conditional elements**

   ```typescript
   const isVisible = await element.isVisible().catch(() => false)
   if (isVisible) {
     await element.click()
   }
   ```

5. **Test accessibility**

   ```typescript
   // Check keyboard navigation
   await page.keyboard.press('Tab')

   // Check ARIA attributes
   await expect(button).toHaveAttribute('aria-label', 'Submit')
   ```

## Authentication Testing

Currently, tests verify redirect behavior for protected routes. To test authenticated flows:

1. **Option 1: Use Playwright's authentication**

   ```typescript
   test.use({
     storageState: 'auth.json',
   })
   ```

2. **Option 2: Mock authentication**

   ```typescript
   await page.route('**/api/auth/**', (route) => {
     route.fulfill({
       status: 200,
       body: JSON.stringify({ user: { id: '1', name: 'Test User' } }),
     })
   })
   ```

3. **Option 3: Use test user credentials**
   ```typescript
   await page.goto('/login')
   await page.fill('[name="email"]', 'test@example.com')
   await page.fill('[name="password"]', 'password')
   await page.click('button[type="submit"]')
   ```

## Debugging Tests

### View test report

```bash
npx playwright show-report
```

### Generate trace

```bash
npx playwright test --trace on
```

### View trace

```bash
npx playwright show-trace trace.zip
```

### Use Playwright Inspector

```bash
npx playwright test --debug
```

## CI/CD Integration

Tests are configured to run in CI with:

- Retry on failure (2 retries)
- Single worker (no parallel execution)
- HTML reporter
- Screenshot and trace on failure

## Coverage

Current E2E test coverage includes:

- ✅ News browsing flow
- ✅ User authentication flow
- ✅ Settings page access
- ✅ Page rotation wrapper functionality
- ✅ RSS management access
- ✅ Navigation and routing
- ✅ Responsive design
- ✅ Accessibility
- ✅ Error handling
- ✅ Performance

## Known Limitations

1. **Authentication**: Tests currently verify redirect behavior. Full authenticated flows require auth setup.
2. **External APIs**: Tests don't mock external news APIs. Consider adding API mocking for more reliable tests.
3. **Database**: Tests don't interact with real database. Consider using test database for integration tests.

## Future Improvements

- [ ] Add API mocking for external services
- [ ] Set up test authentication
- [ ] Add visual regression testing
- [ ] Add performance benchmarks
- [ ] Add accessibility audits (axe-core)
- [ ] Add network condition testing
- [ ] Add internationalization testing
