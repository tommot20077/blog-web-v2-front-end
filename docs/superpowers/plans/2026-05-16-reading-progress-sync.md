# Reading Progress Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist authenticated article reading progress from `ArticleDetail` to the existing backend progress API.

**Architecture:** Keep scroll progress calculation in `useReadingProgress` and add a separate `usePersistedReadingProgress` composable for API persistence. Add a top-level `readingProgressService` facade with real/mock implementations, matching the existing API facade pattern.

**Tech Stack:** Vue 3 Composition API, Pinia auth store, Vitest, Testing Library Vue, existing axios `apiClient`.

---

## File Structure

- Create: `src/api/readingProgressService.ts`
  - Public facade used by composables. Routes to mock or real service based on `VITE_USE_MOCK`.
- Create: `src/api/readingProgressService.test.ts`
  - Tests facade real/mock routing and behavior.
- Create: `src/api/mock/readingProgressService.ts`
  - In-memory mock implementation for mock mode.
- Modify: `src/api/real/readingProgressService.ts`
  - Allow `get()` to return `ReadingProgress | null` because the backend controller can return null when no progress exists.
- Modify: `src/api/real/readingProgressService.test.ts`
  - Keep existing endpoint assertions and add null response coverage.
- Create: `src/composables/usePersistedReadingProgress.ts`
  - Loads saved progress for authenticated users and throttles progress writes.
- Create: `src/composables/usePersistedReadingProgress.test.ts`
  - Covers auth gating, load, writes, throttling, completion normalization, delta skipping, missing UUID, and API failures.
- Modify: `src/views/ArticleDetail.vue`
  - Wires `articleUuidRef` and local `progress` into `usePersistedReadingProgress`.
- Modify: `src/views/ArticleDetail.test.ts`
  - Mocks and verifies `usePersistedReadingProgress` receives reactive UUID and progress refs.

---

### Task 1: Add Reading Progress Facade And Mock Service

**Files:**
- Create: `src/api/readingProgressService.ts`
- Create: `src/api/readingProgressService.test.ts`
- Create: `src/api/mock/readingProgressService.ts`
- Modify: `src/api/real/readingProgressService.ts`
- Modify: `src/api/real/readingProgressService.test.ts`

- [ ] **Step 1: Write the failing facade and real-service tests**

Create `src/api/readingProgressService.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import apiClient from './apiClient'
import { readingProgressService } from './readingProgressService'

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('readingProgressService facade', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('API mode delegates get() to the real endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.get).mockResolvedValue({
      progress: 0.5,
      lastHeading: 'intro',
      updatedAt: '2026-05-16T00:00:00',
    })

    const result = await readingProgressService.get('article-uuid')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress')
    expect(result?.progress).toBe(0.5)
  })

  it('API mode delegates update() to the real endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.put).mockResolvedValue(undefined)

    await readingProgressService.update('article-uuid', { progress: 0.75 })

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress', { progress: 0.75 })
  })

  it('mock mode stores and returns progress in memory', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
    const uuid = `mock-article-${Date.now()}`

    expect(await readingProgressService.get(uuid)).toBeNull()

    await readingProgressService.update(uuid, { progress: 0.42, lastHeading: 'middle' })
    const result = await readingProgressService.get(uuid)

    expect(result).toEqual({
      progress: 0.42,
      lastHeading: 'middle',
      updatedAt: expect.any(String),
    })
  })
})
```

Extend `src/api/real/readingProgressService.test.ts`:

```ts
it('get 無進度時允許回傳 null', async () => {
  vi.mocked(apiClient.get).mockResolvedValue(null)

  const res = await readingProgressService.get('article-uuid')

  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress')
  expect(res).toBeNull()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/api/readingProgressService.test.ts src/api/real/readingProgressService.test.ts
```

Expected:

```text
FAIL src/api/readingProgressService.test.ts
Error: Failed to resolve import "./readingProgressService"
```

The real-service null test may pass before implementation; the facade test must fail because the facade file does not exist.

- [ ] **Step 3: Add the minimal implementation**

Create `src/api/readingProgressService.ts`:

```ts
import type {
  ReadingProgress,
  UpdateReadingProgressRequest,
} from './real/readingProgressService'

export type { ReadingProgress, UpdateReadingProgressRequest }

export interface ReadingProgressService {
  get(articleUuid: string): Promise<ReadingProgress | null>
  update(articleUuid: string, request: UpdateReadingProgressRequest): Promise<void>
}

export const readingProgressService: ReadingProgressService = {
  async get(articleUuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { readingProgressService: svc } = await import('./mock/readingProgressService')
      return svc.get(articleUuid)
    }
    const { readingProgressService: svc } = await import('./real/readingProgressService')
    return svc.get(articleUuid)
  },

  async update(articleUuid, request) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { readingProgressService: svc } = await import('./mock/readingProgressService')
      return svc.update(articleUuid, request)
    }
    const { readingProgressService: svc } = await import('./real/readingProgressService')
    return svc.update(articleUuid, request)
  },
}
```

