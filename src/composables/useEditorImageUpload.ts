import { fileService } from '../api/fileService'
import { useToast } from './useToast'

// 每次上傳配一個遞增序號，確保同名檔案同時上傳時佔位文字仍唯一，
// 避免取代時命中錯誤的佔位區塊。
let uploadSeq = 0

export interface EditorImageUploadIO {
  /** 於目前游標處插入文字（沿用 useMarkdownEditor 的 insertText 語意） */
  insertText: (text: string) => void
  /**
   * 局部取代文件中第一個相符的文字，游標留在取代後文字之後
   *（沿用 useMarkdownEditor 的 replaceRange 語意）；找不到時回傳 false。
   */
  replaceRange: (search: string, insert: string) => boolean
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : '請稍後再試'
}

export function useEditorImageUpload({ insertText, replaceRange }: EditorImageUploadIO) {
  const { showToast } = useToast()

  async function uploadOne(file: File): Promise<void> {
    const placeholder = `![上傳中...](pending:${Date.now()}-${++uploadSeq})`
    insertText(placeholder)

    try {
      const result = await fileService.uploadFile(file, 'ARTICLE_CONTENT')
      // 局部取代佔位文字，不整份覆寫：整份覆寫會把游標帶到文件最末，
      // 序列上傳時第 2 張以後的圖片就會插到文末而不是使用者的游標處。
      replaceRange(placeholder, `![${file.name}](${result.url})`)
    } catch (err) {
      replaceRange(placeholder, '')
      showToast('圖片上傳失敗：' + getErrorMessage(err), 'error')
    }
  }

  async function uploadImages(files: FileList | File[]): Promise<void> {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    // 依序處理（非 Promise.all），確保多檔案時插入順序與使用者選取/拖放順序一致，
    // 也避免多個上傳並行改寫文件時互相覆蓋造成內容遺失。
    for (const file of imageFiles) {
      await uploadOne(file)
    }
  }

  return { uploadImages }
}
