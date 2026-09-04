import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorMode } from './useEditorMode'

// Each test calls useEditorMode() directly after seeding localStorage.
// No module-level singleton — every call re-reads localStorage.blog.edMode.
describe('useEditorMode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('初始值（讀取 localStorage）', () => {
    it('localStorage 無值 → 預設 split', () => {
      const { mode } = useEditorMode()
      expect(mode.value).toBe('split')
    })

    it("localStorage = 'write' → mode 為 write", () => {
      localStorage.setItem('blog.edMode', 'write')
      const { mode } = useEditorMode()
      expect(mode.value).toBe('write')
    })

    it("localStorage = 'split' → mode 為 split", () => {
      localStorage.setItem('blog.edMode', 'split')
      const { mode } = useEditorMode()
      expect(mode.value).toBe('split')
    })

    it("localStorage = 'preview' → mode 為 preview", () => {
      localStorage.setItem('blog.edMode', 'preview')
      const { mode } = useEditorMode()
      expect(mode.value).toBe('preview')
    })

    it('localStorage 為非法值（garbage）→ 安全退回 split，不拋錯', () => {
      localStorage.setItem('blog.edMode', 'garbage')
      expect(() => useEditorMode()).not.toThrow()
      const { mode } = useEditorMode()
      expect(mode.value).toBe('split')
    })

    it('localStorage 為空字串 → 安全退回 split', () => {
      localStorage.setItem('blog.edMode', '')
      const { mode } = useEditorMode()
      expect(mode.value).toBe('split')
    })
  })

  describe('setMode（切換 + 寫入 localStorage）', () => {
    it("setMode('write') → mode.value 變為 write", () => {
      const { mode, setMode } = useEditorMode()
      setMode('write')
      expect(mode.value).toBe('write')
    })

    it("setMode('write') → 寫入 localStorage['blog.edMode'] = 'write'", () => {
      const { setMode } = useEditorMode()
      setMode('write')
      expect(localStorage.getItem('blog.edMode')).toBe('write')
    })

    it('連續切換 → localStorage 反映最後一次選擇', () => {
      const { setMode } = useEditorMode()
      setMode('preview')
      setMode('write')
      setMode('split')
      expect(localStorage.getItem('blog.edMode')).toBe('split')
    })
  })
})
