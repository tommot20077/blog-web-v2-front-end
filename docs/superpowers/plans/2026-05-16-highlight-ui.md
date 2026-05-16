# Article Highlight UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ArticleDetail highlight MVP: select article text, create a backend highlight, restore saved highlights inline in article content, and manage highlights from the article page.

**Architecture:** Keep API routing in a top-level facade, feature state in `useArticleHighlights`, DOM anchoring in `useInlineArticleHighlights`, selection state in `useArticleTextSelection`, and visual controls in focused article components. `ArticleDetail.vue` only wires refs and callbacks together.

**Tech Stack:** Vue 3 Composition API, Pinia auth store, existing `useAuthWall` / `useToast`, Vitest, Testing Library Vue, existing axios `apiClient`.

---

## File Structure

- Create: `src/api/highlightService.ts`
  - Public facade that routes to mock or real highlight service.
- Create: `src/api/highlightService.test.ts`
  - Verifies real-mode routing through `apiClient` and mock-mode CRUD behavior.
- Create: `src/api/mock/highlightService.ts`
  - In-memory mock implementation for list/create/update/delete.
- Create: `src/composables/useArticleHighlights.ts`
  - Loads and mutates highlights for the current article, auth-gated and rollback-aware.
- Create: `src/composables/useArticleHighlights.test.ts`
  - Covers list/create/update/delete, auth gating, missing UUID, rollback, and error behavior.
- Create: `src/composables/useInlineArticleHighlights.ts`
  - Applies saved highlights to rendered article text with `<mark data-highlight-uuid>`, restores by snippet plus prefix/suffix, and exposes located status.
- Create: `src/composables/useInlineArticleHighlights.test.ts`
  - Covers unique snippet, duplicate snippet disambiguation, unresolved snippet, color updates, and delete cleanup.
- Create: `src/composables/useArticleTextSelection.ts`
  - Tracks valid user text selection inside the article body and extracts snippet/prefix/suffix.
- Create: `src/composables/useArticleTextSelection.test.ts`
  - Covers in-body selection, outside-body selection, length limits, and selection clear.
- Create: `src/components/article/ArticleTextSelectionToolbar.vue`
  - Floating toolbar for color selection and create action.
- Create: `src/components/article/ArticleTextSelectionToolbar.test.ts`
  - Covers hidden/visible states, color choice, create emit, and disabled pending state.
- Create: `src/components/article/ArticleHighlightPanel.vue`
  - Lists current article highlights and supports note edit, color change, delete, and not-located display.
- Create: `src/components/article/ArticleHighlightPanel.test.ts`
  - Covers rendering, not-located state, note update, color update, delete, and empty state.
- Modify: `src/views/ArticleDetail.vue`
  - Adds `articleBodyEl`, highlight composables, toolbar, and panel wiring.
- Modify: `src/views/ArticleDetail.test.ts`
  - Verifies ArticleDetail passes the article UUID/body refs and wires create/update/delete callbacks.

---

### Task 1: Highlight Service Facade And Mock

**Files:**
- Create: `src/api/highlightService.ts`
- Create: `src/api/highlightService.test.ts`
- Create: `src/api/mock/highlightService.ts`

- [ ] **Step 1: Write the failing facade tests**

Create `src/api/highlightService.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import apiClient from './apiClient'
import { highlightService } from './highlightService'

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('highlightService facade', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('API mode delegates list() to the real endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        uuid: 'h-1',
        snippet: 'selected text',
        prefix: '',
        suffix: '',
        color: '#FFEB3B',
        note: null,
        createdAt: '2026-05-16T00:00:00',
        updatedAt: '2026-05-16T00:00:00',
      },
    ])

    const result = await highlightService.list('article-uuid')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/highlights')
    expect(result[0]!.uuid).toBe('h-1')
  })

  it('API mode delegates create() to the real endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.post).mockResolvedValue({
      uuid: 'h-1',
      snippet: 'selected text',
      prefix: 'before',
      suffix: 'after',
      color: '#FFEB3B',
      note: null,
      createdAt: '2026-05-16T00:00:00',
      updatedAt: '2026-05-16T00:00:00',
    })

    await highlightService.create('article-uuid', {
      snippet: 'selected text',
      prefix: 'before',
      suffix: 'after',
      color: '#FFEB3B',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles/article-uuid/highlights', {
      snippet: 'selected text',
      prefix: 'before',
      suffix: 'after',
      color: '#FFEB3B',
    })
  })

  it('API mode delegates update() and delete() to real endpoints', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.put).mockResolvedValue({
      uuid: 'h-1',
      snippet: 'selected text',
      color: '#C8E6C9',
      note: 'note',
      createdAt: '2026-05-16T00:00:00',
      updatedAt: '2026-05-16T01:00:00',
    })
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)

    await highlightService.update('h-1', { color: '#C8E6C9', note: 'note' })
    await highlightService.delete('h-1')

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/highlights/h-1', { color: '#C8E6C9', note: 'note' })
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/highlights/h-1')
  })

  it('mock mode supports article-scoped CRUD in memory', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
    const articleUuid = `article-${Date.now()}`

    expect(await highlightService.list(articleUuid)).toEqual([])

    const created = await highlightService.create(articleUuid, {
      snippet: 'selected text',
      prefix: 'before',
      suffix: 'after',
      color: '#FFEB3B',
      note: 'first note',
    })
    expect(created.uuid).toMatch(/^mock-highlight-/)
    expect(await highlightService.list(articleUuid)).toHaveLength(1)

    const updated = await highlightService.update(created.uuid, { color: '#C8E6C9', note: 'updated' })
    expect(updated.color).toBe('#C8E6C9')
    expect(updated.note).toBe('updated')

    await highlightService.delete(created.uuid)
    expect(await highlightService.list(articleUuid)).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npx vitest run src/api/highlightService.test.ts
```

Expected:

```text
FAIL src/api/highlightService.test.ts
Error: Failed to resolve import "./highlightService"
```

- [ ] **Step 3: Add the facade and mock implementation**

