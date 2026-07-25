import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import EditorMetaSidebar from './EditorMetaSidebar.vue'
import { fileService } from '../../api/fileService'
import { tagSuggestService } from '../../api/tagSuggestService'
import { articleVersionService } from '../../api/real/articleVersionService'
import type { VersionSummaryResponse, VersionPageResponse } from '../../api/real/articleVersionService'
import { createMockCategoryOption } from '../../test-utils/factories'

vi.mock('../../api/fileService')
vi.mock('../../api/tagSuggestService')
vi.mock('../../api/real/articleVersionService')

const mockShowToast = vi.fn()
vi.mock('../../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const defaultProps = {
  summary: '',
  coverImageUrl: null,
  categoryIds: [] as string[],
  tagNames: [] as string[],
  categories: [
    createMockCategoryOption({ id: 'cat-1', name: 'Vue', slug: 'vue' }),
    createMockCategoryOption({ id: 'cat-2', name: 'TypeScript', slug: 'typescript' }),
  ],
  outline: [],
  activeHeadingLineIndex: -1,
  articleUuid: null as string | null,
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

    it('標籤建議不顯示未知數量的 0', async () => {
      vi.mocked(tagSuggestService.suggestTags).mockResolvedValue([
        { name: 'Vite', articleCount: 0 },
      ])

      const user = userEvent.setup()
      render(EditorMetaSidebar, { props: defaultProps })
      const input = screen.getByPlaceholderText(/標籤/)
      await user.type(input, 'Vi')

      await waitFor(() => {
        expect(screen.getByText('Vite')).toBeInTheDocument()
      })
      expect(screen.queryByText('0')).not.toBeInTheDocument()
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
        id: 'file-1',
        url: mockUrl,
        width: 800,
        height: 600,
        size: 1024,
        usageType: 'ARTICLE_COVER',
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

  // ── History tab ──────────────────────────────────────────────────────────
  describe('History tab', () => {
    const versionAuto: VersionSummaryResponse = {
      uuid: 'v-1',
      type: 'AUTO',
      createdAt: '2026-07-26T12:34:00Z',
      authorId: 1,
      contentLength: 1840,
      note: null,
    }
    const versionManual: VersionSummaryResponse = {
      uuid: 'v-2',
      type: 'MANUAL',
      createdAt: '2026-07-26T11:42:00Z',
      authorId: 1,
      contentLength: 736,
      note: '初稿',
    }
    const pageResponse: VersionPageResponse = {
      records: [versionAuto, versionManual],
      total: 2,
      current: 1,
      size: 20,
      pages: 1,
    }

    beforeEach(() => {
      vi.mocked(articleVersionService.list).mockReset()
      vi.mocked(articleVersionService.restore).mockReset()
      mockShowToast.mockClear()
    })

    it('顯示 History tab 按鈕', () => {
      render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })
      expect(screen.getByRole('button', { name: /History/ })).toBeInTheDocument()
    })

    it('初始渲染（未切到 History）不呼叫 list()', () => {
      render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })
      expect(articleVersionService.list).not.toHaveBeenCalled()
    })

    it('切換到 History tab 時呼叫 list(articleUuid)', async () => {
      vi.mocked(articleVersionService.list).mockResolvedValue(pageResponse)
      const user = userEvent.setup()
      render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })

      await user.click(screen.getByRole('button', { name: /History/ }))

      await waitFor(() => {
        expect(articleVersionService.list).toHaveBeenCalledWith('article-1', expect.anything())
      })
    })

    it('没有 articleUuid 時切到 History tab 不呼叫 list()，顯示提示文字', async () => {
      const user = userEvent.setup()
      render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: null } })

      await user.click(screen.getByRole('button', { name: /History/ }))

      expect(articleVersionService.list).not.toHaveBeenCalled()
      expect(screen.getByText(/儲存.*後|尚未儲存/)).toBeInTheDocument()
    })

    it('載入中顯示 loading 狀態', async () => {
      let resolveList: (value: VersionPageResponse) => void = () => {}
      vi.mocked(articleVersionService.list).mockImplementation(
        () => new Promise((resolve) => { resolveList = resolve }),
      )
      const user = userEvent.setup()
      render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })

      await user.click(screen.getByRole('button', { name: /History/ }))

      expect(screen.getByText(/載入中/)).toBeInTheDocument()
      resolveList(pageResponse)
    })

    it('版本清單渲染時間戳、Auto/Manual 標記、摘要與還原按鈕', async () => {
      vi.mocked(articleVersionService.list).mockResolvedValue(pageResponse)
      const user = userEvent.setup()
      render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })

      await user.click(screen.getByRole('button', { name: /History/ }))

      await waitFor(() => {
        expect(screen.getByText('Auto')).toBeInTheDocument()
        expect(screen.getByText('Manual')).toBeInTheDocument()
        expect(screen.getByText('初稿')).toBeInTheDocument()
      })
      expect(screen.getAllByRole('button', { name: /Restore/ })).toHaveLength(2)
    })

    it('清單為空時顯示空狀態提示', async () => {
      vi.mocked(articleVersionService.list).mockResolvedValue({
        records: [], total: 0, current: 1, size: 20, pages: 0,
      })
      const user = userEvent.setup()
      render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })

      await user.click(screen.getByRole('button', { name: /History/ }))

      await waitFor(() => {
        expect(screen.getByText(/尚無版本歷史/)).toBeInTheDocument()
      })
    })

    it('載入失敗顯示錯誤訊息與重試按鈕，點重試會重新呼叫 list()', async () => {
      vi.mocked(articleVersionService.list)
        .mockRejectedValueOnce(new Error('網路錯誤'))
        .mockResolvedValueOnce(pageResponse)
      const user = userEvent.setup()
      render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })

      await user.click(screen.getByRole('button', { name: /History/ }))

      await waitFor(() => {
        expect(screen.getByText(/網路錯誤/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /重試/ }))

      await waitFor(() => {
        expect(articleVersionService.list).toHaveBeenCalledTimes(2)
        expect(screen.getByText('Auto')).toBeInTheDocument()
      })
    })

    describe('還原流程', () => {
      afterEach(() => {
        vi.unstubAllGlobals()
      })

      it('點 Restore 先跳出確認框；取消則不呼叫 restore()', async () => {
        vi.mocked(articleVersionService.list).mockResolvedValue(pageResponse)
        const confirmMock = vi.fn().mockReturnValue(false)
        vi.stubGlobal('confirm', confirmMock)
        const user = userEvent.setup()
        render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })

        await user.click(screen.getByRole('button', { name: /History/ }))
        await waitFor(() => expect(screen.getAllByRole('button', { name: /Restore/ })).toHaveLength(2))

        await user.click(screen.getAllByRole('button', { name: /Restore/ })[0])

        expect(confirmMock).toHaveBeenCalled()
        expect(articleVersionService.restore).not.toHaveBeenCalled()
      })

      it('確認後呼叫 restore()，成功時 emit version-restored 並顯示成功 toast', async () => {
        vi.mocked(articleVersionService.list).mockResolvedValue(pageResponse)
        vi.mocked(articleVersionService.restore).mockResolvedValue(undefined)
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
        const user = userEvent.setup()
        const { emitted } = render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })

        await user.click(screen.getByRole('button', { name: /History/ }))
        await waitFor(() => expect(screen.getAllByRole('button', { name: /Restore/ })).toHaveLength(2))

        await user.click(screen.getAllByRole('button', { name: /Restore/ })[0])

        await waitFor(() => {
          expect(articleVersionService.restore).toHaveBeenCalledWith('article-1', 'v-1')
          expect(emitted()['version-restored']).toBeTruthy()
          expect(emitted()['version-restored'][0]).toEqual([versionAuto])
          expect(mockShowToast).toHaveBeenCalledWith(expect.stringMatching(/還原/), 'success')
        })
      })

      it('restore() 失敗時顯示錯誤 toast，不 emit version-restored', async () => {
        vi.mocked(articleVersionService.list).mockResolvedValue(pageResponse)
        vi.mocked(articleVersionService.restore).mockRejectedValue(new Error('伺服器錯誤'))
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
        const user = userEvent.setup()
        const { emitted } = render(EditorMetaSidebar, { props: { ...defaultProps, articleUuid: 'article-1' } })

        await user.click(screen.getByRole('button', { name: /History/ }))
        await waitFor(() => expect(screen.getAllByRole('button', { name: /Restore/ })).toHaveLength(2))

        await user.click(screen.getAllByRole('button', { name: /Restore/ })[0])

        await waitFor(() => {
          expect(articleVersionService.restore).toHaveBeenCalled()
          expect(mockShowToast).toHaveBeenCalledWith(expect.stringMatching(/還原失敗/), 'error')
        })
        expect(emitted()['version-restored']).toBeFalsy()
      })
    })
  })
})
