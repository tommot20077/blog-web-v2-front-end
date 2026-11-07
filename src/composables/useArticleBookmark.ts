import { ref, type Ref } from 'vue'
import { bookmarkService } from '../api/bookmarkService'
import { useAuthWall } from './useAuthWall'
import { useToast } from './useToast'
import { isRateLimited } from '../utils/apiErrors'

export function useArticleBookmark(
  articleUuid: Ref<string>,
  initial: { bookmarked: boolean },
) {
  const bookmarked = ref(initial.bookmarked)
  const isPending = ref(false)
  const { requireAuth } = useAuthWall()
  const { showToast } = useToast()

  async function toggle() {
    if (!requireAuth()) return
    if (isPending.value) return
    isPending.value = true
    const previous = bookmarked.value
    bookmarked.value = !bookmarked.value

    try {
      if (bookmarked.value) await bookmarkService.bookmark(articleUuid.value)
      else await bookmarkService.unbookmark(articleUuid.value)
    } catch (error) {
      bookmarked.value = previous
      // 429 已由 apiClient 的全域 toast 提示等待時間，不再疊自己的錯誤 toast
      if (!isRateLimited(error)) showToast('收藏失敗，請稍後再試', 'error')
    } finally {
      isPending.value = false
    }
  }

  return { bookmarked, isPending, toggle }
}
