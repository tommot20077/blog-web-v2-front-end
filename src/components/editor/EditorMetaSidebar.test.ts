import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import EditorMetaSidebar from './EditorMetaSidebar.vue'
import { fileService } from '../../api/fileService'
import { tagSuggestService } from '../../api/tagSuggestService'
import { createMockCategoryOption } from '../../test-utils/factories'

vi.mock('../../api/fileService')
vi.mock('../../api/tagSuggestService')

const defaultProps = {
  summary: '',
  coverImageUrl: null,
  categoryIds: [] as string[],
  tagNames: [] as string[],
  categories: [
    createMockCategoryOption({ id: 'cat-1', name: 'Vue', slug: 'vue' }),
    createMockCategoryOption({ id: 'cat-2', name: 'TypeScript', slug: 'typescript' }),
  ],
}

describe('EditorMetaSidebar', () => {
  // ── 渲染 ─────────────────────────────────────────────────────────────────
  describe('渲染', () => {
    it('顯示摘要 textarea', () => {
      render(EditorMetaSidebar, { props: defaultProps })
      expect(screen.getByPlaceholderText(/摘要/)).toBeInTheDocument()
    })

    it('顯示分類列表中的所有分類', () => {
      render(EditorMetaSidebar, { props: defaultProps })
      expect(screen.getByText('Vue')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
    })

    it('顯示標籤輸入欄位', () => {
      render(EditorMetaSidebar, { props: defaultProps })
      expect(screen.getByPlaceholderText(/標籤/)).toBeInTheDocument()
    })

    it('顯示封面圖上傳按鈕', () => {
      render(EditorMetaSidebar, { props: defaultProps })
      expect(screen.getByText(/上傳封面/)).toBeInTheDocument()
    })

    it('已選分類顯示勾選狀態', () => {
      render(EditorMetaSidebar, {
        props: { ...defaultProps, categoryIds: ['cat-1'] },
      })
      const checkbox = screen.getByRole('checkbox', { name: 'Vue' })
      expect(checkbox).toBeChecked()
    })

    it('已存在的標籤顯示為標籤徽章', () => {
      render(EditorMetaSidebar, {
        props: { ...defaultProps, tagNames: ['TypeScript', 'React'] },
      })
      // 使用不與分類重疊的標籤名稱
      expect(screen.getByTitle('移除 TypeScript')).toBeInTheDocument()
      expect(screen.getByTitle('移除 React')).toBeInTheDocument()
    })
  })

  // ── Emit：update:summary ─────────────────────────────────────────────────
  describe('emit update:summary', () => {
    it('輸入摘要後 emit update:summary', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorMetaSidebar, { props: defaultProps })
      const textarea = screen.getByPlaceholderText(/摘要/)
      await user.type(textarea, '新摘要')
      expect(emitted()['update:summary']).toBeTruthy()
    })
  })

  // ── Emit：update:categoryIds ─────────────────────────────────────────────
  describe('emit update:categoryIds', () => {
    it('勾選分類後 emit update:categoryIds 含該分類 id', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorMetaSidebar, { props: defaultProps })
      await user.click(screen.getByRole('checkbox', { name: 'Vue' }))
      const calls = emitted()['update:categoryIds'] as string[][]
      expect(calls).toBeTruthy()
      expect(calls[calls.length - 1][0]).toContain('cat-1')
    })

    it('取消勾選已選分類後 emit update:categoryIds 不含該 id', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorMetaSidebar, {
        props: { ...defaultProps, categoryIds: ['cat-1'] },
      })
      await user.click(screen.getByRole('checkbox', { name: 'Vue' }))
      const calls = emitted()['update:categoryIds'] as string[][]
      expect(calls[calls.length - 1][0]).not.toContain('cat-1')
    })
  })

  // ── Emit：update:tagNames ────────────────────────────────────────────────
  describe('emit update:tagNames', () => {
    it('按 Enter 新增標籤後 emit update:tagNames', async () => {
      const user = userEvent.setup()
      vi.mocked(tagSuggestService.suggestTags).mockResolvedValue([])
      const { emitted } = render(EditorMetaSidebar, { props: defaultProps })
      const input = screen.getByPlaceholderText(/標籤/)
      await user.type(input, 'NewTag{Enter}')
      const calls = emitted()['update:tagNames'] as string[][]
      expect(calls).toBeTruthy()
      expect(calls[calls.length - 1][0]).toContain('NewTag')
    })

    it('點擊標籤徽章的刪除按鈕後 emit update:tagNames 不含該標籤', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorMetaSidebar, {
        props: { ...defaultProps, tagNames: ['Vue'] },
      })
      const removeBtn = screen.getByTitle('移除 Vue')
      await user.click(removeBtn)
      const calls = emitted()['update:tagNames'] as string[][]
      expect(calls[calls.length - 1][0]).not.toContain('Vue')
    })
  })

  // ── onUnmounted 清除 ─────────────────────────────────────────────────────
  describe('onUnmounted', () => {
    it('元件卸載時呼叫 clearTimeout 以清除 debounce timer', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      vi.mocked(tagSuggestService.suggestTags).mockResolvedValue([])

      const user = userEvent.setup()
      const { unmount } = render(EditorMetaSidebar, { props: defaultProps })
      const input = screen.getByPlaceholderText(/標籤/)

      // 輸入觸發 debounce，設定 suggestTimer
      await user.type(input, 'V')

      clearTimeoutSpy.mockClear()

      // 卸載元件，預期 clearTimeout 被呼叫
      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })
  })

  // ── 封面圖上傳 ───────────────────────────────────────────────────────────
  describe('封面圖上傳', () => {
    it('上傳失敗時顯示錯誤訊息', async () => {
      vi.mocked(fileService.uploadFile).mockRejectedValue(new Error('網路錯誤'))

      const user = userEvent.setup()
      render(EditorMetaSidebar, { props: defaultProps })
      const file = new File(['img'], 'cover.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(/上傳失敗/)).toBeInTheDocument()
      })
    })

    it('上傳檔案後呼叫 fileService.uploadFile 並 emit update:coverImageUrl', async () => {
      const mockUrl = 'https://mock-cdn.example.com/cover.jpg'
      vi.mocked(fileService.uploadFile).mockResolvedValue({
        url: mockUrl,
        fileId: 'file-1',
        fileName: 'cover.jpg',
        fileSize: 1024,
      })

      const user = userEvent.setup()
      const { emitted } = render(EditorMetaSidebar, { props: defaultProps })
      const file = new File(['(⌐□_□)'], 'cover.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(input, file)

      await waitFor(() => {
        expect(fileService.uploadFile).toHaveBeenCalledWith(file, 'ARTICLE_COVER')
        expect(emitted()['update:coverImageUrl']).toBeTruthy()
        expect(emitted()['update:coverImageUrl'][0]).toEqual([mockUrl])
      })
    })
  })
})
