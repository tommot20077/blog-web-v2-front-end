import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export interface ArticleSelectionPayload {
  snippet: string
  prefix: string
  suffix: string
}

const CONTEXT_LIMIT = 64
const SNIPPET_LIMIT = 500

function clearSelectionState(
  selectionPayload: Ref<ArticleSelectionPayload | null>,
  selectionError: Ref<string | null>,
) {
  selectionPayload.value = null
  selectionError.value = null
}

function trimContext(value: string): string {
  return value.slice(-CONTEXT_LIMIT)
}

function getSuffix(value: string): string {
  return value.slice(0, CONTEXT_LIMIT)
}

function getRangeStartOffset(root: HTMLElement, range: Range): number | null {
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null
  const beforeSelection = document.createRange()
  beforeSelection.selectNodeContents(root)
  beforeSelection.setEnd(range.startContainer, range.startOffset)
  const offset = beforeSelection.toString().length
  beforeSelection.detach()
  return offset
}

export function useArticleTextSelection(articleBodyRef: Ref<HTMLElement | null>) {
  const selectionPayload = ref<ArticleSelectionPayload | null>(null)
  const selectionError = ref<string | null>(null)

  function clearSelection() {
    selectionPayload.value = null
    selectionError.value = null
    window.getSelection()?.removeAllRanges()
  }

  function refreshSelection() {
    const root = articleBodyRef.value
    const selection = window.getSelection()
    if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      clearSelectionState(selectionPayload, selectionError)
      return
    }

    const range = selection.getRangeAt(0)
    if (!root.contains(range.commonAncestorContainer)) {
      clearSelectionState(selectionPayload, selectionError)
      return
    }

    const rawSnippet = selection.toString()
    const snippet = rawSnippet.trim()
    if (!snippet) {
      clearSelectionState(selectionPayload, selectionError)
      return
    }
    if (snippet.length > SNIPPET_LIMIT) {
      selectionPayload.value = null
      selectionError.value = '選取文字不可超過 500 字'
      return
    }

    const bodyText = root.textContent ?? ''
    const rangeStartOffset = getRangeStartOffset(root, range)
    if (rangeStartOffset === null) {
      clearSelectionState(selectionPayload, selectionError)
      return
    }
    const leadingTrim = rawSnippet.length - rawSnippet.trimStart().length
    const snippetStart = rangeStartOffset + leadingTrim
    const snippetEnd = snippetStart + snippet.length
    selectionPayload.value = {
      snippet,
      prefix: trimContext(bodyText.slice(0, snippetStart)),
      suffix: getSuffix(bodyText.slice(snippetEnd)),
    }
    selectionError.value = null
  }

  onMounted(() => {
    document.addEventListener('selectionchange', refreshSelection)
    document.addEventListener('mouseup', refreshSelection)
  })

  onUnmounted(() => {
    document.removeEventListener('selectionchange', refreshSelection)
    document.removeEventListener('mouseup', refreshSelection)
  })

  return { selectionPayload, selectionError, clearSelection, refreshSelection }
}
