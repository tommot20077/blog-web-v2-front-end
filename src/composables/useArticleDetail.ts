import { ref, onMounted } from 'vue'
import { articleService, type ArticleDetailItem } from '../api/articleService'

export function useArticleDetail(uuid: string) {
  const article = ref<ArticleDetailItem | null>(null)
  const isLoading = ref(true)

  async function fetchArticle() {
    isLoading.value = true
    try {
      article.value = await articleService.getArticleByUuid(uuid)
    } catch (error) {
      console.error('Error loading article details', error)
      article.value = null
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchArticle)

  return { article, isLoading, fetchArticle }
}