Create `src/api/highlightService.ts`:

```ts
import type {
  CreateHighlightRequest,
  Highlight,
  UpdateHighlightRequest,
} from './real/highlightService'

export type { CreateHighlightRequest, Highlight, UpdateHighlightRequest }

export interface HighlightService {
  list(articleUuid: string): Promise<Highlight[]>
  create(articleUuid: string, request: CreateHighlightRequest): Promise<Highlight>
  update(uuid: string, request: UpdateHighlightRequest): Promise<Highlight>
  delete(uuid: string): Promise<void>
}

export const highlightService: HighlightService = {
  async list(articleUuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { highlightService: svc } = await import('./mock/highlightService')
      return svc.list(articleUuid)
    }
    const { highlightService: svc } = await import('./real/highlightService')
    return svc.list(articleUuid)
  },

  async create(articleUuid, request) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { highlightService: svc } = await import('./mock/highlightService')
      return svc.create(articleUuid, request)
    }
    const { highlightService: svc } = await import('./real/highlightService')
    return svc.create(articleUuid, request)
  },

  async update(uuid, request) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { highlightService: svc } = await import('./mock/highlightService')
      return svc.update(uuid, request)
    }
    const { highlightService: svc } = await import('./real/highlightService')
    return svc.update(uuid, request)
  },

  async delete(uuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { highlightService: svc } = await import('./mock/highlightService')
      return svc.delete(uuid)
    }
    const { highlightService: svc } = await import('./real/highlightService')
    return svc.delete(uuid)
  },
}
```

Create `src/api/mock/highlightService.ts`:

```ts
import type {
  CreateHighlightRequest,
  Highlight,
  UpdateHighlightRequest,
} from '../real/highlightService'

const highlightsByArticle = new Map<string, Highlight[]>()
let idCounter = 0

function now() {
  return new Date().toISOString()
}

function cloneHighlight(highlight: Highlight): Highlight {
  return { ...highlight }
}

function findHighlight(uuid: string): { articleUuid: string; index: number; highlight: Highlight } | null {
  for (const [articleUuid, highlights] of highlightsByArticle.entries()) {
    const index = highlights.findIndex((highlight) => highlight.uuid === uuid)
    if (index >= 0) return { articleUuid, index, highlight: highlights[index]! }
  }
  return null
}

export const highlightService = {
  async list(articleUuid: string): Promise<Highlight[]> {
    return (highlightsByArticle.get(articleUuid) ?? []).map(cloneHighlight)
  },

  async create(articleUuid: string, request: CreateHighlightRequest): Promise<Highlight> {
    const timestamp = now()
    const highlight: Highlight = {
      uuid: `mock-highlight-${++idCounter}`,
      snippet: request.snippet,
      prefix: request.prefix ?? '',
      suffix: request.suffix ?? '',
      color: request.color,
      note: request.note ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const highlights = highlightsByArticle.get(articleUuid) ?? []
    highlightsByArticle.set(articleUuid, [...highlights, highlight])
    return cloneHighlight(highlight)
  },

  async update(uuid: string, request: UpdateHighlightRequest): Promise<Highlight> {
    const found = findHighlight(uuid)
    if (!found) throw new Error('Highlight not found')

    const next: Highlight = {
      ...found.highlight,
      color: request.color ?? found.highlight.color,
      note: request.note ?? found.highlight.note ?? null,
      updatedAt: now(),
    }
    const highlights = highlightsByArticle.get(found.articleUuid) ?? []
    highlights.splice(found.index, 1, next)
    highlightsByArticle.set(found.articleUuid, [...highlights])
    return cloneHighlight(next)
  },

  async delete(uuid: string): Promise<void> {
    const found = findHighlight(uuid)
    if (!found) return

    const highlights = highlightsByArticle.get(found.articleUuid) ?? []
    highlightsByArticle.set(
      found.articleUuid,
      highlights.filter((highlight) => highlight.uuid !== uuid),
    )
  },
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npx vitest run src/api/highlightService.test.ts src/api/real/highlightService.test.ts
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/api/highlightService.ts src/api/highlightService.test.ts src/api/mock/highlightService.ts
git commit -m "feat(highlight): add highlight service facade"
```

---

### Task 2: Inline Highlight Restoration

**Files:**
- Create: `src/composables/useInlineArticleHighlights.ts`
- Create: `src/composables/useInlineArticleHighlights.test.ts`

- [ ] **Step 1: Write failing inline restore tests**

