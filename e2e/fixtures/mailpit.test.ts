import { describe, expect, it, vi } from 'vitest'
import { extractVerificationToken, fetchVerificationTokenFromMail } from './mailpit'

const json = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body })

describe('extractVerificationToken', () => {
  it('從信件內文的 /verify-email?token=... 連結取出 token', () => {
    const text = 'Hi,\nPlease verify:\nhttp://localhost:5500/verify-email?token=abc_DEF-123.x\n\nOr enter code'
    expect(extractVerificationToken(text)).toBe('abc_DEF-123.x')
  })

  it('token 經 URL 編碼時會解碼', () => {
    expect(extractVerificationToken('https://x/verify-email?token=a%2Bb%3D')).toBe('a+b=')
  })

  it('不會誤取密碼重設信的 token', () => {
    expect(extractVerificationToken('https://x/reset-password?token=zzz')).toBeNull()
  })
})

describe('fetchVerificationTokenFromMail', () => {
  const base = { baseUrl: 'http://mail:8025', intervalMs: 1, sleep: async () => undefined }

  it('搜尋收件人後讀信，回傳驗證 token', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ messages: [{ ID: 'm1' }] }))
      .mockResolvedValueOnce(json({ Text: 'link: http://f/verify-email?token=tok123', HTML: '' }))

    const token = await fetchVerificationTokenFromMail('new@test.local', { ...base, fetchImpl: fetchImpl as typeof fetch })

    expect(token).toBe('tok123')
    const searchUrl = String(fetchImpl.mock.calls[0]?.[0])
    expect(searchUrl).toContain('http://mail:8025/api/v1/search?query=')
    expect(decodeURIComponent(searchUrl)).toContain('to:"new@test.local"')
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe('http://mail:8025/api/v1/message/m1')
  })

  it('信還沒到就持續輪詢，到了才回傳', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ messages: [] }))
      .mockResolvedValueOnce(json({ messages: [] }))
      .mockResolvedValueOnce(json({ messages: [{ ID: 'm2' }] }))
      .mockResolvedValueOnce(json({ Text: 'http://f/verify-email?token=late', HTML: '' }))

    const token = await fetchVerificationTokenFromMail('a@test.local', { ...base, fetchImpl: fetchImpl as typeof fetch })

    expect(token).toBe('late')
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('只有 HTML 內文時也能取到 token', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ messages: [{ ID: 'm3' }] }))
      .mockResolvedValueOnce(json({ Text: '', HTML: '<a href="http://f/verify-email?token=htmltok">go</a>' }))

    await expect(
      fetchVerificationTokenFromMail('h@test.local', { ...base, fetchImpl: fetchImpl as typeof fetch }),
    ).resolves.toBe('htmltok')
  })

  it('逾時拋出清楚的錯誤（含 email、mailpit 位址與逾時秒數），不回空字串', async () => {
    let now = 0
    const fetchImpl = vi.fn().mockResolvedValue(json({ messages: [] }))

    await expect(
      fetchVerificationTokenFromMail('none@test.local', {
        ...base,
        timeoutMs: 100,
        now: () => now,
        sleep: async (ms: number) => {
          now += ms + 50
        },
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow(/none@test\.local.*http:\/\/mail:8025.*0\.1/s)
  })

  it('mailpit 連不上時，逾時錯誤要帶最後一次的連線錯誤原因', async () => {
    let now = 0
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(
      fetchVerificationTokenFromMail('x@test.local', {
        ...base,
        timeoutMs: 100,
        now: () => now,
        sleep: async (ms: number) => {
          now += ms + 50
        },
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow(/ECONNREFUSED/)
  })
})
