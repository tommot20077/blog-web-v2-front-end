import { describe, it, expect, afterEach, vi } from 'vitest'

const mockShowToast = vi.fn()

vi.mock('../../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

import { shareArticle } from './shareArticle'

const TEST_URL = 'https://90030.xyz/articles/test-uuid'

function stubNavigatorShare(impl?: (data: ShareData) => Promise<void>) {
  Object.defineProperty(navigator, 'share', {
    value: impl,
    configurable: true,
  })
}

function stubNavigatorClipboard(impl?: { writeText: (text: string) => Promise<void> }) {
  Object.defineProperty(navigator, 'clipboard', {
    value: impl,
    configurable: true,
  })
}

describe('shareArticle', () => {
  afterEach(() => {
    vi.clearAllMocks()
    delete (navigator as unknown as { share?: unknown }).share
    delete (navigator as unknown as { clipboard?: unknown }).clipboard
  })

  it('navigator.share 存在時被呼叫且帶正確 url，不退回 clipboard', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigatorShare(share)
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigatorClipboard({ writeText })

    await shareArticle(TEST_URL)

    expect(share).toHaveBeenCalledWith({ url: TEST_URL })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('navigator.share 不存在時走 clipboard fallback 並顯示成功 toast', async () => {
    stubNavigatorShare(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigatorClipboard({ writeText })

    await shareArticle(TEST_URL)

    expect(writeText).toHaveBeenCalledWith(TEST_URL)
    expect(mockShowToast).toHaveBeenCalledWith('連結已複製到剪貼簿', 'success')
  })

  it('navigator.share 被使用者取消（AbortError）時不顯示錯誤 toast', async () => {
    const abortError = new DOMException('The user aborted a request.', 'AbortError')
    stubNavigatorShare(vi.fn().mockRejectedValue(abortError))
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigatorClipboard({ writeText })

    await shareArticle(TEST_URL)

    expect(mockShowToast).not.toHaveBeenCalledWith(expect.any(String), 'error')
  })

  it('navigator.share 取消後退回 clipboard 且複製成功則顯示成功 toast', async () => {
    const abortError = new DOMException('The user aborted a request.', 'AbortError')
    stubNavigatorShare(vi.fn().mockRejectedValue(abortError))
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigatorClipboard({ writeText })

    await shareArticle(TEST_URL)

    expect(writeText).toHaveBeenCalledWith(TEST_URL)
    expect(mockShowToast).toHaveBeenCalledWith('連結已複製到剪貼簿', 'success')
  })

  it('clipboard 也失敗時顯示錯誤 toast', async () => {
    stubNavigatorShare(undefined)
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    stubNavigatorClipboard({ writeText })

    await shareArticle(TEST_URL)

    expect(mockShowToast).toHaveBeenCalledWith('分享失敗，請稍後再試', 'error')
  })

  it('navigator.share 以非取消原因失敗時，仍退回 clipboard fallback', async () => {
    stubNavigatorShare(vi.fn().mockRejectedValue(new Error('NotAllowedError')))
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigatorClipboard({ writeText })

    await shareArticle(TEST_URL)

    expect(writeText).toHaveBeenCalledWith(TEST_URL)
    expect(mockShowToast).toHaveBeenCalledWith('連結已複製到剪貼簿', 'success')
  })
})