Create `src/composables/useInlineArticleHighlights.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { useInlineArticleHighlights } from './useInlineArticleHighlights'
import type { Highlight } from '../api/highlightService'

function highlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    uuid: 'h-1',
    snippet: 'selected text',
    prefix: '',
    suffix: '',
    color: '#FFEB3B',
    note: null,
    createdAt: '2026-05-16T00:00:00',
    updatedAt: '2026-05-16T00:00:00',
    ...overrides,
  }
}

function mountHarness(html: string, records: Highlight[]) {
  const Wrapper = defineComponent({
    setup() {
      const bodyRef = ref<HTMLElement | null>(null)
      const highlights = ref(records)
      const state = useInlineArticleHighlights(bodyRef, highlights)
      return { bodyRef, highlights, ...state }
    },
    template: `<div ref="bodyRef" data-testid="article-body">${html}</div>`,
  })

  return mount(Wrapper)
}

describe('useInlineArticleHighlights', () => {
  it('wraps a unique snippet with a highlight mark', async () => {
    const wrapper = mountHarness('<p>before selected text after</p>', [highlight()])
    await nextTick()

    const mark = wrapper.element.querySelector('[data-highlight-uuid="h-1"]') as HTMLElement
    expect(mark).toBeTruthy()
    expect(mark.textContent).toBe('selected text')
    expect(mark.style.backgroundColor).toBe('rgb(255, 235, 59)')
    expect(wrapper.vm.locatedByHighlightUuid.get('h-1')).toBe(true)
  })

  it('uses prefix and suffix to choose the matching duplicate snippet', async () => {
    const wrapper = mountHarness(
      '<p>alpha selected text omega</p><p>target before selected text target after</p>',
      [highlight({ prefix: 'target before ', suffix: ' target after' })],
    )
    await nextTick()

    const marks = Array.from(wrapper.element.querySelectorAll('[data-highlight-uuid="h-1"]'))
    expect(marks).toHaveLength(1)
    expect(marks[0]!.parentElement!.textContent).toContain('target before selected text target after')
  })

  it('does not guess when a snippet cannot be found', async () => {
    const wrapper = mountHarness('<p>article body</p>', [highlight({ snippet: 'missing text' })])
    await nextTick()

    expect(wrapper.element.querySelector('[data-highlight-uuid="h-1"]')).toBeNull()
    expect(wrapper.vm.locatedByHighlightUuid.get('h-1')).toBe(false)
  })

  it('re-applies marks when color changes', async () => {
    const wrapper = mountHarness('<p>before selected text after</p>', [highlight()])
    await nextTick()

    wrapper.vm.highlights = [highlight({ color: '#C8E6C9' })]
    await nextTick()

    const mark = wrapper.element.querySelector('[data-highlight-uuid="h-1"]') as HTMLElement
    expect(mark.style.backgroundColor).toBe('rgb(200, 230, 201)')
  })

  it('removes inline marks when highlight is deleted', async () => {
    const wrapper = mountHarness('<p>before selected text after</p>', [highlight()])
    await nextTick()

    wrapper.vm.highlights = []
    await nextTick()

    expect(wrapper.element.querySelector('[data-highlight-uuid="h-1"]')).toBeNull()
    expect(wrapper.element.textContent).toContain('before selected text after')
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npx vitest run src/composables/useInlineArticleHighlights.test.ts
```

Expected:

```text
FAIL src/composables/useInlineArticleHighlights.test.ts
Error: Failed to resolve import "./useInlineArticleHighlights"
```

- [ ] **Step 3: Add inline restore implementation**

Create `src/composables/useInlineArticleHighlights.ts`:

```ts
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

function findSegmentAt(segments: TextSegment[], offset: number): { segment: TextSegment; innerOffset: number } | null {
  const segment = segments.find((item) => offset >= item.start && offset <= item.end)
  if (!segment) return null
  return { segment, innerOffset: offset - segment.start }
}

function candidateScore(bodyText: string, index: number, highlight: Highlight): number {
  let score = 0
  const prefix = highlight.prefix ?? ''
  const suffix = highlight.suffix ?? ''
  if (prefix && bodyText.slice(Math.max(0, index - prefix.length), index) === prefix) score += prefix.length
  const suffixStart = index + highlight.snippet.length
  if (suffix && bodyText.slice(suffixStart, suffixStart + suffix.length) === suffix) score += suffix.length
  return score
}

function findBestIndex(bodyText: string, highlight: Highlight): number | null {
  const snippet = highlight.snippet.trim()
  if (!snippet) return null
  const candidates: MatchCandidate[] = []
  let index = bodyText.indexOf(snippet)
  while (index >= 0) {
    candidates.push({ index, score: candidateScore(bodyText, index, highlight) })
    index = bodyText.indexOf(snippet, index + snippet.length)
  }
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]!.index
  const sorted = [...candidates].sort((a, b) => b.score - a.score)
  return sorted[0]!.score > 0 ? sorted[0]!.index : null
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
  mark.style.backgroundColor = highlight.color
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

  watch([articleBodyRef, highlights], () => {
    void applyHighlights()
  }, { immediate: true, deep: true })

  return { locatedByHighlightUuid, applyHighlights }
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npx vitest run src/composables/useInlineArticleHighlights.test.ts
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/composables/useInlineArticleHighlights.ts src/composables/useInlineArticleHighlights.test.ts
git commit -m "feat(highlight): restore highlights inline"
```

---

### Task 3: Article Highlight State Composable

**Files:**
- Create: `src/composables/useArticleHighlights.ts`
- Create: `src/composables/useArticleHighlights.test.ts`

- [ ] **Step 1: Write failing composable tests**

Create `src/composables/useArticleHighlights.test.ts`:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { highlightService, type Highlight } from '../api/highlightService'
import { useAuthStore } from '../stores/auth'
import { useArticleHighlights } from './useArticleHighlights'

const mockRequireAuth = vi.fn()
const mockShowToast = vi.fn()

