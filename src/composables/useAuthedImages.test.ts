import { defineComponent, nextTick, ref, type Ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { useAuthedImages, type UseAuthedImagesOptions } from './useAuthedImages'
import apiClient from '../api/apiClient'

/**
 * useAuthedImages 測試
 *
 * 背景：未發布文章 / 編輯器草稿的圖片走 canRead 授權矩陣，瀏覽器原生 <img> 請求
 * 不帶 Authorization header 會被視為匿名而 403 破圖。這個 composable 在容器內找出
 * 走 /api/v1/files/ 的 <img>，改用帶 auth 的 apiClient 以 blob 取回內容並
 * createObjectURL 換掉 src。
 */

vi.mock('../api/apiClient', () => ({
  default: { get: vi.fn() },
}))

// ── URL.createObjectURL / revokeObjectURL：happy-dom 未完整支援，手動掛上 mock ──
let blobCounter = 0
const createObjectURLMock = vi.fn()
const revokeObjectURLMock = vi.fn()
;(globalThis.URL as unknown as { createObjectURL: typeof createObjectURLMock }).createObjectURL = createObjectURLMock
;(globalThis.URL as unknown as { revokeObjectURL: typeof revokeObjectURLMock }).revokeObjectURL = revokeObjectURLMock

beforeEach(() => {
  blobCounter = 0
  createObjectURLMock.mockReset()
  createObjectURLMock.mockImplementation(() => `blob:http://localhost/fake-${++blobCounter}`)
  revokeObjectURLMock.mockReset()
})

function mountHarness(initialHtml: string, options: UseAuthedImagesOptions = {}) {
  const trigger = ref(initialHtml)
  const containerRef: Ref<HTMLElement | null> = ref(null)

  const Harness = defineComponent({
    setup() {
      useAuthedImages(containerRef, trigger, options)
      return { trigger, containerRef }
    },
    template: '<div ref="containerRef" v-html="trigger"></div>',
  })

  const wrapper = mount(Harness)
  return { wrapper, trigger, containerRef }
}

describe('useAuthedImages', () => {
  // ── (a) 容器內有 /api/v1/files/ 開頭的 img → 換成 blob: src，且以帶 auth 的 apiClient 抓取 ──
  it('容器內有 /api/v1/files/ 開頭的 img 時，改用 apiClient 以 blob 抓取並換掉 src', async () => {
    const fakeBlob = new Blob(['fake-image-bytes'], { type: 'image/png' })
    vi.mocked(apiClient.get).mockResolvedValue(fakeBlob)

    const { containerRef } = mountHarness('<img src="/api/v1/files/f1/content" />')
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/files/f1/content', {
      responseType: 'blob',
      withCredentials: false,
    })
    const img = containerRef.value!.querySelector('img')!
    expect(img.getAttribute('src')).toBe('blob:http://localhost/fake-1')
  })

  // ── withCredentials 覆寫：MinIO presigned URL redirect 回 wildcard CORS，
  //    與全域 apiClient 的 withCredentials:true（credentials include）衝突會被瀏覽器擋下 ──
  it('fetch blob 時 per-request 覆寫 withCredentials:false，避免 redirect 到 MinIO presigned URL 時因 wildcard CORS + credentials 被瀏覽器擋下', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(new Blob(['x'], { type: 'image/png' }))

    mountHarness('<img src="/api/v1/files/f1/content" />')
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/files/f1/content',
      expect.objectContaining({ withCredentials: false }),
    )
  })

  // ── (b) 同一 src 兩張圖只抓一次 ──────────────────────────────────────────────
  it('同一個 src 的兩張圖片只呼叫一次 apiClient.get，兩張都換成同一個 blob src', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(new Blob(['x'], { type: 'image/png' }))

    const { containerRef } = mountHarness(
      '<img src="/api/v1/files/f1/content" /><img src="/api/v1/files/f1/content" />',
    )
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const imgs = containerRef.value!.querySelectorAll('img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0]!.getAttribute('src')).toBe('blob:http://localhost/fake-1')
    expect(imgs[1]!.getAttribute('src')).toBe('blob:http://localhost/fake-1')
  })

  // ── (c) fetch 403/失敗 → src 不變（不掩蓋真正無權限的情況）──────────────────────
  it('fetch 失敗（例如 403）時保留原本的 src，不建立 blob url', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Forbidden'))

    const { containerRef } = mountHarness('<img src="/api/v1/files/f1/content" />')
    await flushPromises()

    const img = containerRef.value!.querySelector('img')!
    expect(img.getAttribute('src')).toBe('/api/v1/files/f1/content')
    expect(createObjectURLMock).not.toHaveBeenCalled()
  })

  // ── (d) 重渲染 / 卸載 → revokeObjectURL 被呼叫，避免記憶體洩漏 ─────────────────
  it('內容重新渲染後圖片消失時 revoke 舊 blob url；卸載時 revoke 剩餘全部', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(new Blob(['x'], { type: 'image/png' }))

    const { wrapper, trigger, containerRef } = mountHarness('<img src="/api/v1/files/f1/content" />')
    await flushPromises()

    const firstBlobUrl = containerRef.value!.querySelector('img')!.getAttribute('src')!
    expect(firstBlobUrl).toBe('blob:http://localhost/fake-1')

    // 重新渲染：內容變成不再含任何 file-service 圖片
    trigger.value = '<p>no image anymore</p>'
    await nextTick()
    await flushPromises()

    expect(revokeObjectURLMock).toHaveBeenCalledWith(firstBlobUrl)

    // 換一張新圖片，確認卸載時仍會 revoke
    revokeObjectURLMock.mockClear()
    trigger.value = '<img src="/api/v1/files/f2/content" />'
    await nextTick()
    await flushPromises()

    const secondBlobUrl = containerRef.value!.querySelector('img')!.getAttribute('src')!
    expect(secondBlobUrl).toBe('blob:http://localhost/fake-2')

    wrapper.unmount()
    expect(revokeObjectURLMock).toHaveBeenCalledWith(secondBlobUrl)
  })

  // ── (e) enabled() 回傳 false → 完全不介入（已發布文章走匿名 302 不需要）────────
  it('enabled 回傳 false 時完全不介入，不呼叫 apiClient.get 也不改動 src', async () => {
    const { containerRef } = mountHarness('<img src="/api/v1/files/f1/content" />', { enabled: () => false })
    await flushPromises()

    expect(apiClient.get).not.toHaveBeenCalled()
    const img = containerRef.value!.querySelector('img')!
    expect(img.getAttribute('src')).toBe('/api/v1/files/f1/content')
  })

  // ── (f) 非 /api/v1/files/ 開頭的外部圖片 → 不處理 ─────────────────────────────
  it('非 /api/v1/files/ 開頭的外部圖片不受影響', async () => {
    const { containerRef } = mountHarness('<img src="https://cdn.example.com/pic.png" />')
    await flushPromises()

    expect(apiClient.get).not.toHaveBeenCalled()
    const img = containerRef.value!.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/pic.png')
  })
})
