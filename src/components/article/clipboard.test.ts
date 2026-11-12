import { describe, it, expect, afterEach, vi } from 'vitest'
import { copyToClipboard } from './clipboard'

describe('copyToClipboard', () => {
  afterEach(() => {
    delete (navigator as unknown as { clipboard?: unknown }).clipboard
  })

  it('navigator.clipboard.writeText 成功時回傳 true 且帶入正確文字', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const result = await copyToClipboard('hello world')

    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello world')
  })

  it('navigator.clipboard.writeText 失敗時回傳 false（不拋出例外）', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const result = await copyToClipboard('hello world')

    expect(result).toBe(false)
  })

  it('navigator.clipboard 不存在時回傳 false（不拋出例外）', async () => {
    // happy-dom 內建了可用的 Clipboard API 實作於 prototype，
    // 單純 delete 自身屬性只會讓存取落回 prototype 的實作而非「不存在」，
    // 這裡明確 stub 成 undefined 以模擬不支援 Clipboard API 的環境（例如非 HTTPS）。
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })

    const result = await copyToClipboard('hello world')

    expect(result).toBe(false)
  })
})
