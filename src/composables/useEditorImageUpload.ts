import { fileService } from '../api/fileService'
import { useToast } from './useToast'

// 每次上傳配一個遞增序號，確保同名檔案同時上傳時佔位文字仍唯一，
// 避免 string.replace() 命中錯誤的佔位區塊。
let uploadSeq = 0

export interface EditorImageUploadIO {
  /** 於目前游標處插入文字（沿用 useMarkdownEditor 的 insertText 語意） */
  insertText: (text: string) => void
  /** 讀取目前完整文件內容 */
  getContent: () => string
  /** 覆寫目前完整文件內容（沿用 useMarkdownEditor 的 setContent 語意） */
  setContent: (content: string) => void
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : '請稍後再試'
}

export function useEditorImageUpload({ insertText, getContent, setContent }: EditorImageUploadIO) {
  const { showToast } = useToast()

  async function uploadOne(file: File): Promise<void> {
    const placeholder = `![上傳中...](pending:${Date.now()}-${++uploadSeq})`
    insertText(placeholder)

    try {
      const result = await fileService.uploadFile(file, 'ARTICLE_CONTENT')
      const markdown = `![${file.name}](${result.url})`
      const content = getContent()
      if (content.includes(placeholder)) {
        setContent(content.replace(placeholder, markdown))
      }
    } catch (err) {
      const content = getContent()
      if (content.includes(placeholder)) {
        setContent(content.replace(placeholder, ''))
      }
      showToast('圖片上傳失敗：' + getErrorMessage(err), 'error')
    }
  }

  async function uploadImages(files: FileList | File[]): Promise<void> {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    // 依序處理（非 Promise.all），確保多檔案時插入順序與使用者選取/拖放順序一致，
    // 也避免多個 setContent() 並行覆寫彼此造成內容遺失。
    for (const file of imageFiles) {
      await uploadOne(file)
    }
  }

  return { uploadImages }
}
