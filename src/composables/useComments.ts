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
  const size = 20
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

  watchEffect(() => {
    if (articleUuid.value) fetchPage(1)
  })

  return { list, totalCommentCount, totalTopLevels, page, sort, isLoading, fetchPage, post }
}
