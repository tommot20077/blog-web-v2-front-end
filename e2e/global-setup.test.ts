import { describe, expect, it, vi } from 'vitest'
import { startAuthRateLimitResetLoop, waitForBackendReadiness } from './global-setup'

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

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:9010/actuator/health/readiness',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:9010/actuator/health/readiness',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
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

  it('每次 readiness fetch 都帶 timeout signal，避免單次 request 無限等待', async () => {
    const signals: AbortSignal[] = []
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal)
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    })

    await expect(
      waitForBackendReadiness({
        backendBase: 'http://localhost:9010',
        fetchImpl: fetchMock as typeof fetch,
        sleep: async () => undefined,
        retries: 1,
        delayMs: 1,
        attemptTimeoutMs: 1,
      }),
    ).rejects.toThrow('aborted')

    expect(signals).toHaveLength(1)
    expect(signals[0].aborted).toBe(true)
  })
})

describe('auth rate limit reset loop', () => {
  it('週期性呼叫 reset，直到 stop() 後停止', () => {
    vi.useFakeTimers()
    try {
      const reset = vi.fn()
      const stop = startAuthRateLimitResetLoop({ intervalMs: 1000, reset })

      // global-setup 進 loop 前已重置一次，loop 不應立刻再打
      expect(reset).not.toHaveBeenCalled()

      vi.advanceTimersByTime(3000)
      expect(reset).toHaveBeenCalledTimes(3)

      stop()
      vi.advanceTimersByTime(5000)
      expect(reset).toHaveBeenCalledTimes(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('reset 拋錯時不得中斷整個 loop（限流清不掉不該讓套件掛掉）', () => {
    vi.useFakeTimers()
    try {
      const reset = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('redis unreachable')
        })
        .mockImplementation(() => undefined)
      const stop = startAuthRateLimitResetLoop({ intervalMs: 1000, reset })

      expect(() => vi.advanceTimersByTime(2000)).not.toThrow()
      expect(reset).toHaveBeenCalledTimes(2)

      stop()
    } finally {
      vi.useRealTimers()
    }
  })
})