vi.mock('../api/highlightService', () => ({
  highlightService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('./useAuthWall', () => ({
  useAuthWall: () => ({ requireAuth: mockRequireAuth }),
}))

vi.mock('./useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

function makeHighlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    uuid: 'h-1',
    snippet: 'selected text',
    prefix: '',
    suffix: '',
    color: '#FFEB3B',
    note: null,
    createdAt: '2026-05-16T00:00:00',
    updatedAt: '2026-05-16T00:00:00',
    ...overrides,
  }
}

function mountHarness(options: { uuid?: string; authenticated?: boolean } = {}) {
  setActivePinia(createPinia())
  const auth = useAuthStore()
  auth.accessToken = options.authenticated === false ? null : 'access-token'

  const Wrapper = defineComponent({
    setup() {
      const articleUuid = ref(options.uuid ?? 'article-uuid')
      const state = useArticleHighlights(articleUuid)
      return { articleUuid, ...state }
    },
    template: '<div />',
  })

  return mount(Wrapper)
}

describe('useArticleHighlights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockReturnValue(true)
    vi.mocked(highlightService.list).mockResolvedValue([])
    vi.mocked(highlightService.create).mockResolvedValue(makeHighlight())
    vi.mocked(highlightService.update).mockResolvedValue(makeHighlight({ note: 'updated' }))
    vi.mocked(highlightService.delete).mockResolvedValue(undefined)
  })

  it('loads highlights for authenticated readers', async () => {
    vi.mocked(highlightService.list).mockResolvedValue([makeHighlight()])

    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    expect(highlightService.list).toHaveBeenCalledWith('article-uuid')
    expect(wrapper.vm.highlights).toHaveLength(1)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('skips load when unauthenticated or UUID is missing', async () => {
    mountHarness({ authenticated: false })
    mountHarness({ uuid: '' })
    await nextTick()
    await flushPromises()

    expect(highlightService.list).not.toHaveBeenCalled()
  })

  it('creates a highlight after auth wall passes', async () => {
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    await wrapper.vm.createHighlight({
      snippet: 'selected text',
      prefix: 'before ',
      suffix: ' after',
      color: '#FFEB3B',
    })

    expect(highlightService.create).toHaveBeenCalledWith('article-uuid', {
      snippet: 'selected text',
      prefix: 'before ',
      suffix: ' after',
      color: '#FFEB3B',
    })
    expect(wrapper.vm.highlights[0].uuid).toBe('h-1')
  })

  it('does not create when auth wall blocks', async () => {
    mockRequireAuth.mockReturnValue(false)
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    await wrapper.vm.createHighlight({ snippet: 'text', color: '#FFEB3B' })

    expect(highlightService.create).not.toHaveBeenCalled()
  })

  it('updates highlight and rolls back on failure', async () => {
    vi.mocked(highlightService.list).mockResolvedValue([makeHighlight({ note: 'old' })])
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    await wrapper.vm.updateHighlight('h-1', { note: 'updated' })
    expect(wrapper.vm.highlights[0].note).toBe('updated')

    vi.mocked(highlightService.update).mockRejectedValueOnce(new Error('fail'))
    await wrapper.vm.updateHighlight('h-1', { note: 'bad' })

    expect(wrapper.vm.highlights[0].note).toBe('updated')
    expect(mockShowToast).toHaveBeenCalledWith('更新劃線失敗，請稍後再試', 'error')
  })

  it('deletes highlight after API succeeds and keeps it on failure', async () => {
    vi.mocked(highlightService.list).mockResolvedValue([makeHighlight()])
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    await wrapper.vm.deleteHighlight('h-1')
    expect(wrapper.vm.highlights).toHaveLength(0)

    wrapper.vm.highlights = [makeHighlight()]
    vi.mocked(highlightService.delete).mockRejectedValueOnce(new Error('fail'))
    await wrapper.vm.deleteHighlight('h-1')

    expect(wrapper.vm.highlights).toHaveLength(1)
    expect(mockShowToast).toHaveBeenCalledWith('刪除劃線失敗，請稍後再試', 'error')
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npx vitest run src/composables/useArticleHighlights.test.ts
```

Expected:

```text
FAIL src/composables/useArticleHighlights.test.ts
Error: Failed to resolve import "./useArticleHighlights"
```

- [ ] **Step 3: Add state composable**

Create `src/composables/useArticleHighlights.ts`:

```ts
import { computed, ref, watch, type Ref } from 'vue'
import {
  highlightService,
  type CreateHighlightRequest,
  type Highlight,
  type UpdateHighlightRequest,
} from '../api/highlightService'
import { useAuthStore } from '../stores/auth'
import { useAuthWall } from './useAuthWall'
import { useToast } from './useToast'

export function useArticleHighlights(articleUuid: Readonly<Ref<string>>) {
  const authStore = useAuthStore()
  const { requireAuth } = useAuthWall()
  const { showToast } = useToast()
  const highlights = ref<Highlight[]>([])
  const isLoading = ref(false)
  const isMutating = ref(false)
  const loadError = ref(false)
  let loadRequestId = 0

  const canLoad = computed(() => authStore.isAuthenticated && Boolean(articleUuid.value))

  async function loadHighlights(targetUuid = articleUuid.value) {
    if (!canLoad.value) return
    const requestId = ++loadRequestId
    isLoading.value = true
    loadError.value = false
    try {
      const records = await highlightService.list(targetUuid)
      if (requestId !== loadRequestId || articleUuid.value !== targetUuid || !canLoad.value) return
      highlights.value = records
    } catch (error) {
      console.error('Failed to load article highlights:', error)
      loadError.value = true
      highlights.value = []
    } finally {
      if (requestId === loadRequestId) isLoading.value = false
    }
  }

  async function createHighlight(request: CreateHighlightRequest) {
    if (!requireAuth() || !articleUuid.value) return null
    isMutating.value = true
    try {
      const created = await highlightService.create(articleUuid.value, request)
      highlights.value = [...highlights.value, created]
      return created
    } catch (error) {
      console.error('Failed to create article highlight:', error)
      showToast('建立劃線失敗，請稍後再試', 'error')
      return null
    } finally {
      isMutating.value = false
    }
  }

  async function updateHighlight(uuid: string, request: UpdateHighlightRequest) {
    if (!requireAuth()) return null
    const previous = highlights.value
    isMutating.value = true
    try {
      const updated = await highlightService.update(uuid, request)
      highlights.value = highlights.value.map((highlight) => highlight.uuid === uuid ? updated : highlight)
      return updated
    } catch (error) {
      highlights.value = previous
      console.error('Failed to update article highlight:', error)
      showToast('更新劃線失敗，請稍後再試', 'error')
      return null
    } finally {
      isMutating.value = false
    }
  }

  async function deleteHighlight(uuid: string) {
    if (!requireAuth()) return false
    isMutating.value = true
    try {
      await highlightService.delete(uuid)
      highlights.value = highlights.value.filter((highlight) => highlight.uuid !== uuid)
      return true
    } catch (error) {
      console.error('Failed to delete article highlight:', error)
      showToast('刪除劃線失敗，請稍後再試', 'error')
      return false
    } finally {
      isMutating.value = false
    }
  }

  watch([articleUuid, canLoad], ([uuid, can]) => {
    loadRequestId += 1
    if (can) {
      void loadHighlights(uuid)
    } else {
      highlights.value = []
      isLoading.value = false
      loadError.value = false
    }
  }, { immediate: true })

  return {
    highlights,
    isLoading,
    isMutating,
    loadError,
    loadHighlights,
    createHighlight,
    updateHighlight,
    deleteHighlight,
  }
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npx vitest run src/composables/useArticleHighlights.test.ts
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/composables/useArticleHighlights.ts src/composables/useArticleHighlights.test.ts
git commit -m "feat(highlight): manage article highlights"
```

---

### Task 4: Text Selection Tracking And Toolbar

**Files:**
- Create: `src/composables/useArticleTextSelection.ts`
- Create: `src/composables/useArticleTextSelection.test.ts`
- Create: `src/components/article/ArticleTextSelectionToolbar.vue`
- Create: `src/components/article/ArticleTextSelectionToolbar.test.ts`

- [ ] **Step 1: Write failing selection and toolbar tests**

Create `src/composables/useArticleTextSelection.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useArticleTextSelection } from './useArticleTextSelection'

function selectText(node: Text, start: number, end: number) {
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
  document.dispatchEvent(new Event('selectionchange'))
}

function mountHarness() {
  const Wrapper = defineComponent({
    setup() {
      const bodyRef = ref<HTMLElement | null>(null)
      const state = useArticleTextSelection(bodyRef)
      return { bodyRef, ...state }
    },
    template: `<div><article ref="bodyRef"><p>before selected text after</p></article><aside>outside text</aside></div>`,
  })
  return mount(Wrapper, { attachTo: document.body })
}

describe('useArticleTextSelection', () => {
  afterEach(() => {
    window.getSelection()?.removeAllRanges()
  })

  it('extracts snippet prefix suffix for selection inside article body', async () => {
    const wrapper = mountHarness()
    await nextTick()
    const textNode = wrapper.element.querySelector('p')!.firstChild as Text

    selectText(textNode, 7, 20)
    await nextTick()

    expect(wrapper.vm.selectionPayload).toEqual({
      snippet: 'selected text',
      prefix: 'before ',
      suffix: ' after',
    })
  })

  it('uses the actual range offset when selected text appears more than once', async () => {
    const wrapper = mountHarness()
    await nextTick()
    const paragraph = wrapper.element.querySelector('p')!
    paragraph.textContent = 'alpha selected text omega target before selected text target after'
    const textNode = paragraph.firstChild as Text

    selectText(textNode, 40, 53)
    await nextTick()

    expect(wrapper.vm.selectionPayload).toEqual({
      snippet: 'selected text',
      prefix: 'alpha selected text omega target before ',
      suffix: ' target after',
    })
  })

  it('clears selection outside article body', async () => {
    const wrapper = mountHarness()
    await nextTick()
    const textNode = wrapper.element.querySelector('aside')!.firstChild as Text

    selectText(textNode, 0, 7)
    await nextTick()

    expect(wrapper.vm.selectionPayload).toBeNull()
  })

  it('rejects selected text longer than 500 characters', async () => {
    const wrapper = mountHarness()
    await nextTick()
    const paragraph = wrapper.element.querySelector('p')!
    paragraph.textContent = 'x'.repeat(501)
    selectText(paragraph.firstChild as Text, 0, 501)
    await nextTick()

    expect(wrapper.vm.selectionPayload).toBeNull()
    expect(wrapper.vm.selectionError).toBe('選取文字不可超過 500 字')
  })
})
```

Create `src/components/article/ArticleTextSelectionToolbar.test.ts`:

```ts
import { render, screen, fireEvent } from '@testing-library/vue'
import ArticleTextSelectionToolbar from './ArticleTextSelectionToolbar.vue'

describe('ArticleTextSelectionToolbar', () => {
  it('is hidden without a selection payload', () => {
    const { container } = render(ArticleTextSelectionToolbar, {
      props: { selectionPayload: null, isPending: false },
    })

    expect(container.querySelector('[data-testid="article-highlight-toolbar"]')).not.toBeInTheDocument()
  })

  it('emits create with the selected color and payload', async () => {
    const { emitted } = render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: { snippet: 'selected text', prefix: 'before ', suffix: ' after' },
        isPending: false,
      },
    })

    await fireEvent.click(screen.getByTestId('highlight-color-1'))
    await fireEvent.click(screen.getByTestId('highlight-create-button'))

    expect(emitted().create?.[0]).toEqual([
      {
        snippet: 'selected text',
        prefix: 'before ',
        suffix: ' after',
        color: '#C8E6C9',
      },
    ])
  })

  it('disables create while pending', () => {
    render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: { snippet: 'selected text', prefix: '', suffix: '' },
        isPending: true,
      },
    })

    expect(screen.getByTestId('highlight-create-button')).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npx vitest run src/composables/useArticleTextSelection.test.ts src/components/article/ArticleTextSelectionToolbar.test.ts
```

Expected:

```text
FAIL src/composables/useArticleTextSelection.test.ts
FAIL src/components/article/ArticleTextSelectionToolbar.test.ts
```

- [ ] **Step 3: Add selection composable and toolbar**

Create `src/composables/useArticleTextSelection.ts`:

```ts
import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export interface ArticleSelectionPayload {
  snippet: string
  prefix: string
  suffix: string
}

const CONTEXT_LIMIT = 64
const SNIPPET_LIMIT = 500

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
      selectionPayload.value = null
      return
    }

    const range = selection.getRangeAt(0)
    if (!root.contains(range.commonAncestorContainer)) {
      selectionPayload.value = null
      return
    }

    const rawSnippet = selection.toString()
    const snippet = rawSnippet.trim()
    if (!snippet) {
      selectionPayload.value = null
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
      selectionPayload.value = null
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
```

Create `src/components/article/ArticleTextSelectionToolbar.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ArticleSelectionPayload } from '../../composables/useArticleTextSelection'
import type { CreateHighlightRequest } from '../../api/highlightService'

const props = defineProps<{
  selectionPayload: ArticleSelectionPayload | null
  isPending: boolean
}>()

const emit = defineEmits<{
  create: [request: CreateHighlightRequest]
}>()

const colors = ['#FFEB3B', '#C8E6C9', '#BBDEFB']
const selectedColor = ref(colors[0])

function submit() {
  if (!props.selectionPayload || props.isPending) return
  emit('create', {
    ...props.selectionPayload,
    color: selectedColor.value,
  })
}
</script>

<template>
  <div
    v-if="selectionPayload"
    class="article-highlight-toolbar"
    data-testid="article-highlight-toolbar"
  >
    <button
      v-for="(color, index) in colors"
      :key="color"
      type="button"
      class="highlight-color"
      :class="{ active: selectedColor === color }"
      :style="{ backgroundColor: color }"
      :data-testid="`highlight-color-${index}`"
      @click="selectedColor = color"
    />
    <button
      type="button"
      class="highlight-create"
      data-testid="highlight-create-button"
      :disabled="isPending"
      @click="submit"
    >
      新增劃線
    </button>
  </div>
</template>

<style scoped>
.article-highlight-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
}
.highlight-color {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}
.highlight-color.active {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}
.highlight-create {
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--ink);
  color: var(--bg);
  padding: 6px 10px;
  cursor: pointer;
}
.highlight-create:disabled {
  cursor: wait;
  opacity: .6;
}
</style>
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npx vitest run src/composables/useArticleTextSelection.test.ts src/components/article/ArticleTextSelectionToolbar.test.ts
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/composables/useArticleTextSelection.ts src/composables/useArticleTextSelection.test.ts src/components/article/ArticleTextSelectionToolbar.vue src/components/article/ArticleTextSelectionToolbar.test.ts
git commit -m "feat(highlight): add article text selection toolbar"
```

---

### Task 5: Highlight Management Panel

**Files:**
- Create: `src/components/article/ArticleHighlightPanel.vue`
- Create: `src/components/article/ArticleHighlightPanel.test.ts`

- [ ] **Step 1: Write failing panel tests**

Create `src/components/article/ArticleHighlightPanel.test.ts`:

```ts
import { render, screen, fireEvent } from '@testing-library/vue'
import ArticleHighlightPanel from './ArticleHighlightPanel.vue'
import type { Highlight } from '../../api/highlightService'

function highlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    uuid: 'h-1',
    snippet: 'selected text',
    prefix: '',
    suffix: '',
    color: '#FFEB3B',
    note: 'note',
    createdAt: '2026-05-16T00:00:00',
    updatedAt: '2026-05-16T00:00:00',
    ...overrides,
  }
}

describe('ArticleHighlightPanel', () => {
  it('shows empty state when there are no highlights', () => {
    render(ArticleHighlightPanel, {
      props: {
        highlights: [],
        locatedByHighlightUuid: new Map(),
        isLoading: false,
        isMutating: false,
      },
    })

    expect(screen.getByText('尚未建立劃線')).toBeInTheDocument()
  })

  it('renders snippet note and not-located state', () => {
    render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', false]]),
        isLoading: false,
        isMutating: false,
      },
    })

    expect(screen.getByText('selected text')).toBeInTheDocument()
    expect(screen.getByDisplayValue('note')).toBeInTheDocument()
    expect(screen.getByText('正文位置已變更')).toBeInTheDocument()
  })

  it('emits update for note and color changes', async () => {
    const { emitted } = render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: false,
      },
    })

    await fireEvent.update(screen.getByDisplayValue('note'), 'new note')
    await fireEvent.click(screen.getByTestId('highlight-note-save-h-1'))
    await fireEvent.click(screen.getByTestId('highlight-panel-color-h-1-1'))

    expect(emitted().update?.[0]).toEqual(['h-1', { note: 'new note' }])
    expect(emitted().update?.[1]).toEqual(['h-1', { color: '#C8E6C9' }])
  })

  it('emits delete', async () => {
    const { emitted } = render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: false,
      },
    })

    await fireEvent.click(screen.getByTestId('highlight-delete-h-1'))

    expect(emitted().delete?.[0]).toEqual(['h-1'])
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npx vitest run src/components/article/ArticleHighlightPanel.test.ts
```

Expected:

```text
FAIL src/components/article/ArticleHighlightPanel.test.ts
Error: Failed to resolve import "./ArticleHighlightPanel.vue"
```

- [ ] **Step 3: Add panel component**

Create `src/components/article/ArticleHighlightPanel.vue`:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Highlight, UpdateHighlightRequest } from '../../api/highlightService'

const props = defineProps<{
  highlights: Highlight[]
  locatedByHighlightUuid: Map<string, boolean>
  isLoading: boolean
  isMutating: boolean
}>()

const emit = defineEmits<{
  update: [uuid: string, request: UpdateHighlightRequest]
  delete: [uuid: string]
}>()

const colors = ['#FFEB3B', '#C8E6C9', '#BBDEFB']
const noteDrafts = ref<Record<string, string>>({})

watch(
  () => props.highlights,
  (highlights) => {
    const next: Record<string, string> = {}
    for (const highlight of highlights) next[highlight.uuid] = highlight.note ?? ''
    noteDrafts.value = next
  },
  { immediate: true },
)

function isLocated(uuid: string) {
  return props.locatedByHighlightUuid.get(uuid) !== false
}
</script>

<template>
  <section class="article-highlight-panel" data-testid="article-highlight-panel">
    <div class="highlight-panel-head">
      <h2>我的劃線</h2>
      <span>{{ highlights.length }}</span>
    </div>

    <p v-if="isLoading" class="highlight-empty">載入劃線中...</p>
    <p v-else-if="highlights.length === 0" class="highlight-empty">尚未建立劃線</p>

    <article
      v-for="highlight in highlights"
      :key="highlight.uuid"
      class="highlight-card"
      :style="{ borderColor: highlight.color }"
    >
      <p class="highlight-snippet">{{ highlight.snippet }}</p>
      <p v-if="!isLocated(highlight.uuid)" class="highlight-warning">正文位置已變更</p>

      <div class="highlight-colors">
        <button
          v-for="(color, index) in colors"
          :key="color"
          type="button"
          class="highlight-color"
          :class="{ active: highlight.color === color }"
          :style="{ backgroundColor: color }"
          :data-testid="`highlight-panel-color-${highlight.uuid}-${index}`"
          :disabled="isMutating"
          @click="emit('update', highlight.uuid, { color })"
        />
      </div>

      <textarea
        v-model="noteDrafts[highlight.uuid]"
        class="highlight-note"
        maxlength="2000"
        :disabled="isMutating"
      />

      <div class="highlight-actions">
        <button
          type="button"
          :data-testid="`highlight-note-save-${highlight.uuid}`"
          :disabled="isMutating"
          @click="emit('update', highlight.uuid, { note: noteDrafts[highlight.uuid] ?? '' })"
        >
          儲存 note
        </button>
        <button
          type="button"
          :data-testid="`highlight-delete-${highlight.uuid}`"
          :disabled="isMutating"
          @click="emit('delete', highlight.uuid)"
        >
          刪除
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.article-highlight-panel {
  max-width: 68ch;
  margin: 40px auto 0;
  padding-top: 24px;
  border-top: 1px solid var(--divider);
}
.highlight-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.highlight-panel-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.highlight-empty {
  color: var(--muted);
  font-size: 14px;
}
.highlight-card {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: 8px;
  background: var(--bg-sub);
}
.highlight-snippet {
  margin: 0 0 8px;
  color: var(--ink);
}
.highlight-warning {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
}
.highlight-colors {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.highlight-color {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}
.highlight-color.active {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}
.highlight-note {
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--ink);
  padding: 8px;
  resize: vertical;
}
.highlight-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
```

