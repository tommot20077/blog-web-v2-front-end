import { computed, ref, watch, type Ref } from 'vue'
import {
  highlightService,
  type CreateHighlightRequest,
  type Highlight,
  type UpdateHighlightRequest,
} from '../api/highlightService'
import { useAuthStore } from '../stores/auth'
import { useAuthWall } from './useAuthWall'
import { useToast } from './useToast'

export function useArticleHighlights(articleUuid: Readonly<Ref<string>>) {
  const authStore = useAuthStore()
  const { requireAuth } = useAuthWall()
  const { showToast } = useToast()
  const highlights = ref<Highlight[]>([])
  const isLoading = ref(false)
  const isMutating = ref(false)
  const loadError = ref(false)
  let loadRequestId = 0

  const canLoad = computed(() => authStore.isAuthenticated && Boolean(articleUuid.value))

  async function loadHighlights(targetUuid = articleUuid.value) {
    if (!canLoad.value) return
    const requestId = ++loadRequestId
    isLoading.value = true
    loadError.value = false
    try {
      const records = await highlightService.list(targetUuid)
      if (requestId !== loadRequestId || articleUuid.value !== targetUuid || !canLoad.value) return
      highlights.value = records
    } catch (error) {
      if (requestId !== loadRequestId || articleUuid.value !== targetUuid || !canLoad.value) return
      console.error('Failed to load article highlights:', error)
      loadError.value = true
      highlights.value = []
    } finally {
      if (requestId === loadRequestId) isLoading.value = false
    }
  }

  async function createHighlight(request: CreateHighlightRequest) {
    if (isMutating.value) return null
    if (!requireAuth() || !articleUuid.value) return null
    const targetUuid = articleUuid.value
    isMutating.value = true
    try {
      const created = await highlightService.create(targetUuid, request)
      if (articleUuid.value !== targetUuid || !authStore.isAuthenticated) return null
      highlights.value = [...highlights.value, created]
      return created
    } catch (error) {
      console.error('Failed to create article highlight:', error)
      showToast('建立劃線失敗，請稍後再試', 'error')
      return null
    } finally {
      isMutating.value = false
    }
  }

  async function updateHighlight(uuid: string, request: UpdateHighlightRequest) {
    if (isMutating.value) return null
    if (!requireAuth()) return null
    const previous = highlights.value
    isMutating.value = true
    try {
      const updated = await highlightService.update(uuid, request)
      highlights.value = highlights.value.map((highlight) => highlight.uuid === uuid ? updated : highlight)
      return updated
    } catch (error) {
      highlights.value = [...previous]
      console.error('Failed to update article highlight:', error)
      showToast('更新劃線失敗，請稍後再試', 'error')
      return null
    } finally {
      isMutating.value = false
    }
  }

  async function deleteHighlight(uuid: string) {
    if (isMutating.value) return false
    if (!requireAuth()) return false
    isMutating.value = true
    try {
      await highlightService.delete(uuid)
      highlights.value = highlights.value.filter((highlight) => highlight.uuid !== uuid)
      return true
    } catch (error) {
      console.error('Failed to delete article highlight:', error)
      showToast('刪除劃線失敗，請稍後再試', 'error')
      return false
    } finally {
      isMutating.value = false
    }
  }

  watch([articleUuid, canLoad], ([uuid, can]) => {
    loadRequestId += 1
    if (can) {
      void loadHighlights(uuid)
    } else {
      highlights.value = []
      isLoading.value = false
      loadError.value = false
    }
  }, { immediate: true })

  return {
    highlights,
    isLoading,
    isMutating,
    loadError,
    loadHighlights,
    createHighlight,
    updateHighlight,
    deleteHighlight,
  }
}
