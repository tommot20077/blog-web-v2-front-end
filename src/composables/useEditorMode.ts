import { ref } from 'vue'

export type EditorMode = 'write' | 'split' | 'preview'

const STORAGE_KEY = 'blog.edMode'
const VALID_MODES: readonly EditorMode[] = ['write', 'split', 'preview']

function isValidMode(value: string | null): value is EditorMode {
  return VALID_MODES.includes(value as EditorMode)
}

function readStoredMode(): EditorMode {
  const raw = localStorage.getItem(STORAGE_KEY)
  return isValidMode(raw) ? raw : 'split'
}

/**
 * 編輯器版面模式（Write / Split / Preview），對應設計稿的三段式切換與
 * localStorage key `blog.edMode`。與 useSettings.ts 的 editorMode 共用同一把
 * key：設定頁改的是「預設值」，這裡在編輯器掛載時讀取、切換時立即寫回。
 * 非法值（含空字串）一律安全退回 'split'。
 */
export function useEditorMode() {
  const mode = ref<EditorMode>(readStoredMode())

  function setMode(next: EditorMode) {
    mode.value = next
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { mode, setMode }
}
