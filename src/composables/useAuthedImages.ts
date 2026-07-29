import { nextTick, onUnmounted, watch, type Ref, type WatchSource } from 'vue'
import apiClient from '../api/apiClient'

/** 需要換成帶認證 blob 的檔案內容路徑前綴（後端一律回傳相對路徑，見 fileService 契約） */
const FILE_CONTENT_PREFIX = '/api/v1/files/'

export interface UseAuthedImagesOptions {
  /**
   * 是否啟用；預設一律啟用。
   * 回傳 false 時完全不介入（不掃描、不 fetch），並清空目前持有的 blob url。
   * 用於「已發布文章走匿名 302 本來就通，不需要這個機制」的情境。
   */
  enabled?: () => boolean
}

/**
 * useAuthedImages
 *
 * 背景：檔案權限上線後 GET /api/v1/files/{id}/content 走 canRead 授權矩陣。
 * 瀏覽器原生 <img> 請求不帶 Authorization header，未發布文章 / 編輯器草稿的圖片
 * 會被視為匿名而 403 破圖。
 *
 * 這個 composable 在容器內找出 src 以 /api/v1/files/ 開頭的 <img>，
 * 改用帶 auth 的 apiClient 以 blob 取回內容，createObjectURL 換掉 src。
 *
 * - 以 src 為 key 快取 blob url：同一輪掃描內同一個 src 只 fetch 一次；
 *   下一輪掃描若該 src 仍在使用中則直接複用，不重新 fetch。
 * - fetch 失敗（403/404/網路錯誤）時保留原 src，不掩蓋真正無權限的情況。
 * - 每輪掃描後，快取中不再被目前容器引用的 src 會被 revoke；元件卸載時
 *   剩餘快取全部 revoke，避免 blob url 記憶體洩漏。
 * - enabled() 回傳 false 時完全不介入（例如已發布文章走匿名 302 不需要）。
 */
export function useAuthedImages(
  containerRef: Ref<HTMLElement | null | undefined>,
  trigger: WatchSource<unknown>,
  options: UseAuthedImagesOptions = {},
) {
  const { enabled = () => true } = options

  /** src -> blob url，跨掃描輪次持續存在，用來去重與偵測「不再使用」的項目 */
  const cache = new Map<string, string>()
  let generation = 0

  function revokeAll() {
    cache.forEach((url) => URL.revokeObjectURL(url))
    cache.clear()
  }

  async function fetchBlobUrl(src: string): Promise<string | null> {
    try {
      const blob = await apiClient.get<unknown, Blob>(src, { responseType: 'blob' })
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }

  async function scan() {
    // watch 的 immediate 呼叫發生在 setup() 執行期間（DOM 尚未掛載），container ref 這時仍是 null。
    // 等一個 tick 確保 DOM 已更新完成，才讀取 containerRef.value（與 useInlineArticleHighlights 相同作法）。
    await nextTick()
    const myGeneration = ++generation

    if (!enabled()) {
      revokeAll()
      return
    }

    const container = containerRef.value
    if (!container) return

    const imgs = Array.from(
      container.querySelectorAll<HTMLImageElement>(`img[src^="${FILE_CONTENT_PREFIX}"]`),
    )

    // 依 src 分組：同一個 src 有多個 <img> 時只需 fetch 一次
    const bySrc = new Map<string, HTMLImageElement[]>()
    for (const img of imgs) {
      const src = img.getAttribute('src') ?? ''
      const group = bySrc.get(src)
      if (group) {
        group.push(img)
      } else {
        bySrc.set(src, [img])
      }
    }

    await Promise.all(
      Array.from(bySrc.entries()).map(async ([src, elements]) => {
        let blobUrl = cache.get(src)
        if (!blobUrl) {
          const fetched = await fetchBlobUrl(src)
          if (myGeneration !== generation) {
            // 這一輪已經過期（有更新的 scan 啟動了），拿到的 blob 若沒被採用就先 revoke 避免洩漏
            if (fetched) URL.revokeObjectURL(fetched)
            return
          }
          if (!fetched) return // 失敗：保留原 src，不建立 blob url
          blobUrl = fetched
          cache.set(src, blobUrl)
        }
        elements.forEach((el) => { el.src = blobUrl! })
      }),
    )

    if (myGeneration !== generation) return // 過期的 scan：不做 GC，避免誤刪新一輪仍在用的快取

    // GC：快取中不再被目前掃描到的任何 <img> 引用的 src 一律 revoke
    const currentSrcs = new Set(bySrc.keys())
    for (const [src, url] of cache) {
      if (!currentSrcs.has(src)) {
        URL.revokeObjectURL(url)
        cache.delete(src)
      }
    }
  }

  watch(trigger, () => { void scan() }, { immediate: true })

  onUnmounted(() => {
    revokeAll()
  })
}
