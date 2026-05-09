import { ref, type Ref } from 'vue'
import { tagService } from '../api/tagService'
import { useAuthWall } from './useAuthWall'
import { useToast } from './useToast'

export function useTagFollow(
  tagId: Ref<string>,
  initial: { followed: boolean },
) {
  const followed = ref(initial.followed)
  const isPending = ref(false)
  const { requireAuth } = useAuthWall()
  const { showToast } = useToast()

  async function toggle() {
    if (!requireAuth()) return
    if (isPending.value) return
    isPending.value = true
    const prev = followed.value
    followed.value = !followed.value
    try {
      if (followed.value) await tagService.followTag(tagId.value)
      else await tagService.unfollowTag(tagId.value)
    } catch {
      followed.value = prev
      showToast('操作失敗，請稍後再試', 'error')
    } finally {
      isPending.value = false
    }
  }

  return { followed, isPending, toggle }
}
