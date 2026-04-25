import { ref, computed, type Ref, type ShallowRef } from 'vue'
import type { EditorView } from '@codemirror/view'

export interface OutlineItem {
  level: 1 | 2 | 3
  text: string
  lineIndex: number  // 0-indexed
}

export function useEditorOutline(
  markdownContent: Ref<string>,
  editorView: ShallowRef<EditorView | null>
) {
  const activeLineIndex = ref(-1)

  const outline = computed<OutlineItem[]>(() => {
    return markdownContent.value
      .split('\n')
      .map((line, idx) => {
        const match = line.match(/^(#{1,3})\s+(.+)/)
        if (!match) return null
        return {
          level: match[1].length as 1 | 2 | 3,
          text: match[2].replace(/[*_`~]+/g, '').trim(),
          lineIndex: idx,
        }
      })
      .filter((h): h is OutlineItem => h !== null)
  })

  function updateCursorLine(lineIndex: number) {
    const above = outline.value.filter(h => h.lineIndex <= lineIndex)
    activeLineIndex.value = above.length > 0 ? above[above.length - 1].lineIndex : -1
  }

  function jumpToLine(lineIndex: number) {
    const view = editorView.value
    if (!view) return
    // 直接從 CM editor state 取得正確位置，避免字串計算與實際文件偏移
    const line = view.state.doc.line(lineIndex + 1)
    view.dispatch({
      selection: { anchor: line.from, head: line.to },
      scrollIntoView: true,
    })
    view.focus()
    activeLineIndex.value = lineIndex
  }

  return { outline, activeLineIndex, updateCursorLine, jumpToLine }
}
