import { computed, type Ref } from 'vue'

// CJK Unicode 範圍（中日韓文字）
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g

/** 剝除 Markdown 語法，回傳純文字 */
function stripMarkdown(raw: string): string {
  return raw
    // 1. 剝除 code fences（``` ... ```）
    .replace(/```[\s\S]*?```/g, '')
    // 2. 剝除行內 code（`...`）
    .replace(/`[^`]*`/g, '')
    // 3. 剝除圖片（![alt](url)）— 必須在連結前處理
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // 4. 剝除連結 URL，保留顯示文字（[text](url) → text）
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // 5. 剝除 HTML 標籤
    .replace(/<[^>]*>/g, '')
    // 6. 剝除標題記號（# ## ### ...）
    .replace(/^#{1,6}\s+/gm, '')
    // 7. 只移除成對的 Markdown 強調標記，保留一般字元中的 _、~、*
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')   // ***bold italic***
    .replace(/\*\*([^*]+)\*\*/g, '$1')        // **bold**
    .replace(/__([^_]+)__/g, '$1')            // __bold__
    .replace(/~~([^~]+)~~/g, '$1')            // ~~strike~~
    .replace(/\*([^*\s][^*]*?)\*/g, '$1')    // *italic*
    .replace(/_([^_\s][^_]*?)_/g, '$1')      // _italic_
    // 8. 剝除引用記號（> ...）
    .replace(/^>\s*/gm, '')
    // 9. 剝除水平線（--- *** ___）
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // 10. 收縮多餘空白
    .replace(/\s+/g, ' ')
    .trim()
}

/** 計算 CJK 字元數 */
function countCjk(text: string): number {
  return (text.match(CJK_REGEX) ?? []).length
}

/** 計算英文單字數（排除 CJK 後按空白分割） */
function countEnglishWords(text: string): number {
  const withoutCjk = text.replace(CJK_REGEX, ' ')
  return withoutCjk
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}

/**
 * 計算文章字數與閱讀時間
 *
 * - 中文：500 字/分鐘
 * - 英文：200 字/分鐘
 * - 最少 1 分鐘
 */
export function useWordCount(markdownContent: Ref<string>) {
  const plainText = computed(() => stripMarkdown(markdownContent.value))

  const characterCount = computed(() => {
    // 可見字元數（排除空白）
    return plainText.value.replace(/\s/g, '').length
  })

  const wordCount = computed(() => {
    const text = plainText.value
    const cjk = countCjk(text)
    const eng = countEnglishWords(text)
    return cjk + eng
  })

  const readingTimeMinutes = computed(() => {
    const text = plainText.value
    const cjkTime = countCjk(text) / 500
    const engTime = countEnglishWords(text) / 200
    return Math.max(1, Math.ceil(cjkTime + engTime))
  })

  return {
    /** 總字數（中文按字元 + 英文按單字） */
    wordCount,
    /** 可見字元數（排除空白） */
    characterCount,
    /** 預估閱讀時間（分鐘，最少 1） */
    readingTimeMinutes,
  }
}
