import { onScopeDispose, watch, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

export const UNSAVED_CHANGES_MESSAGE = '你有尚未儲存的修改，確定要離開嗎？'

/**
 * 有未儲存修改時的離開保護（D5 / FE-02）：
 * - 站內切頁：onBeforeRouteLeave 以 window.confirm 詢問（專案既有的確認慣例），取消則留在原頁。
 * - 關閉分頁 / 重新整理：beforeunload 只在 hasUnsaved 為 true 期間註冊，變乾淨（存檔）或
 *   元件卸載時移除，避免乾淨狀態下也被瀏覽器提示。
 */
export function useUnsavedChangesGuard(hasUnsaved: Readonly<Ref<boolean>>): void {
  onBeforeRouteLeave(() => {
    if (!hasUnsaved.value) return true
    return window.confirm(UNSAVED_CHANGES_MESSAGE)
  })

  function onBeforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault()
    // 部分瀏覽器仍要求設定 returnValue 才會顯示提示
    event.returnValue = ''
  }

  watch(
    hasUnsaved,
    (unsaved) => {
      if (unsaved) window.addEventListener('beforeunload', onBeforeUnload)
      else window.removeEventListener('beforeunload', onBeforeUnload)
    },
    { immediate: true, flush: 'sync' },
  )

  onScopeDispose(() => window.removeEventListener('beforeunload', onBeforeUnload))
}