Create `src/api/mock/readingProgressService.ts`:

```ts
import type {
  ReadingProgress,
  UpdateReadingProgressRequest,
} from '../real/readingProgressService'

const progressByArticle = new Map<string, ReadingProgress>()

function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress))
}

export const readingProgressService = {
  async get(articleUuid: string): Promise<ReadingProgress | null> {
    return progressByArticle.get(articleUuid) ?? null
  },

  async update(articleUuid: string, request: UpdateReadingProgressRequest): Promise<void> {
    progressByArticle.set(articleUuid, {
      progress: clampProgress(request.progress),
      lastHeading: request.lastHeading ?? null,
      updatedAt: new Date().toISOString(),
    })
  },
}
```

Modify `src/api/real/readingProgressService.ts`:

```ts
import apiClient from '../apiClient'

export interface ReadingProgress {
  progress: number
  lastHeading?: string | null
  updatedAt: string
}

export interface UpdateReadingProgressRequest {
  progress: number
  lastHeading?: string | null
}

export const readingProgressService = {
  async get(articleUuid: string): Promise<ReadingProgress | null> {
    return apiClient.get<unknown, ReadingProgress | null>(`/api/v1/articles/${articleUuid}/progress`)
  },

  async update(articleUuid: string, request: UpdateReadingProgressRequest): Promise<void> {
    await apiClient.put(`/api/v1/articles/${articleUuid}/progress`, request)
  },
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/api/readingProgressService.test.ts src/api/real/readingProgressService.test.ts
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/api/readingProgressService.ts src/api/readingProgressService.test.ts src/api/mock/readingProgressService.ts src/api/real/readingProgressService.ts src/api/real/readingProgressService.test.ts
git commit -m "feat(reading): add reading progress service facade"
```

---

### Task 2: Add Persisted Reading Progress Composable

**Files:**
- Create: `src/composables/usePersistedReadingProgress.ts`
- Create: `src/composables/usePersistedReadingProgress.test.ts`

- [ ] **Step 1: Write the failing composable tests**

Create `src/composables/usePersistedReadingProgress.test.ts`:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, ref, nextTick } from 'vue'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/auth'
import { readingProgressService } from '../api/readingProgressService'
import { usePersistedReadingProgress } from './usePersistedReadingProgress'