- [ ] **Step 4: Run test to verify GREEN**

Run:

```bash
npx vitest run src/components/article/ArticleHighlightPanel.test.ts
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/components/article/ArticleHighlightPanel.vue src/components/article/ArticleHighlightPanel.test.ts
git commit -m "feat(highlight): add article highlight panel"
```

---

### Task 6: Wire Highlights Into ArticleDetail

**Files:**
- Modify: `src/views/ArticleDetail.vue`
- Modify: `src/views/ArticleDetail.test.ts`

- [ ] **Step 1: Write failing ArticleDetail wiring test**

Modify `src/views/ArticleDetail.test.ts`.

Add hoisted mocks:

```ts
const { mockUseArticleHighlights, mockUseInlineArticleHighlights, mockUseArticleTextSelection } = vi.hoisted(() => ({
  mockUseArticleHighlights: vi.fn(),
  mockUseInlineArticleHighlights: vi.fn(),
  mockUseArticleTextSelection: vi.fn(),
}))
```

Add composable/component mocks:

```ts
vi.mock('../composables/useArticleHighlights', () => ({
  useArticleHighlights: mockUseArticleHighlights,
}))

vi.mock('../composables/useInlineArticleHighlights', () => ({
  useInlineArticleHighlights: mockUseInlineArticleHighlights,
}))

vi.mock('../composables/useArticleTextSelection', () => ({
  useArticleTextSelection: mockUseArticleTextSelection,
}))

vi.mock('../components/article/ArticleTextSelectionToolbar.vue', () => ({
  default: {
    name: 'ArticleTextSelectionToolbar',
    props: ['selectionPayload', 'isPending'],
    emits: ['create'],
    template: '<button data-testid="mock-highlight-toolbar" @click="$emit(\\'create\\', selectionPayload)">toolbar</button>',
  },
}))

vi.mock('../components/article/ArticleHighlightPanel.vue', () => ({
  default: {
    name: 'ArticleHighlightPanel',
    props: ['highlights', 'locatedByHighlightUuid', 'isLoading', 'isMutating'],
    emits: ['update', 'delete'],
    template: '<section data-testid="mock-highlight-panel"></section>',
  },
}))
```

