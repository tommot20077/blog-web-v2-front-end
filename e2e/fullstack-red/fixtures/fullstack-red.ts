import { test as base } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { activateUser } from '../../fixtures/admin-helpers'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:9010'

const SEED_USERS: Record<string, { username: string; nickname: string }> = {
  'reader@test.local': { username: 'reader_e2e', nickname: 'Reader' },
  'author@test.local': { username: 'author_e2e', nickname: 'Author' },
  'admin@test.local': { username: 'admin_e2e', nickname: 'Admin' },
}

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
  await ensureSeedUserCanLogin(request, identifier, password, roleLabel)
}

async function ensureSeedUserCanLogin(
  request: APIRequestContext,
  identifier: string,
  password: string,
  roleLabel: string,
): Promise<void> {
  const response = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: {
      identifier,
      password,
    },
  })

  if (response.ok()) {
    return
  }

  const firstLoginBody = await response.text()
  const seedUser = SEED_USERS[identifier]
  if (!seedUser) {
    throw new Error(
      `Full-stack red precondition failed: required ${roleLabel} seed user ${identifier} cannot login (status ${response.status()}, body ${firstLoginBody})`,
    )
  }

  const registerResponse = await request.post(`${BACKEND}/api/v1/auth/register`, {
    data: {
      email: identifier,
      username: seedUser.username,
      nickname: seedUser.nickname,
      password,
    },
  })

  if (!registerResponse.ok() && registerResponse.status() !== 400 && registerResponse.status() !== 409) {
    throw new Error(
      `Full-stack red precondition failed: seed user ${identifier} registration failed (status ${registerResponse.status()}, body ${await registerResponse.text()})`,
    )
  }

  activateUser(identifier, roleLabel)

  const retryResponse = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: {
      identifier,
      password,
    },
  })

  if (!retryResponse.ok()) {
    const body = await retryResponse.text()
    throw new Error(
      `Full-stack red precondition failed: required ${roleLabel} seed user ${identifier} cannot login after seeding (initial status ${response.status()}, initial body ${firstLoginBody}, retry status ${retryResponse.status()}, body ${body})`,
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
