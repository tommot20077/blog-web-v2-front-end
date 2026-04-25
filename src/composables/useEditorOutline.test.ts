import { describe, it, expect } from 'vitest'
import { ref, shallowRef } from 'vue'
import { useEditorOutline } from './useEditorOutline'

describe('useEditorOutline', () => {
  describe('outline computed', () => {
    it('parses H1, H2, H3 headings', () => {
      const md = ref('# Title\n## Section\n### Sub\nsome text')
      const { outline } = useEditorOutline(md, shallowRef(null))
      expect(outline.value).toHaveLength(3)
      expect(outline.value[0]).toMatchObject({ level: 1, text: 'Title', lineIndex: 0 })
      expect(outline.value[1]).toMatchObject({ level: 2, text: 'Section', lineIndex: 1 })
      expect(outline.value[2]).toMatchObject({ level: 3, text: 'Sub', lineIndex: 2 })
    })

    it('ignores H4 and deeper', () => {
      const md = ref('#### Too deep\n# OK')
      const { outline } = useEditorOutline(md, shallowRef(null))
      expect(outline.value).toHaveLength(1)
      expect(outline.value[0].level).toBe(1)
    })

    it('strips asterisks and underscores and backticks from heading text', () => {
      const md = ref('## **Bold** and `code` and _italic_')
      const { outline } = useEditorOutline(md, shallowRef(null))
      expect(outline.value[0].text).toBe('Bold and code and italic')
    })

    it('returns empty array for markdown with no headings', () => {
      const md = ref('just text\nno headings here')
      const { outline } = useEditorOutline(md, shallowRef(null))
      expect(outline.value).toHaveLength(0)
    })
  })

  describe('updateCursorLine', () => {
    it('sets activeLineIndex to the nearest heading above cursor', () => {
      const md = ref('# H1\ntext\n## H2\nmore')
      const { activeLineIndex, updateCursorLine } = useEditorOutline(md, shallowRef(null))
      updateCursorLine(3) // cursor on line 3 (under H2 at line 2)
      expect(activeLineIndex.value).toBe(2)
    })

    it('sets activeLineIndex to -1 when cursor is above all headings', () => {
      const md = ref('text\n# H1')
      const { activeLineIndex, updateCursorLine } = useEditorOutline(md, shallowRef(null))
      updateCursorLine(0) // cursor before any heading
      expect(activeLineIndex.value).toBe(-1)
    })
  })
})
