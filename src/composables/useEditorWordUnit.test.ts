import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorWordUnit } from './useEditorWordUnit'

// Each test calls useEditorWordUnit() directly after seeding localStorage.
// No module-level singleton — every call re-reads localStorage['blog.settings.wordUnit'].
// Fallback semantics mirror useSettings.ts:63 (`|| 'characters'`): anything that
// isn't exactly 'words' resolves to 'characters'.
describe('useEditorWordUnit', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorage 無值 → 預設 characters', () => {
    const { wordUnit } = useEditorWordUnit()
    expect(wordUnit.value).toBe('characters')
  })

  it("localStorage = 'words' → wordUnit 為 words", () => {
    localStorage.setItem('blog.settings.wordUnit', 'words')
    const { wordUnit } = useEditorWordUnit()
    expect(wordUnit.value).toBe('words')
  })

  it("localStorage = 'characters' → wordUnit 為 characters", () => {
    localStorage.setItem('blog.settings.wordUnit', 'characters')
    const { wordUnit } = useEditorWordUnit()
    expect(wordUnit.value).toBe('characters')
  })

  it('localStorage 為非法值 → 安全退回 characters，不拋錯', () => {
    localStorage.setItem('blog.settings.wordUnit', 'garbage')
    expect(() => useEditorWordUnit()).not.toThrow()
    const { wordUnit } = useEditorWordUnit()
    expect(wordUnit.value).toBe('characters')
  })
})
