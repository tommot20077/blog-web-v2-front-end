import { test as base, expect, type Page } from '@playwright/test'
import { getCredentials } from './auth'

type Role = 'reader' | 'author' | 'admin'

type MockControls = {
  resetAllMockState: () => void
  seedBookmark: (articleUuid: string) => void
  seedLike: (articleUuid: string) => void
  seedArticleComment: (articleUuid: string, content: string) => Promise<void>
  seedTagFollow: (tagUuid: string) => void
  mockApiFailure: (urlPattern: string | RegExp, body?: Record<string, unknown>, status?: number) => void
}

type AppRouter = {
  push: (path: string) => Promise<void>
}

type AuthStoreControls = {
  logout?: () => Promise<void> | void
  user?: unknown
  accessToken?: string | null
  returnUrl?: string | null
}

type AppPinia = {
  _s?: Map<string, AuthStoreControls>
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

async function resetAuthStore(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const pinia = (window as unknown as { __pinia?: AppPinia }).__pinia
    const authStore = pinia?._s?.get('auth')

    if (!authStore) {
      return
    }

    if (typeof authStore.logout === 'function') {
      await authStore.logout()
      return
    }

    authStore.user = null
    authStore.accessToken = null
    authStore.returnUrl = null
  })
}

async function uiLogin(page: Page, role: Role): Promise<void> {
  const creds = getCredentials(role)
  // NavigationBar A1（頭像下拉選單）：登出按鈕現在收在選單裡，預設是關閉狀態
  // （v-show，display:none），必須先點頭像展開選單才會變成 Playwright 認定的
  // "visible"。頭像本身只在已登入時才會渲染，所以用它來判斷「是否已登入」。
  const avatarButton = page.getByTestId('navbar-avatar')
  const logoutButton = page.getByTestId('navbar-logout-btn')
  if (await avatarButton.isVisible().catch(() => false)) {
    await avatarButton.click()
    await logoutButton.click()
    // NavigationBar.handleLogout() 的順序是 closeMenu() -> await authStore.logout() -> router.push('/')。
    // 選單一收起 logoutButton 就不可見了，所以「logoutButton 不可見」只代表選單關掉，
    // 不代表登出已完成；若此時就往 /login 走，會被後發的 router.push('/') 蓋掉而停在首頁。
    // 頭像只在已登入時渲染，且是在 authStore.logout() resolve（clearState）後才消失；
    // 再等導覽真的回到首頁，才能確定整段登出流程（含跳轉）都結束了。
    await expect(avatarButton).toBeHidden()
    await page.waitForURL((url) => url.pathname === '/', { timeout: 8000 })
  }

  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
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
  refreshCurrentRoute: () => Promise<void>
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
        return null
      }

      return originalGoto(url, options)
    }) as Page['goto']

    await use(page)
  },

  resetMockStateInApp: async ({ page }, use) => {
    await use(async () => {
      await withMockControls(page, controls => controls.resetAllMockState())
      await resetAuthStore(page)
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

  refreshCurrentRoute: async ({ page }, use) => {
    await use(async () => {
      if (await hasAppRouter(page)) {
        const currentPath = await page.evaluate(() => (
          window.location.pathname + window.location.search + window.location.hash
        ))
        await page.goto(currentPath)
        return
      }

      await page.reload()
    })
  },

  mockApiFailure: async ({ page }, use) => {
    await use(async (
      urlPattern: string | RegExp,
      body = { code: 'E_MOCK', message: 'Mock failure', data: null },
      status = 500,
    ) => {
      await withMockControls(
        page,
        (controls, pattern: string | RegExp, failureBody: Record<string, unknown>, statusCode: number) => {
          controls.mockApiFailure(pattern, failureBody, statusCode)
        },
        urlPattern,
        body,
        status,
      )
    })
  },
})

export { expect }
