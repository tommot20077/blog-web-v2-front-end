import { test as base } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:9010'

type FullstackRedFixtures = {
  backendUrl: string
  waitForBackend: () => Promise<void>
  expectSeedUserCanLogin: (identifier: string, password: string, roleLabel?: string) => Promise<void>
  loginViaApi: (identifier: string, password: string) => Promise<unknown>
  uiLogin: (identifier: string, password: string) => Promise<void>
}

async function assertBackendReadiness(request: APIRequestContext): Promise<void> {
  const readinessUrl = `${BACKEND}/actuator/health/readiness`

  try {
    const response = await request.get(readinessUrl, { timeout: 5000 })
    if (response.ok()) {
      return
    }

    const body = await response.text()
    throw new Error(`status ${response.status()} ${body}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`backend readiness failed: ${readinessUrl} - ${message}`)
  }
}

async function loginWithApi(
  request: APIRequestContext,
  identifier: string,
  password: string,
): Promise<unknown> {
  const response = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: {
      identifier,
      password,
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`backend API login failed: status ${response.status()} ${body}`)
  }

  return response.json()
}

async function expectSeedUserCanLoginWithApi(
  request: APIRequestContext,
  identifier: string,
  password: string,
  roleLabel = 'USER',
): Promise<void> {
  const response = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: {
      identifier,
      password,
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(
      `Full-stack red precondition failed: required ${roleLabel} seed user ${identifier} cannot login (status ${response.status()}, body ${body})`,
    )
  }
}

async function loginWithUi(page: Page, identifier: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByTestId('auth-login-field-email').fill(identifier)
  await page.getByTestId('auth-login-field-password').fill(password)
  await page.getByTestId('auth-login-submit').click()
}

export const test = base.extend<FullstackRedFixtures>({
  backendUrl: async ({}, use) => {
    await use(BACKEND)
  },
  waitForBackend: async ({ request }, use) => {
    await use(() => assertBackendReadiness(request))
  },
  loginViaApi: async ({ request }, use) => {
    await use((identifier, password) => loginWithApi(request, identifier, password))
  },
  expectSeedUserCanLogin: async ({ request }, use) => {
    await use((identifier, password, roleLabel) =>
      expectSeedUserCanLoginWithApi(request, identifier, password, roleLabel),
    )
  },
  uiLogin: async ({ page }, use) => {
    await use((identifier, password) => loginWithUi(page, identifier, password))
  },
})

export { expect } from '@playwright/test'