Add reset defaults in `beforeEach`:

```ts
mockUseArticleHighlights.mockReturnValue({
  highlights: ref([]),
  isLoading: ref(false),
  isMutating: ref(false),
  loadError: ref(false),
  createHighlight: vi.fn(),
  updateHighlight: vi.fn(),
  deleteHighlight: vi.fn(),
  loadHighlights: vi.fn(),
})
mockUseInlineArticleHighlights.mockReturnValue({
  locatedByHighlightUuid: ref(new Map()),
  applyHighlights: vi.fn(),
})
mockUseArticleTextSelection.mockReturnValue({
  selectionPayload: ref(null),
  selectionError: ref(null),
  clearSelection: vi.fn(),
  refreshSelection: vi.fn(),
})
```

Add test:

```ts
it('將文章 UUID 與 article body ref 接到 highlight composables', async () => {
  const mockArticle = createMockArticleDetail({ uuid: 'article-uuid', content: 'hello highlight' })
  vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

  const { container } = await renderArticleDetail()
  await flushPromises()

  expect(mockUseArticleHighlights).toHaveBeenCalledOnce()
  const [uuidRef] = mockUseArticleHighlights.mock.calls[0]!
  expect(uuidRef.value).toBe('article-uuid')

  expect(mockUseArticleTextSelection).toHaveBeenCalledOnce()
  const [bodyRefForSelection] = mockUseArticleTextSelection.mock.calls[0]!
  expect(bodyRefForSelection.value).toBe(container.querySelector('[data-testid="article-body"]'))

  expect(mockUseInlineArticleHighlights).toHaveBeenCalledOnce()
  const [bodyRefForInline] = mockUseInlineArticleHighlights.mock.calls[0]!
  expect(bodyRefForInline.value).toBe(container.querySelector('[data-testid="article-body"]'))
  expect(container.querySelector('[data-testid="mock-highlight-toolbar"]')).toBeInTheDocument()
  expect(container.querySelector('[data-testid="mock-highlight-panel"]')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npx vitest run src/views/ArticleDetail.test.ts
```

Expected:

```text
FAIL src/views/ArticleDetail.test.ts
AssertionError: expected "spy" to be called once
```

- [ ] **Step 3: Wire ArticleDetail**

Modify `src/views/ArticleDetail.vue`:

