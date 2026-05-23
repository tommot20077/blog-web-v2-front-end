import { describe, expect, it, vi } from 'vitest'
import { waitForBackendReadiness } from './global-setup'

describe('global-setup backend readiness', () => {
  it('使用 readiness endpoint，且 backend 啟動中的失敗會重試直到成功', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '{"status":"DOWN"}' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"status":"UP"}' })

    await expect(
      waitForBackendReadiness({
        backendBase: 'http://localhost:9010',
        fetchImpl: fetchMock as typeof fetch,
        sleep: async () => undefined,
        retries: 2,
        delayMs: 1,
      }),
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:9010/actuator/health/readiness')
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:9010/actuator/health/readiness')
  })

  it('重試用盡後，錯誤訊息應指向 readiness endpoint', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'))

    await expect(
      waitForBackendReadiness({
        backendBase: 'http://localhost:9010',
        fetchImpl: fetchMock as typeof fetch,
        sleep: async () => undefined,
        retries: 2,
        delayMs: 1,
      }),
    ).rejects.toThrow('http://localhost:9010/actuator/health/readiness')
  })

  it('重試用盡後，應保留 readiness 的 HTTP status 與 body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 503, text: async () => '{"status":"DOWN"}' })

    await expect(
      waitForBackendReadiness({
        backendBase: 'http://localhost:9010',
        fetchImpl: fetchMock as typeof fetch,
        sleep: async () => undefined,
        retries: 2,
        delayMs: 1,
      }),
    ).rejects.toThrow('status 503 {"status":"DOWN"}')
  })
})
