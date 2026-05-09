import { ref, watchEffect, type Ref } from 'vue'
import { recommendService } from '../api/recommendService'
import type { RecommendArticleResponse } from '../api/real/recommendService'

export function useRelatedArticles(articleUuid: Ref<string>) {
  const articles = ref<RecommendArticleResponse[]>([])
  const isLoading = ref(false)

  async function fetch() {
    if (!articleUuid.value) return
    isLoading.value = true
    try {
      articles.value = await recommendService.getRelatedArticles(articleUuid.value)
    } catch {
      articles.value = []
    } finally {
      isLoading.value = false
    }
  }

  watchEffect(() => {
    if (articleUuid.value) fetch()
  })

  return { articles, isLoading }
}
