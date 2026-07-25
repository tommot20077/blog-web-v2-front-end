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

// 以一個可讀寫的 ref 模擬 CodeMirror 文件內容，insertText 模擬「插入於游標（此處末端）」、
// setContent 模擬「整份文件覆寫」——與 useMarkdownEditor 的實際語意一致。
function setup(initial = '') {
  const content = ref(initial)
  const insertText = vi.fn((text: string) => { content.value += text })
  const setContent = vi.fn((text: string) => { content.value = text })
  const upload = useEditorImageUpload({
    insertText,
    getContent: () => content.value,
    setContent,
  })
  return { ...upload, content, insertText, setContent }
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
