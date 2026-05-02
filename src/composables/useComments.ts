import { ref, watchEffect, type Ref } from 'vue'
import { commentService } from '../api/commentService'
import { useAuthWall } from './useAuthWall'
import { useToast } from './useToast'
import type { CommentItem } from '../types/comment'

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

  async function fetchPage(p = page.value) {
    if (!articleUuid.value) return
    isLoading.value = true
    try {
      const res = await commentService.list(articleUuid.value, p, size, sort.value)
      list.value = res.topLevels.records
      totalTopLevels.value = res.topLevels.total
      totalCommentCount.value = res.totalCommentCount
      page.value = p
    } catch {
      // 失敗時保留前一頁狀態，避免 unhandled rejection（watchEffect / template 的 click handler 都不會 await）
      showToast('載入留言失敗，請稍後再試', 'error')
    } finally {
      isLoading.value = false
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
    if (articleUuid.value) fetchPage(1)
  })

  return { list, totalCommentCount, totalTopLevels, page, size, sort, isLoading, fetchPage, post, reply, edit, remove }
}
