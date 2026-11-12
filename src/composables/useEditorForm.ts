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
  // 欄位修訂計數器：saveDraft 期間若又有修改，完成時不可清除 dirty
  let revision = 0
  const isSaving = ref(false)
  const isLoadingArticle = ref(!!uuid)
  const article = ref<EditorArticle | null>(null)
  // 樂觀鎖版本號（B2）：載入 / 存檔 / 狀態轉換成功後一律改用回應的新值，
  // 存檔時原樣帶回；後端比對不一致回 409（A0208）。新建文章在建立成功前為 null。
  const version = ref<number | null>(null)

  const currentUuid = ref(uuid)
  const isNew = computed(() => !currentUuid.value)

  // 監聽欄位變化，標記為 dirty
  // flush:'sync'：欄位一變就同步標記。若用預設的 pre flush，loadArticle() 填完欄位後
  // 立刻 isDirty=false，watcher 會在下一個 tick 又把它設回 true（載入既有文章就被判為未儲存）。
  watch([title, summary, coverImageUrl, categoryIds, tagNames], () => {
    revision++
    isDirty.value = true
  }, { flush: 'sync' })

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
      version.value = data.version
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
    const revisionAtSave = revision
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
        saved = await editorService.updateArticle(
          currentUuid.value!,
          version.value === null ? formData : { ...formData, version: version.value },
        )
      }

      currentUuid.value = saved.uuid
      article.value = saved
      version.value = saved.version
      // 只有儲存期間沒有新修改才清除 dirty
      if (revision === revisionAtSave) isDirty.value = false
      return saved
    } finally {
      isSaving.value = false
    }
  }

  async function submitForReview(): Promise<void> {
    const targetUuid = article.value?.uuid ?? currentUuid.value
    if (!targetUuid) return
    const result = await myArticlesService.submitForReview(targetUuid)
    // 狀態轉換也會遞增 version；回應沒帶時保留原值
    if (typeof result?.version === 'number') version.value = result.version
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
    version,
    loadArticle,
    saveDraft,
    submitForReview,
  }
}
