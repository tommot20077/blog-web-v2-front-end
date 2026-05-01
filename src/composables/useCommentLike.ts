import { ref, type Ref } from 'vue'
import { commentService } from '../api/commentService'
import { useAuthWall } from './useAuthWall'
import { useToast } from './useToast'

export function useCommentLike(
  commentUuid: Ref<string>,
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
    likeCount.value += liked.value ? 1 : -1
    try {
      if (liked.value) await commentService.like(commentUuid.value)
      else await commentService.unlike(commentUuid.value)
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