vi.mock('../api/readingProgressService', () => ({
  readingProgressService: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

function mountHarness(options: { uuid?: string; progress?: number; authenticated?: boolean } = {}) {
  setActivePinia(createPinia())
  const auth = useAuthStore()
  auth.accessToken = options.authenticated === false ? null : 'access-token'

  const Wrapper = defineComponent({
    setup() {
      const articleUuid = ref(options.uuid ?? 'article-uuid')
      const progress = ref(options.progress ?? 0)
      const state = usePersistedReadingProgress(articleUuid, progress, {
        throttleMs: 1000,
      })
      return { articleUuid, progress, ...state }
    },
    template: '<div />',
  })

  return mount(Wrapper)
}

describe('usePersistedReadingProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(readingProgressService.get).mockResolvedValue(null)
    vi.mocked(readingProgressService.update).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('loads saved progress for authenticated readers', async () => {
    vi.mocked(readingProgressService.get).mockResolvedValue({
      progress: 0.4,
      lastHeading: 'intro',
      updatedAt: '2026-05-16T00:00:00',
    })

    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    expect(readingProgressService.get).toHaveBeenCalledWith('article-uuid')
    expect(wrapper.vm.savedProgress).toBe(0.4)
    expect(wrapper.vm.lastPersistedProgress).toBe(0.4)
  })

  it('skips load and writes when unauthenticated', async () => {
    const wrapper = mountHarness({ authenticated: false })
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = 50
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)

    expect(readingProgressService.get).not.toHaveBeenCalled()
    expect(readingProgressService.update).not.toHaveBeenCalled()
  })

  it('throttles progress writes and converts 0..100 progress to 0..1', async () => {
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = 50
    await nextTick()
    expect(readingProgressService.update).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)

    expect(readingProgressService.update).toHaveBeenCalledWith('article-uuid', { progress: 0.5 })
  })

  it('persists completion as 1 when local progress reaches 95 percent', async () => {
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = 95
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)

    expect(readingProgressService.update).toHaveBeenCalledWith('article-uuid', { progress: 1 })
  })

  it('skips small progress deltas below 0.03', async () => {
    vi.mocked(readingProgressService.get).mockResolvedValue({
      progress: 0.5,
      lastHeading: null,
      updatedAt: '2026-05-16T00:00:00',
    })

    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = 52
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)

    expect(readingProgressService.update).not.toHaveBeenCalled()
  })

  it('skips load and writes when article UUID is missing', async () => {
    const wrapper = mountHarness({ uuid: '' })
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = 60
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)

    expect(readingProgressService.get).not.toHaveBeenCalled()
    expect(readingProgressService.update).not.toHaveBeenCalled()
  })

  it('does not throw when load or update fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(readingProgressService.get).mockRejectedValueOnce(new Error('load failed'))
    vi.mocked(readingProgressService.update).mockRejectedValueOnce(new Error('update failed'))

    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = 50
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load reading progress:', expect.any(Error))
    expect(consoleSpy).toHaveBeenCalledWith('Failed to persist reading progress:', expect.any(Error))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/composables/usePersistedReadingProgress.test.ts
```

Expected:

```text
FAIL src/composables/usePersistedReadingProgress.test.ts
Error: Failed to resolve import "./usePersistedReadingProgress"
```

- [ ] **Step 3: Add the minimal composable implementation**

Create `src/composables/usePersistedReadingProgress.ts`:

```ts
import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import { readingProgressService } from '../api/readingProgressService'
import { useAuthStore } from '../stores/auth'

interface PersistedReadingProgressOptions {
  throttleMs?: number
}

const DEFAULT_THROTTLE_MS = 1000
const MIN_DELTA = 0.03
const COMPLETE_THRESHOLD = 0.95

function normalizeProgress(progressPercent: number): number {
  const ratio = Math.min(1, Math.max(0, progressPercent / 100))
  return ratio >= COMPLETE_THRESHOLD ? 1 : Number(ratio.toFixed(3))
}

export function usePersistedReadingProgress(
  articleUuid: Ref<string>,
  progress: Ref<number>,
  options: PersistedReadingProgressOptions = {},
) {
  const authStore = useAuthStore()
  const savedProgress = ref<number | null>(null)
  const lastPersistedProgress = ref<number | null>(null)
  const isLoadingProgress = ref(false)
  const isPersistingProgress = ref(false)
  const throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS
  let persistTimer: ReturnType<typeof setTimeout> | null = null

  const canPersist = computed(() => Boolean(authStore.isAuthenticated && articleUuid.value))

  function clearPersistTimer() {
    if (!persistTimer) return
    clearTimeout(persistTimer)
    persistTimer = null
  }

  async function loadProgress() {
    if (!canPersist.value) return
    isLoadingProgress.value = true
    try {
      const saved = await readingProgressService.get(articleUuid.value)
      savedProgress.value = saved?.progress ?? null
      lastPersistedProgress.value = saved?.progress ?? 0
    } catch (error) {
      console.error('Failed to load reading progress:', error)
    } finally {
      isLoadingProgress.value = false
    }
  }

  function shouldPersist(nextProgress: number): boolean {
    if (lastPersistedProgress.value === null) return nextProgress > 0
    if (nextProgress === 1 && lastPersistedProgress.value !== 1) return true
    return Math.abs(nextProgress - lastPersistedProgress.value) >= MIN_DELTA
  }

  async function persistProgress(nextProgress: number) {
    if (!canPersist.value || !shouldPersist(nextProgress)) return
    isPersistingProgress.value = true
    try {
      await readingProgressService.update(articleUuid.value, { progress: nextProgress })
      lastPersistedProgress.value = nextProgress
    } catch (error) {
      console.error('Failed to persist reading progress:', error)
    } finally {
      isPersistingProgress.value = false
    }
  }

  function schedulePersist() {
    if (!canPersist.value) return
    const nextProgress = normalizeProgress(progress.value)
    clearPersistTimer()
    persistTimer = setTimeout(() => {
      persistTimer = null
      void persistProgress(nextProgress)
    }, throttleMs)
  }

  watch(articleUuid, () => {
    clearPersistTimer()
    savedProgress.value = null
    lastPersistedProgress.value = null
    void loadProgress()
  }, { immediate: true })

  watch(progress, schedulePersist)

  onUnmounted(clearPersistTimer)

  return {
    savedProgress,
    lastPersistedProgress,
    isLoadingProgress,
    isPersistingProgress,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/composables/usePersistedReadingProgress.test.ts
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/composables/usePersistedReadingProgress.ts src/composables/usePersistedReadingProgress.test.ts
git commit -m "feat(reading): persist article reading progress"
```

---

### Task 3: Wire Persistence Into ArticleDetail

**Files:**
- Modify: `src/views/ArticleDetail.vue`
- Modify: `src/views/ArticleDetail.test.ts`

- [ ] **Step 1: Write the failing ArticleDetail wiring test**

Modify `src/views/ArticleDetail.test.ts`.

Add a hoisted mock near the top:

```ts
const { mockUsePersistedReadingProgress } = vi.hoisted(() => ({
  mockUsePersistedReadingProgress: vi.fn(),
}))
```

Add this mock with the other composable mocks:

```ts
vi.mock('../composables/usePersistedReadingProgress', () => ({
  usePersistedReadingProgress: mockUsePersistedReadingProgress,
}))
```

Add this reset in `beforeEach`:

```ts
mockUsePersistedReadingProgress.mockClear()
```

Add this test inside `describe('ArticleDetail 頁面', ...)`:

```ts
it('將文章 UUID 與本地閱讀進度傳入持久化 composable', async () => {
  const mockArticle = createMockArticleDetail({ uuid: 'article-uuid' })
  vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

  await renderArticleDetail()
  await flushPromises()

  expect(mockUsePersistedReadingProgress).toHaveBeenCalledOnce()
  const [uuidRef, progressRef] = mockUsePersistedReadingProgress.mock.calls[0]
  expect(uuidRef.value).toBe('article-uuid')
  expect(progressRef.value).toBe(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/views/ArticleDetail.test.ts
```

Expected:

```text
FAIL src/views/ArticleDetail.test.ts
AssertionError: expected "spy" to be called once
```

- [ ] **Step 3: Wire the composable in ArticleDetail**

Modify `src/views/ArticleDetail.vue`.

Add the import:

```ts
import { usePersistedReadingProgress } from '../composables/usePersistedReadingProgress'
```

After `articleUuidRef` is defined, call the composable:

```ts
const articleUuidRef = computed(() => article.value?.uuid ?? '')
usePersistedReadingProgress(articleUuidRef, progress)
const likeState = useArticleLike(articleUuidRef, { liked: false, likeCount: 0 })
const bookmarkState = useArticleBookmark(articleUuidRef, { bookmarked: false })
```

- [ ] **Step 4: Run test to verify it passes**

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
git commit -m "feat(reading): sync article detail progress"
```

---

### Task 4: Focused Regression Run

**Files:**
- Verify only; no file edits expected.

- [ ] **Step 1: Run focused test suite**

Run:

```bash
npx vitest run src/api/readingProgressService.test.ts src/api/real/readingProgressService.test.ts src/composables/usePersistedReadingProgress.test.ts src/views/ArticleDetail.test.ts src/composables/useReadingProgress.test.ts
```

Expected:

```text
Test Files  5 passed
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

- [ ] **Step 3: Commit only if fixes were needed**

If Step 1 or Step 2 required changes, commit the fixes:

```bash
git add src/api/readingProgressService.ts src/api/readingProgressService.test.ts src/api/mock/readingProgressService.ts src/api/real/readingProgressService.ts src/api/real/readingProgressService.test.ts src/composables/usePersistedReadingProgress.ts src/composables/usePersistedReadingProgress.test.ts src/views/ArticleDetail.vue src/views/ArticleDetail.test.ts
git commit -m "test(reading): cover progress persistence regressions"
```

If no changes were needed, do not create an empty commit.

---

### Task 5: Full Verification And PR Prep

**Files:**
- Verify only; no file edits expected unless a regression is found.

- [ ] **Step 1: Run full unit test suite**

Run:

```bash
npm test -- --watch=false
```

Expected:

```text
Test Files  131 passed
Tests  1013 passed
```

The exact test count may increase after new tests are added. Any failure in changed files must be fixed before PR.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected:

```text
Build completes successfully
```

If build fails with existing project-wide type debt outside changed files, capture the failing file list and prove no changed file is implicated.

- [ ] **Step 3: Review diff**

Run:

```bash
git status --short --branch
git diff --stat develop...HEAD
git log --oneline develop..HEAD
```

Expected:

```text
Only reading progress service, composable, ArticleDetail wiring, tests, spec, and plan files are present.
```

- [ ] **Step 4: Push and open PR**

Run:

```bash
git push -u origin feature/reading-progress-sync-2026-05-16
gh pr create --base develop --head feature/reading-progress-sync-2026-05-16 --title "feat(reading): sync article reading progress" --body "## Summary
- add a reading progress service facade with mock/real routing
- persist authenticated ArticleDetail reading progress with throttled writes
- wire ArticleDetail progress into backend sync

## Tests
- npm test -- --watch=false
- npm run build"
```

Expected:

```text
GitHub returns the pull request URL.
```
