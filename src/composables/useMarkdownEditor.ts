import { ref, shallowRef, watchEffect, onUnmounted, type ShallowRef } from 'vue'
import { EditorView, lineNumbers, highlightActiveLine, keymap as cmKeymap } from '@codemirror/view'
import { EditorState, type Extension } from '@codemirror/state'
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { syntaxHighlighting, indentOnInput } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { classHighlighter } from '@lezer/highlight'

export function useMarkdownEditor(containerRef: ShallowRef<HTMLElement | null>) {
  const editorView = shallowRef<EditorView | null>(null)
  const markdownContent = ref('')

  watchEffect(() => {
    const el = containerRef.value
    if (!el || editorView.value) return

    // Content sync extension（updateListener 在 mock 環境下為 undefined，安全跳過）
    const contentSyncExt = (EditorView as unknown as Record<string, { of: (fn: unknown) => unknown }>)
      .updateListener
      ?.of((update: { docChanged: boolean; state: { doc: { toString(): string } } }) => {
        if (update.docChanged) {
          markdownContent.value = update.state.doc.toString()
        }
      })

    const extensions: Extension[] = [
      history(),
      markdown({ codeLanguages: languages }),
      syntaxHighlighting(classHighlighter),
      lineNumbers(),
      highlightActiveLine(),
      EditorView.lineWrapping,
      indentOnInput(),
      ...(cmKeymap ? [cmKeymap.of([...defaultKeymap, ...historyKeymap, indentWithTab])] : [] as Extension[]),
      ...(contentSyncExt ? [contentSyncExt as Extension] : [] as Extension[]),
    ]

    const state = EditorState.create({
      doc: markdownContent.value,
      extensions,
    })

    editorView.value = new EditorView({ state, parent: el })
  }, { flush: 'sync' })

  onUnmounted(() => {
    editorView.value?.destroy()
    editorView.value = null
  })

  function wrapSelection(before: string, after: string): void {
    const view = editorView.value
    if (!view) return
    const { from, to } = view.state.selection.main
    const selectedText = view.state.doc.toString().slice(from, to)
    view.dispatch({
      changes: { from, to, insert: before + selectedText + after },
      selection: { anchor: from + before.length, head: to + before.length },
    })
  }

  function insertText(text: string): void {
    const view = editorView.value
    if (!view) return
    const { from } = view.state.selection.main
    view.dispatch({
      changes: { from, insert: text },
      selection: { anchor: from + text.length },
    })
  }

  function prefixLines(prefix: string): void {
    const view = editorView.value
    if (!view) return
    const { from, to } = view.state.selection.main
    const content = view.state.doc.toString()

    const changes: Array<{ from: number; insert: string }> = []
    let pos = 0
    for (const line of content.split('\n')) {
      if (pos + line.length >= from && pos <= to) {
        changes.push({ from: pos, insert: prefix })
      }
      pos += line.length + 1
    }

    if (changes.length > 0) {
      view.dispatch({ changes })
    }
  }

  function setContent(content: string): void {
    const view = editorView.value
    if (!view) return
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    })
    markdownContent.value = content
  }

  return {
    editorView,
    markdownContent,
    wrapSelection,
    insertText,
    prefixLines,
    setContent,
  }
}
