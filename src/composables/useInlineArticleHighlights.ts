import { nextTick, ref, watch, type Ref } from 'vue'
import type { Highlight } from '../api/highlightService'

const HIGHLIGHT_SELECTOR = 'mark[data-highlight-uuid]'

interface TextSegment {
  node: Text
  start: number
  end: number
}

interface MatchCandidate {
  index: number
  score: number
}

function collectTextSegments(root: HTMLElement): { text: string; segments: TextSegment[] } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement?.closest(HIGHLIGHT_SELECTOR)) return NodeFilter.FILTER_REJECT
      return node.textContent ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })
  const segments: TextSegment[] = []
  let text = ''
  let current: Node | null = walker.nextNode()
  while (current) {
    const node = current as Text
    const value = node.textContent ?? ''
    segments.push({ node, start: text.length, end: text.length + value.length })
    text += value
    current = walker.nextNode()
  }
  return { text, segments }
}

function findSegmentAt(
  segments: TextSegment[],
  offset: number,
): { segment: TextSegment; innerOffset: number } | null {
  const segment = segments.find((item) => offset >= item.start && offset <= item.end)
  if (!segment) return null
  return { segment, innerOffset: offset - segment.start }
}

function candidateScore(bodyText: string, index: number, highlight: Highlight, snippet: string): number {
  let score = 0
  const prefix = highlight.prefix ?? ''
  const suffix = highlight.suffix ?? ''
  if (prefix && bodyText.slice(Math.max(0, index - prefix.length), index) === prefix) score += prefix.length
  const suffixStart = index + snippet.length
  if (suffix && bodyText.slice(suffixStart, suffixStart + suffix.length) === suffix) score += suffix.length
  return score
}

function findBestIndex(bodyText: string, highlight: Highlight): number | null {
  const snippet = highlight.snippet.trim()
  if (!snippet) return null
  const candidates: MatchCandidate[] = []
  let index = bodyText.indexOf(snippet)
  while (index >= 0) {
    candidates.push({ index, score: candidateScore(bodyText, index, highlight, snippet) })
    index = bodyText.indexOf(snippet, index + snippet.length)
  }
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]!.index
  const sorted = [...candidates].sort((a, b) => b.score - a.score)
  const best = sorted[0]!
  const second = sorted[1]
  if (best.score <= 0 || second?.score === best.score) return null
  return best.index
}

function unwrapExistingMarks(root: HTMLElement) {
  const marks = Array.from(root.querySelectorAll(HIGHLIGHT_SELECTOR))
  for (const mark of marks) {
    const parent = mark.parentNode
    if (!parent) continue
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
    parent.normalize()
  }
}

function normalizeCssColor(color: string): string {
  const hex = color.match(/^#([0-9a-f]{6})$/i)
  if (!hex) return color
  const value = hex[1]!
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgb(${red}, ${green}, ${blue})`
}

function applyMark(root: HTMLElement, highlight: Highlight): boolean {
  const { text, segments } = collectTextSegments(root)
  const startIndex = findBestIndex(text, highlight)
  if (startIndex === null) return false
  const endIndex = startIndex + highlight.snippet.trim().length
  const start = findSegmentAt(segments, startIndex)
  const end = findSegmentAt(segments, endIndex)
  if (!start || !end) return false

  const range = document.createRange()
  range.setStart(start.segment.node, start.innerOffset)
  range.setEnd(end.segment.node, end.innerOffset)

  const mark = document.createElement('mark')
  mark.dataset.highlightUuid = highlight.uuid
  mark.style.backgroundColor = normalizeCssColor(highlight.color)
  mark.className = 'article-highlight-mark'
  mark.appendChild(range.extractContents())
  range.insertNode(mark)
  range.detach()
  return true
}

export function useInlineArticleHighlights(
  articleBodyRef: Ref<HTMLElement | null>,
  highlights: Ref<Highlight[]>,
) {
  const locatedByHighlightUuid = ref(new Map<string, boolean>())

  async function applyHighlights() {
    await nextTick()
    const root = articleBodyRef.value
    if (!root) return

    unwrapExistingMarks(root)
    const nextLocated = new Map<string, boolean>()
    for (const highlight of highlights.value) {
      nextLocated.set(highlight.uuid, applyMark(root, highlight))
    }
    locatedByHighlightUuid.value = nextLocated
  }

  watch(
    [articleBodyRef, highlights],
    () => {
      void applyHighlights()
    },
    { immediate: true, deep: true },
  )

  return { locatedByHighlightUuid, applyHighlights }
}
