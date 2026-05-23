import { test, expect } from './fixtures/fullstack-red'

test.describe('P0 full-stack red - auth lifecycle', () => {
  test('backend readiness is available before browser flow starts', async ({
    backendUrl,
    loginViaApi,
    uiLogin,
    waitForBackend,
  }) => {
    const loginViaApiWithCredentials: (identifier: string, password: string) => Promise<unknown> = loginViaApi
    const uiLoginWithCredentials: (identifier: string, password: string) => Promise<void> = uiLogin

    expect(loginViaApiWithCredentials).toBe(loginViaApi)
    expect(uiLoginWithCredentials).toBe(uiLogin)

    await waitForBackend()

    expect(backendUrl).toContain('http')
  })
})
