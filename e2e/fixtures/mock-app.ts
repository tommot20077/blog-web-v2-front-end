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

async function isAuthenticatedInApp(page: Page): Promise<boolean> {
  // 不吞錯：這裡的結果直接決定 uiLogin 是否略過登出、直衝 /login。若 evaluate
  // 真的失敗（例如頁面正巧在導覽中，execution context 被摧毀），吞成 false
  // 會讓呼叫端誤判成「未登入」而跳過必要的登出，最後在 /login 的 guestOnly
  // 守衛上失敗、噴出一個難查根因的逾時錯誤。讓錯誤直接浮出，才能在源頭看見。
  return page.evaluate(() => {
    const pinia = (window as unknown as { __pinia?: AppPinia }).__pinia
    const authStore = pinia?._s?.get('auth')

    // 與 router guard 的 authStore.isAuthenticated 同一個判準（!!accessToken）
    return Boolean(authStore?.accessToken)
  })
}

async function uiLogin(page: Page, role: Role): Promise<void> {
  const creds = getCredentials(role)

  // 換帳號必須先真的登出：/login 是 guestOnly，還登入著就會被守衛導回 '/'。
  //
  // 「是否已登入」不能用頭像看不看得到來判斷。登出入口只掛在 NavigationBar 上，
  // 而 App.vue 的 isShellOrFull 會讓 layout 為 shell / full / admin 的頁面
  // （/my-articles、/settings、/editor、/admin/*）整個不渲染 NavigationBar；
  // 在這些頁面上頭像本來就不存在，用它判斷會靜默略過登出。改問 app 自己的
  // auth store（權威來源）判斷是否登入中。
  //
  // 登出動作本身直接呼叫 resetAuthStore（→ authStore.logout()），不繞 UI：
  // logout() 不做任何 router.push（見 src/stores/auth.ts），不必依賴
  // NavigationBar 是否有渲染、也不必等回首頁再展開頭像選單去點登出按鈕。
  // 登出 UI 本身的覆蓋率不受影響：另有 e2e/mock/auth-flow.spec.ts:51-54 與
  // e2e/integration/auth-logout.spec.ts 專測。
  if (await isAuthenticatedInApp(page)) {
    await resetAuthStore(page)
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
