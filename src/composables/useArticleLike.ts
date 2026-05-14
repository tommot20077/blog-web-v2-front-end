import { ref, type Ref } from 'vue'
import { articleLikeService } from '../api/articleLikeService'
import { useAuthWall } from './useAuthWall'
import { useToast } from './useToast'

export function useArticleLike(
  articleUuid: Ref<string>,
  initial: { liked: boolean; likeCount: number },
) {
  const liked = ref(initial.liked)
  const likeCount = ref(initial.likeCount)
  const isPending = ref(false)
  const { requireAuth } = useAuthWall()
  const { showToast } = useToast()

  async function toggle() {
    if (!requireAuth()) return
    if (isPending.value) return
    isPending.value = true
    const prev = { liked: liked.value, count: likeCount.value }
    liked.value = !liked.value
    likeCount.value = Math.max(0, likeCount.value + (liked.value ? 1 : -1))
    try {
      if (liked.value) await articleLikeService.like(articleUuid.value)
      else await articleLikeService.unlike(articleUuid.value)
    } catch {
      liked.value = prev.liked
      likeCount.value = prev.count
      showToast('操作失敗，請稍後再試', 'error')
    } finally {
      isPending.value = false
    }
  }

  return { liked, likeCount, isPending, toggle }
}
