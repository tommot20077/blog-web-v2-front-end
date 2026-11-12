import { ref, watchEffect, onScopeDispose, type Ref } from 'vue'
import { recommendService } from '../api/recommendService'
import type { RecommendArticleResponse } from '../api/real/recommendService'

export function useRelatedArticles(articleUuid: Ref<string>) {
  const articles = ref<RecommendArticleResponse[]>([])
  const isLoading = ref(false)

  // request token + disposed 旗標：只有最新請求且 scope 仍存活時才寫 state
  let latestRequestId = 0
  let disposed = false
  onScopeDispose(() => { disposed = true })

  async function fetch() {
    // 先遞增 token 再判斷空值：uuid 變空時讓進行中的請求失效，並回到空狀態
    const requestId = ++latestRequestId
    if (!articleUuid.value) {
      articles.value = []
      isLoading.value = false
      return
    }
    const isStale = () => disposed || requestId !== latestRequestId
    isLoading.value = true
    try {
      const res = await recommendService.getRelatedArticles(articleUuid.value)
      if (isStale()) return
      articles.value = res
    } catch {
      if (isStale()) return
      articles.value = []
    } finally {
      if (!isStale()) isLoading.value = false
    }
  }

  watchEffect(() => {
    fetch()
  })

  return { articles, isLoading }
}
