import { ref, computed, watch } from 'vue'
import { editorService } from '../api/editorService'
import { myArticlesService } from '../api/myArticlesService'
import type { EditorArticle } from '../types/editor'

export function useEditorForm(uuid?: string) {
  const title = ref('')
  const summary = ref('')
  const coverImageUrl = ref<string | null>(null)
  const categoryIds = ref<string[]>([])
  const tagNames = ref<string[]>([])
  const isDirty = ref(false)
  const isSaving = ref(false)
  const isLoadingArticle = ref(!!uuid)
  const article = ref<EditorArticle | null>(null)

  const currentUuid = ref(uuid)
  const isNew = computed(() => !currentUuid.value)

  // 監聽欄位變化，標記為 dirty
  watch([title, summary, coverImageUrl, categoryIds, tagNames], () => {
    isDirty.value = true
  })

  /**
   * 依 currentUuid 取回文章並填入表單欄位。
   *
   * 回傳載入到的文章；取不到時回傳 null 並保留現有欄位不動
   *（real service 失敗會吞例外回 null，呼叫端只能靠回傳值分辨成功與失敗）。
   */
  async function loadArticle(): Promise<EditorArticle | null> {
    if (!currentUuid.value) return null
    isLoadingArticle.value = true
    try {
      const data = await editorService.getArticleForEdit(currentUuid.value)
      if (!data) return null
      article.value = data
      title.value = data.title
      summary.value = data.summary
      coverImageUrl.value = data.coverImageUrl
      categoryIds.value = data.categories.map(c => c.id)
      tagNames.value = [...data.tags]
      isDirty.value = false
      return data
    } finally {
      isLoadingArticle.value = false
    }
  }

  async function saveDraft(content: string): Promise<EditorArticle | null> {
    isSaving.value = true
    try {
      const formData = {
        title: title.value,
        summary: summary.value,
        content,
        coverImageUrl: coverImageUrl.value,
        categoryIds: categoryIds.value,
        tagNames: tagNames.value,
      }

      let saved: EditorArticle
      if (isNew.value) {
        saved = await editorService.createArticle(formData)
      } else {
        saved = await editorService.updateArticle(currentUuid.value!, formData)
      }

      currentUuid.value = saved.uuid
      article.value = saved
      isDirty.value = false
      return saved
    } finally {
      isSaving.value = false
    }
  }

  async function submitForReview(): Promise<void> {
    const targetUuid = article.value?.uuid ?? currentUuid.value
    if (!targetUuid) return
    await myArticlesService.submitForReview(targetUuid)
  }

  return {
    title,
    summary,
    coverImageUrl,
    categoryIds,
    tagNames,
    isNew,
    isDirty,
    isSaving,
    isLoadingArticle,
    article,
    loadArticle,
    saveDraft,
    submitForReview,
  }
}
