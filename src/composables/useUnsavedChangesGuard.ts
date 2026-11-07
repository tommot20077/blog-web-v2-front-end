import { onScopeDispose, watch, type Ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, type RouteLocationNormalized } from 'vue-router'

export const UNSAVED_CHANGES_MESSAGE = '你有尚未儲存的修改，確定要離開嗎？'

export type UnsavedChangesGuardOptions = {
  /**
   * 回傳 true 的導頁直接放行、不跳確認。用於「系統觸發」的導頁，
   * 例如 session 已失效時導向登入頁——此時使用者按取消只會卡在已失效的 session 裡。
   */
  skipFor?: (to: RouteLocationNormalized) => boolean
}

/**
 * 有未儲存修改時的離開保護（D5 / FE-02）：
 * - 站內切頁：onBeforeRouteLeave 以 window.confirm 詢問（專案既有的確認慣例），取消則留在原頁。
 * - 關閉分頁 / 重新整理：beforeunload 只在 hasUnsaved 為 true 期間註冊，變乾淨（存檔）或
 *   元件卸載時移除，避免乾淨狀態下也被瀏覽器提示。
 */
export function useUnsavedChangesGuard(
  hasUnsaved: Readonly<Ref<boolean>>,
  options: UnsavedChangesGuardOptions = {},
): void {
  function confirmLeave(to: RouteLocationNormalized): boolean {
    if (!hasUnsaved.value) return true
    if (options.skipFor?.(to)) return true
    return window.confirm(UNSAVED_CHANGES_MESSAGE)
  }

  onBeforeRouteLeave((to) => confirmLeave(to))
  onBeforeRouteUpdate((to, from) => (to.path === from.path ? true : confirmLeave(to)))

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
