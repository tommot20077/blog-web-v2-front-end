import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import EditorToolbar from './EditorToolbar.vue'

describe('EditorToolbar', () => {
  // ── 渲染 ────────────────────────────────────────────────────────────────
  describe('渲染', () => {
    it('顯示標題按鈕 H1、H2、H3', () => {
      render(EditorToolbar)
      expect(screen.getByTitle('H1')).toBeInTheDocument()
      expect(screen.getByTitle('H2')).toBeInTheDocument()
      expect(screen.getByTitle('H3')).toBeInTheDocument()
    })

    it('顯示粗體、斜體按鈕', () => {
      render(EditorToolbar)
      expect(screen.getByTitle('粗體')).toBeInTheDocument()
      expect(screen.getByTitle('斜體')).toBeInTheDocument()
    })

    it('顯示程式碼區塊、引用按鈕', () => {
      render(EditorToolbar)
      expect(screen.getByTitle('程式碼區塊')).toBeInTheDocument()
      expect(screen.getByTitle('引用')).toBeInTheDocument()
    })

    it('顯示有序列表、無序列表按鈕', () => {
      render(EditorToolbar)
      expect(screen.getByTitle('有序列表')).toBeInTheDocument()
      expect(screen.getByTitle('無序列表')).toBeInTheDocument()
    })

    it('顯示連結、圖片按鈕', () => {
      render(EditorToolbar)
      expect(screen.getByTitle('連結')).toBeInTheDocument()
      expect(screen.getByTitle('圖片')).toBeInTheDocument()
    })

    it('顯示分隔線按鈕', () => {
      render(EditorToolbar)
      expect(screen.getByTitle('分隔線')).toBeInTheDocument()
    })

    it('顯示復原、重做按鈕', () => {
      render(EditorToolbar)
      expect(screen.getByTitle('復原')).toBeInTheDocument()
      expect(screen.getByTitle('重做')).toBeInTheDocument()
    })
  })

  // ── Emit：prefix-lines ──────────────────────────────────────────────────
  describe('emit prefix-lines', () => {
    it('點擊 H1 emit prefix-lines 並帶 "# "', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('H1'))
      expect(emitted()['prefix-lines']).toBeTruthy()
      expect(emitted()['prefix-lines'][0]).toEqual(['# '])
    })

    it('點擊 H2 emit prefix-lines 並帶 "## "', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('H2'))
      expect(emitted()['prefix-lines'][0]).toEqual(['## '])
    })

    it('點擊 H3 emit prefix-lines 並帶 "### "', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('H3'))
      expect(emitted()['prefix-lines'][0]).toEqual(['### '])
    })

    it('點擊有序列表 emit prefix-lines 並帶 "1. "', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('有序列表'))
      expect(emitted()['prefix-lines'][0]).toEqual(['1. '])
    })

    it('點擊無序列表 emit prefix-lines 並帶 "- "', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('無序列表'))
      expect(emitted()['prefix-lines'][0]).toEqual(['- '])
    })

    it('點擊引用 emit prefix-lines 並帶 "> "', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('引用'))
      expect(emitted()['prefix-lines'][0]).toEqual(['> '])
    })
  })

  // ── Emit：wrap-selection ────────────────────────────────────────────────
  describe('emit wrap-selection', () => {
    it('點擊粗體 emit wrap-selection 並帶 ["**", "**"]', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('粗體'))
      expect(emitted()['wrap-selection'][0]).toEqual(['**', '**'])
    })

    it('點擊斜體 emit wrap-selection 並帶 ["*", "*"]', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('斜體'))
      expect(emitted()['wrap-selection'][0]).toEqual(['*', '*'])
    })

    it('點擊刪除線 emit wrap-selection 並帶 ["~~", "~~"]', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('刪除線'))
      expect(emitted()['wrap-selection'][0]).toEqual(['~~', '~~'])
    })
  })

  // ── Emit：insert-text ───────────────────────────────────────────────────
  describe('emit insert-text', () => {
    it('點擊程式碼區塊 emit insert-text', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('程式碼區塊'))
      expect(emitted()['insert-text']).toBeTruthy()
      expect((emitted()['insert-text'][0] as string[])[0]).toContain('```')
    })

    it('點擊分隔線 emit insert-text 並帶 "\\n---\\n"', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('分隔線'))
      expect(emitted()['insert-text'][0]).toEqual(['\n---\n'])
    })

    it('點擊連結 emit insert-text 並帶連結模板', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('連結'))
      const text = (emitted()['insert-text'][0] as string[])[0]
      expect(text).toContain('[')
      expect(text).toContain('](')
    })

    it('點擊圖片 emit insert-text 並帶圖片模板', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('圖片'))
      const text = (emitted()['insert-text'][0] as string[])[0]
      expect(text).toContain('![')
      expect(text).toContain('](')
    })
  })

  // ── Emit：undo / redo ───────────────────────────────────────────────────
  describe('emit undo / redo', () => {
    it('點擊復原 emit "undo"', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('復原'))
      expect(emitted()['undo']).toBeTruthy()
    })

    it('點擊重做 emit "redo"', async () => {
      const user = userEvent.setup()
      const { emitted } = render(EditorToolbar)
      await user.click(screen.getByTitle('重做'))
      expect(emitted()['redo']).toBeTruthy()
    })
  })
})
