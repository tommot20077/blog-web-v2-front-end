import { test as base, expect, type Page, type Route } from '@playwright/test'
import { getCredentials } from './auth'

type Role = 'reader' | 'author' | 'admin'

type MockControls = {
  resetAllMockState: () => void
  seedBookmark: (articleUuid: string) => void
  seedLike: (articleUuid: string) => void
  seedArticleComment: (articleUuid: string, content: string) => Promise<void>
  seedTagFollow: (tagUuid: string) => void
}

type AppRouter = {
  push: (path: string) => Promise<void>
}

async function hasAppRouter(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return Boolean((window as unknown as { __router?: unknown }).__router)
  }).catch(() => false)
}

function isInAppPath(url: string | URL): url is string {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')
}

async function waitForMockControls(page: Page): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as { __mockE2E?: unknown }).__mockE2E))
}

async function ensureMockControls(page: Page): Promise<void> {
  const hasControls = await page.evaluate(() => {
    return Boolean((window as unknown as { __mockE2E?: unknown }).__mockE2E)
  }).catch(() => false)

  if (!hasControls) {
    await page.goto('/')
  }

  await waitForMockControls(page)
}

async function withMockControls<T, Args extends unknown[]>(
  page: Page,
  fn: (controls: MockControls, ...args: Args) => T | Promise<T>,
  ...args: Args
): Promise<T> {
  await ensureMockControls(page)
  return page.evaluate(async ({ source, args }) => {
    const controls = (window as unknown as { __mockE2E: MockControls }).__mockE2E
    const fn = new Function('controls', 'args', `return (${source})(controls, ...args)`)
    return fn(controls, args)
  }, { source: fn.toString(), args })
}

async function uiLogin(page: Page, role: Role): Promise<void> {
  const creds = getCredentials(role)
  await page.goto('/login')
  await page.getByTestId('auth-login-field-email').fill(creds.email)
  await page.getByTestId('auth-login-field-password').fill(creds.password)
  await page.getByTestId('auth-login-submit').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 8000 })
}

export const test = base.extend<{
  resetMockStateInApp: () => Promise<void>
  loginAs: (role: Role) => Promise<void>
  seedBookmark: (articleUuid: string) => Promise<void>
  expectToast: (text: string | RegExp) => Promise<void>
  expectAuthRedirect: (path: string) => Promise<void>
  mockApiFailure: (
    urlPattern: string | RegExp,
    body?: Record<string, unknown>,
    status?: number,
  ) => Promise<void>
}>({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page)

    page.goto = (async (url: string | URL, options?: Parameters<Page['goto']>[1]) => {
      if (isInAppPath(url) && await hasAppRouter(page)) {
        await page.evaluate(async (target) => {
          const router = (window as unknown as { __router: AppRouter }).__router
          const current = window.location.pathname + window.location.search + window.location.hash

          if (current === target) {
            await router.push('/')
          }

          await router.push(target)
        }, url)
        await page.waitForURL(url, { timeout: options?.timeout ?? 8000 })
        return null
      }

      return originalGoto(url, options)
    }) as Page['goto']

    await use(page)
  },

  resetMockStateInApp: async ({ page }, use) => {
    await use(async () => {
      await withMockControls(page, controls => controls.resetAllMockState())
    })
  },

  loginAs: async ({ page }, use) => {
    await use(async (role: Role) => {
      await uiLogin(page, role)
    })
  },

  seedBookmark: async ({ page }, use) => {
    await use(async (articleUuid: string) => {
      await withMockControls(page, (controls, uuid: string) => controls.seedBookmark(uuid), articleUuid)
    })
  },

  expectToast: async ({ page }, use) => {
    await use(async (text: string | RegExp) => {
      await expect(page.locator('.toast, [role="alert"]').filter({ hasText: text })).toBeVisible({ timeout: 5000 })
    })
  },

  expectAuthRedirect: async ({ page }, use) => {
    await use(async (path: string) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  },

  mockApiFailure: async ({ page }, use) => {
    await use(async (
      urlPattern: string | RegExp,
      body = { code: 'E_MOCK', message: 'Mock failure', data: null },
      status = 500,
    ) => {
      await page.route(urlPattern, async (route: Route) => {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(body),
        })
      })
    })
  },
})

export { expect }
