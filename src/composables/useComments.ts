import { reactive, ref, watchEffect, type Ref } from 'vue'
import { commentService } from '../api/commentService'
import { useAuthWall } from './useAuthWall'
import { useToast } from './useToast'
import type { CommentItem } from '../types/comment'

/** 回覆分頁每頁筆數：第一次載入取代內嵌的前 3 則，之後 page 遞增；單一來源 */
const REPLY_PAGE_SIZE = 20

/** 單一頂層留言的「載入更多回覆」狀態 */
export interface ReplyState {
  /** 已載入的回覆頁數（0 = 仍是列表內嵌的前 3 則） */
  pagesLoaded: number
  isLoading: boolean
  error: boolean
}

function mergeByUuid(base: CommentItem[], incoming: CommentItem[]): CommentItem[] {
  const seen = new Set(base.map(r => r.uuid))
  return [...base, ...incoming.filter(r => !seen.has(r.uuid))]
}

export function useComments(articleUuid: Ref<string>) {
  const list = ref<CommentItem[]>([])
  const totalCommentCount = ref(0)
  const totalTopLevels = ref(0)
  const page = ref(1)
  const size = 20  // 單一來源，consumer 透過 return 取得
  const sort = ref<'newest' | 'oldest'>('newest')
  const isLoading = ref(false)
  const { requireAuth } = useAuthWall()
  const { showToast } = useToast()

  // 回覆分頁狀態（key = 頂層留言 uuid）。獨立於 list，重新載入列表時仍保留「已展開」的資訊
  const replyStates = reactive<Record<string, ReplyState>>({})
  // 回覆請求的 token：每個頂層留言各自遞增；列表被取代（listGeneration 改變）時一併讓舊請求失效
  const replyRequestIds: Record<string, number> = {}
  let listGeneration = 0

  // 遞增的 request token：只有最新一次請求可以寫 state（commentService 不支援 signal，故不用 abort）
  let latestRequestId = 0

  async function fetchPage(p = page.value) {
    // 先遞增 token 再判斷空值：uuid 變空時讓進行中的請求失效，並回到空狀態
    const requestId = ++latestRequestId
    if (!articleUuid.value) {
      resetReplyRequests()
      for (const key of Object.keys(replyStates)) delete replyStates[key]
      list.value = []
      totalTopLevels.value = 0
      totalCommentCount.value = 0
      page.value = 1
      isLoading.value = false
      return
    }
    isLoading.value = true
    try {
      const res = await commentService.list(articleUuid.value, p, size, sort.value)
      if (requestId !== latestRequestId) return
      const wasComplete = new Set(
        list.value.filter(c => !hasMoreReplies(c)).map(c => c.uuid),
      )
      resetReplyRequests()
      await restoreExpandedReplies(res.topLevels.records, wasComplete, requestId)
      if (requestId !== latestRequestId) return
      list.value = res.topLevels.records
      totalTopLevels.value = res.topLevels.total
      totalCommentCount.value = res.totalCommentCount
      page.value = p
    } catch {
      if (requestId !== latestRequestId) return
      // 失敗時保留前一頁狀態，避免 unhandled rejection（watchEffect / template 的 click handler 都不會 await）
      showToast('載入留言失敗，請稍後再試', 'error')
    } finally {
      if (requestId === latestRequestId) isLoading.value = false
    }
  }

  /** 讓所有進行中的回覆請求失效（列表即將被取代），並復原各自的載入／錯誤狀態 */
  function resetReplyRequests() {
    listGeneration++
    for (const [uuid, st] of Object.entries(replyStates)) {
      replyRequestIds[uuid] = (replyRequestIds[uuid] ?? 0) + 1
      st.isLoading = false
      st.error = false
    }
  }

  /** 還有未顯示的回覆：replyCount（未刪除總數）> 目前已帶的 replies 數 */
  function hasMoreReplies(comment: CommentItem): boolean {
    return (comment.replyCount ?? 0) > (comment.replies?.length ?? 0)
  }

  function getReplyState(parentUuid: string): ReplyState {
    return replyStates[parentUuid] ?? { pagesLoaded: 0, isLoading: false, error: false }
  }

  /**
   * 列表重新載入後（新增／編輯／刪除回覆），把使用者原本展開的頂層留言還原成展開狀態。
   * - 展開前已經全部載入：新回覆也要看得到 → 重取到 ceil(replyCount / 每頁) 頁
   * - 展開前只載入一部分：維持已載入的頁數，剩餘仍由「載入更多」處理
   * 失敗時退回內嵌的前 3 則並標示 error（使用者可點重試）。
   */
  async function restoreExpandedReplies(
    records: CommentItem[],
    wasComplete: Set<string>,
    requestId: number,
  ) {
    await Promise.all(records.map(async (record) => {
      const state = replyStates[record.uuid]
      if (!state || state.pagesLoaded === 0) return
      const total = record.replyCount ?? 0
      const embedded = record.replies?.length ?? 0
      if (total <= embedded) {
        state.pagesLoaded = 0
        return
      }
      const maxPages = Math.ceil(total / REPLY_PAGE_SIZE)
      const pages = wasComplete.has(record.uuid)
        ? maxPages
        : Math.min(state.pagesLoaded, maxPages)
      let merged: CommentItem[] = []
      try {
        let lastTotal = total
        for (let n = 1; n <= pages; n++) {
          const res = await commentService.listReplies(record.uuid, n, REPLY_PAGE_SIZE)
          if (requestId !== latestRequestId) return
          merged = mergeByUuid(merged, res.records)
          lastTotal = res.total
        }
        record.replies = merged
        record.replyCount = Math.max(lastTotal, merged.length)
        state.pagesLoaded = pages
      } catch {
        if (requestId !== latestRequestId) return
        state.pagesLoaded = 0
        state.error = true
      }
    }))
  }

  /**
   * 載入某頂層留言的下一批回覆。
   * 第一次（pagesLoaded = 0）以 page=1 取回並「取代」內嵌的前 3 則，之後 page 遞增並附加；
   * 以 uuid 去重，避免兩次請求之間資料位移造成重複。失敗時不推進頁碼，下一次點擊即重試。
   */
  async function loadMoreReplies(parentUuid: string): Promise<void> {
    const parent = list.value.find(c => c.uuid === parentUuid)
    if (!parent) return
    // 先寫入再讀回：`??=` 的值是原始物件，必須取 reactive proxy 才會觸發畫面更新
    replyStates[parentUuid] ??= { pagesLoaded: 0, isLoading: false, error: false }
    const state = replyStates[parentUuid]
    if (state.isLoading) return

    const nextPage = state.pagesLoaded + 1
    const requestId = (replyRequestIds[parentUuid] = (replyRequestIds[parentUuid] ?? 0) + 1)
    const generation = listGeneration
    const isStale = () => requestId !== replyRequestIds[parentUuid] || generation !== listGeneration

    state.isLoading = true
    state.error = false
    try {
      const res = await commentService.listReplies(parentUuid, nextPage, REPLY_PAGE_SIZE)
      if (isStale()) return
      const target = list.value.find(c => c.uuid === parentUuid)
      if (!target) return
      const merged = mergeByUuid(nextPage === 1 ? [] : (target.replies ?? []), res.records)
      target.replies = merged
      // 空頁代表沒有更多了（replyCount 可能因期間刪除而偏大）：以實際載入數為準，避免無限的載入更多
      target.replyCount = res.records.length === 0 ? merged.length : Math.max(res.total, merged.length)
      state.pagesLoaded = nextPage
    } catch {
      if (isStale()) return
      state.error = true
    } finally {
      if (!isStale()) state.isLoading = false
    }
  }

  async function post(content: string): Promise<boolean> {
    if (!requireAuth()) return false
    try {
      await commentService.create(articleUuid.value, { content })
      await fetchPage(1)
      showToast('留言已送出', 'success')
      return true
    } catch {
      showToast('留言失敗，請稍後再試', 'error')
      return false
    }
  }

  async function reply(parentUuid: string, content: string): Promise<boolean> {
    if (!requireAuth()) return false
    try {
      await commentService.create(articleUuid.value, { content, parentUuid })
      await fetchPage(page.value)
      showToast('回覆已送出', 'success')
      return true
    } catch {
      showToast('回覆失敗，請稍後再試', 'error')
      return false
    }
  }

  async function edit(uuid: string, content: string): Promise<boolean> {
    if (!requireAuth()) return false
    try {
      await commentService.edit(uuid, { content })
      await fetchPage(page.value)
      showToast('已更新', 'success')
      return true
    } catch {
      showToast('更新失敗', 'error')
      return false
    }
  }

  async function remove(uuid: string): Promise<boolean> {
    if (!requireAuth()) return false
    try {
      await commentService.delete(uuid)
      await fetchPage(page.value)
      showToast('留言已刪除', 'success')
      return true
    } catch {
      showToast('刪除失敗', 'error')
      return false
    }
  }

  watchEffect(() => {
    fetchPage(1)
  })

  return { list, totalCommentCount, totalTopLevels, page, size, sort, isLoading, fetchPage, loadMoreReplies, hasMoreReplies, getReplyState, post, reply, edit, remove }
}
