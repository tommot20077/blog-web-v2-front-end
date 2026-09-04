import { ref } from 'vue'
import { useEditorImageUpload } from './useEditorImageUpload'
import { fileService } from '../api/fileService'
import type { FileUploadResponse } from '../types/editor'

vi.mock('../api/fileService')

const mockShowToast = vi.fn()
vi.mock('./useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

function mockUploadResponse(overrides: Partial<FileUploadResponse> = {}): FileUploadResponse {
  return {
    id: 'file-1',
    url: 'https://cdn.example.com/a.png',
    width: 100,
    height: 100,
    size: 1024,
    usageType: 'ARTICLE_CONTENT',
    ...overrides,
  }
}

// 忠實模擬 CodeMirror 的游標語意，讓「插在游標處」與「整份覆寫」的差別在測試中看得出來：
//   insertText  = 插在游標處，游標移到插入內容之後
//   setContent  = 整份文件覆寫；CM6 會把 selection 映射到取代範圍尾端＝文件最末
//   replaceRange= 局部 range 取代，游標留在取代後文字之後
// 舊版假替身的 insertText 恆為 append，抹平了游標語意，才會讓多圖插入位置的 bug 溜過去。
function createFakeDoc(initial = '', cursor = initial.length) {
  const content = ref(initial)
  let cursorPos = cursor

  const insertText = vi.fn((text: string) => {
    content.value = content.value.slice(0, cursorPos) + text + content.value.slice(cursorPos)
    cursorPos += text.length
  })

  const setContent = vi.fn((text: string) => {
    content.value = text
    cursorPos = text.length
  })

  const replaceRange = vi.fn((search: string, insert: string) => {
    const from = content.value.indexOf(search)
    if (from === -1) return false
    content.value = content.value.slice(0, from) + insert + content.value.slice(from + search.length)
    cursorPos = from + insert.length
    return true
  })

  return { content, insertText, setContent, replaceRange, getContent: () => content.value }
}

function setup(initial = '', cursor = initial.length) {
  const doc = createFakeDoc(initial, cursor)
  const upload = useEditorImageUpload({
    insertText: doc.insertText,
    replaceRange: doc.replaceRange,
  })
  return { ...upload, ...doc }
}

describe('useEditorImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('上傳單一圖片成功後，佔位文字被替換為真實 markdown', async () => {
    vi.mocked(fileService.uploadFile).mockResolvedValue(
      mockUploadResponse({ url: 'https://cdn.example.com/a.png' }),
    )
    const { uploadImages, content } = setup()

    await uploadImages([new File(['a'], 'a.png', { type: 'image/png' })])

    expect(fileService.uploadFile).toHaveBeenCalledWith(expect.any(File), 'ARTICLE_CONTENT')
    expect(content.value).toBe('![a.png](https://cdn.example.com/a.png)')
  })

  it('上傳期間會先插入「上傳中」佔位文字', async () => {
    let resolveUpload: (v: FileUploadResponse) => void = () => {}
    vi.mocked(fileService.uploadFile).mockImplementation(
      () => new Promise((resolve) => { resolveUpload = resolve }),
    )
    const { uploadImages, content } = setup()

    const promise = uploadImages([new File(['a'], 'pending.png', { type: 'image/png' })])
    await Promise.resolve()

    expect(content.value).toContain('上傳中')

    resolveUpload(mockUploadResponse({ url: 'https://cdn.example.com/pending.png' }))
    await promise

    expect(content.value).toBe('![pending.png](https://cdn.example.com/pending.png)')
  })

  it('多檔依序上傳，插入順序符合輸入順序（非並行競態）', async () => {
    vi.mocked(fileService.uploadFile)
      .mockResolvedValueOnce(mockUploadResponse({ url: 'https://cdn.example.com/a.png' }))
      .mockResolvedValueOnce(mockUploadResponse({ url: 'https://cdn.example.com/b.png' }))
    const { uploadImages, content } = setup()

    await uploadImages([
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ])

    expect(fileService.uploadFile).toHaveBeenCalledTimes(2)
    expect(content.value.indexOf('a.png')).toBeLessThan(content.value.indexOf('b.png'))
  })

  it('在文章中段連續上傳多張圖片時，第 2 張以後仍插在前一張之後，不會跑到文末', async () => {
    vi.mocked(fileService.uploadFile)
      .mockResolvedValueOnce(mockUploadResponse({ url: 'https://cdn.example.com/a.png' }))
      .mockResolvedValueOnce(mockUploadResponse({ url: 'https://cdn.example.com/b.png' }))
    // 游標停在「前段」之後（第 2 個字元後），文件尾端還有「後段」
    const { uploadImages, content } = setup('前段\n\n後段', 2)

    await uploadImages([
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ])

    expect(content.value).toBe(
      '前段![a.png](https://cdn.example.com/a.png)![b.png](https://cdn.example.com/b.png)\n\n後段',
    )
  })

  it('上傳失敗時移除佔位文字（不留壞掉的 markdown）並顯示錯誤 toast', async () => {
    vi.mocked(fileService.uploadFile).mockRejectedValue(new Error('上傳逾時'))
    const { uploadImages, content } = setup()

    await uploadImages([new File(['a'], 'a.png', { type: 'image/png' })])

    expect(content.value).toBe('')
    expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('上傳逾時'), 'error')
  })

  it('非圖片檔案被忽略，不呼叫 uploadFile', async () => {
    const { uploadImages, content } = setup()

    await uploadImages([new File(['a'], 'a.pdf', { type: 'application/pdf' })])

    expect(fileService.uploadFile).not.toHaveBeenCalled()
    expect(content.value).toBe('')
  })

  it('混合圖片與非圖片檔案時，僅上傳圖片檔案', async () => {
    vi.mocked(fileService.uploadFile).mockResolvedValue(mockUploadResponse())
    const { uploadImages } = setup()

    await uploadImages([
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
    ])

    expect(fileService.uploadFile).toHaveBeenCalledTimes(1)
  })

  it('空檔案清單不觸發任何行為', async () => {
    const { uploadImages, insertText } = setup()

    await uploadImages([])

    expect(insertText).not.toHaveBeenCalled()
    expect(fileService.uploadFile).not.toHaveBeenCalled()
  })
})