```ts
import { useArticleHighlights } from '../composables/useArticleHighlights'
import { useInlineArticleHighlights } from '../composables/useInlineArticleHighlights'
import { useArticleTextSelection } from '../composables/useArticleTextSelection'
import ArticleTextSelectionToolbar from '../components/article/ArticleTextSelectionToolbar.vue'
import ArticleHighlightPanel from '../components/article/ArticleHighlightPanel.vue'
```

Add setup state after `articleUuidRef`:

```ts
const articleBodyEl = ref<HTMLElement | null>(null)
const highlightState = useArticleHighlights(articleUuidRef)
const selectionState = useArticleTextSelection(articleBodyEl)
const inlineHighlightState = useInlineArticleHighlights(articleBodyEl, highlightState.highlights)

async function createHighlightFromSelection(request: Parameters<typeof highlightState.createHighlight>[0]) {
  const created = await highlightState.createHighlight(request)
  if (created) selectionState.clearSelection()
}
```

Change the article body div:

```vue
<div
  ref="articleBodyEl"
  class="art-body prose"
  data-testid="article-body"
  v-html="renderedHtml"
/>
```

Render toolbar immediately after the article body:

```vue
<ArticleTextSelectionToolbar
  :selection-payload="selectionState.selectionPayload.value"
  :is-pending="highlightState.isMutating.value"
  @create="createHighlightFromSelection"
/>
```

Render panel before the article end footer:

```vue
<ArticleHighlightPanel
  :highlights="highlightState.highlights.value"
  :located-by-highlight-uuid="inlineHighlightState.locatedByHighlightUuid.value"
  :is-loading="highlightState.isLoading.value"
  :is-mutating="highlightState.isMutating.value"
  @update="highlightState.updateHighlight"
  @delete="highlightState.deleteHighlight"
/>
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npx vitest run src/views/ArticleDetail.test.ts
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/views/ArticleDetail.vue src/views/ArticleDetail.test.ts
git commit -m "feat(highlight): wire highlights into article detail"
```

---

### Task 7: Focused Regression Run

**Files:**
- Verify only; no file edits expected unless a regression is found.

- [ ] **Step 1: Run focused highlight suite**

Run:

```bash
npx vitest run src/api/highlightService.test.ts src/api/real/highlightService.test.ts src/composables/useInlineArticleHighlights.test.ts src/composables/useArticleHighlights.test.ts src/composables/useArticleTextSelection.test.ts src/components/article/ArticleTextSelectionToolbar.test.ts src/components/article/ArticleHighlightPanel.test.ts src/views/ArticleDetail.test.ts
```

Expected:

```text
Test Files  8 passed
```

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected:

```text
no output
```

- [ ] **Step 3: Commit only if fixes were required**

If the focused suite or whitespace check requires a fix, commit the exact changed files:

```bash
git add src/api/highlightService.ts src/api/highlightService.test.ts src/api/mock/highlightService.ts src/composables/useInlineArticleHighlights.ts src/composables/useInlineArticleHighlights.test.ts src/composables/useArticleHighlights.ts src/composables/useArticleHighlights.test.ts src/composables/useArticleTextSelection.ts src/composables/useArticleTextSelection.test.ts src/components/article/ArticleTextSelectionToolbar.vue src/components/article/ArticleTextSelectionToolbar.test.ts src/components/article/ArticleHighlightPanel.vue src/components/article/ArticleHighlightPanel.test.ts src/views/ArticleDetail.vue src/views/ArticleDetail.test.ts
git commit -m "test(highlight): cover article highlight regressions"
```

If no fix is required, do not create an empty commit.

---

### Task 8: Full Verification And PR Prep

**Files:**
- Verify only; no file edits expected unless a regression is found.

- [ ] **Step 1: Run full Vitest suite**

Run:

```bash
npm test -- --watch=false
```

Expected:

```text
All test files pass
```

- [ ] **Step 2: Run build and classify failures**

Run:

```bash
npm run build
```

Expected:

```text
Build completes successfully
```

If build exits with existing project-wide type debt, rerun a changed-file filter:

```powershell
$output = npm run build 2>&1
$patterns = @(
  'src/api/highlightService',
  'src/api/mock/highlightService',
  'src/api/real/highlightService',
  'src/composables/useInlineArticleHighlights',
  'src/composables/useArticleHighlights',
  'src/composables/useArticleTextSelection',
  'src/components/article/ArticleTextSelectionToolbar',
  'src/components/article/ArticleHighlightPanel',
  'src/views/ArticleDetail'
)
$matches = $output | Select-String -SimpleMatch -Pattern $patterns
if ($matches) { $matches | ForEach-Object { $_.Line } } else { 'NO_CHANGED_FILE_BUILD_ERRORS' }
```

Changed-file build errors must be fixed before PR.

- [ ] **Step 3: Review diff**

Run:

```bash
git status --short --branch
git diff --stat develop...HEAD
git log --oneline develop..HEAD
```

Expected:

```text
Only highlight service, composables, components, ArticleDetail wiring, spec, and plan files are present.
```

- [ ] **Step 4: Push and create PR**

Run:

```bash
git push -u origin feature/highlight-ui-2026-05-16
gh pr create --base develop --head feature/highlight-ui-2026-05-16 --title "feat(highlight): add article highlight UI" --body "## Summary
- add highlight service facade with mock/real routing
- add article highlight create/update/delete state and UI
- restore saved highlights inline using snippet plus prefix/suffix anchoring

## Tests
- npx vitest run src/api/highlightService.test.ts src/api/real/highlightService.test.ts src/composables/useInlineArticleHighlights.test.ts src/composables/useArticleHighlights.test.ts src/composables/useArticleTextSelection.test.ts src/components/article/ArticleTextSelectionToolbar.test.ts src/components/article/ArticleHighlightPanel.test.ts src/views/ArticleDetail.test.ts
- npm test -- --watch=false
- npm run build"
```

Expected:

```text
GitHub returns the pull request URL.
```
