import { describe, expect, it, vi } from 'vitest'
import { startAuthRateLimitResetLoop, waitForBackendReadiness } from './global-setup'

describe('global-setup backend readiness', () => {
  const READYZ = 'http://localhost:9010/readyz'
  const LEGACY = 'http://localhost:9010/actuator/health/readiness'
  const signalOf = () => expect.objectContaining({ signal: expect.any(AbortSignal) })
  const wait = (fetchMock: ReturnType<typeof vi.fn>, retries = 2) =>
    waitForBackendReadiness({
      backendBase: 'http://localhost:9010',
      fetchImpl: fetchMock as typeof fetch,
      sleep: async () => undefined,
      retries,
      delayMs: 1,
    })

  it('新後端：先試 /readyz，成功就不再打舊路徑', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{"status":"UP"}' })

    await expect(wait(fetchMock)).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(READYZ, signalOf())
  })

  it('舊後端：/readyz 失敗後退回 /actuator/health/readiness，任一 2xx 即就緒', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"status":"UP"}' })

    await expect(wait(fetchMock)).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenNthCalledWith(1, READYZ, signalOf())
    expect(fetchMock).toHaveBeenNthCalledWith(2, LEGACY, signalOf())
  })

  it('backend 啟動中的失敗會重試（每輪都先試 /readyz 再試舊路徑）直到成功', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '{"status":"DOWN"}' })
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '{"status":"DOWN"}' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"status":"UP"}' })

    await expect(wait(fetchMock)).resolves.toBeUndefined()

    expect(fetchMock.mock.calls.map(c => c[0])).toEqual([READYZ, LEGACY, READYZ])
  })

  it('重試用盡後，錯誤訊息應同時指向兩個 readiness endpoint', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'))

    const error = await wait(fetchMock).catch((e: Error) => e)

    expect((error as Error).message).toContain(READYZ)
    expect((error as Error).message).toContain(LEGACY)
  })

  it('重試用盡後，應保留 readiness 的 HTTP status 與 body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 503, text: async () => '{"status":"DOWN"}' })

    await expect(wait(fetchMock)).rejects.toThrow('status 503 {"status":"DOWN"}')
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

    // 一輪兩條路徑，各自有 timeout signal，且都已逾時中止
    expect(signals).toHaveLength(2)
    expect(signals.every(s => s.aborted)).toBe(true)
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
