import { ref } from 'vue'

export type WordUnit = 'characters' | 'words'

const STORAGE_KEY = 'blog.settings.wordUnit'

function readStoredWordUnit(): WordUnit {
  return localStorage.getItem(STORAGE_KEY) === 'words' ? 'words' : 'characters'
}

/**
 * 字數計算單位設定（characters / words），對應 localStorage key
 * `blog.settings.wordUnit`（與 useSettings.ts:63 的預設值語意一致：
 * 非 'words' 的任何值一律視為 'characters'）。唯讀 — 由 Settings 頁寫入，
 * 編輯器只在掛載時讀取一次。
 */
export function useEditorWordUnit() {
  const wordUnit = ref<WordUnit>(readStoredWordUnit())
  return { wordUnit }
}
