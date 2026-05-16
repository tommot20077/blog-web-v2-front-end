import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readingProgressService } from '../api/readingProgressService'
import { useAuthStore } from '../stores/auth'
import { usePersistedReadingProgress } from './usePersistedReadingProgress'

vi.mock('../api/readingProgressService', () => ({
  readingProgressService: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

const wrappers: VueWrapper[] = []

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

  const wrapper = mount(Wrapper)
  wrappers.push(wrapper)

  return wrapper
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

describe('usePersistedReadingProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(readingProgressService.get).mockResolvedValue(null)
    vi.mocked(readingProgressService.update).mockResolvedValue(undefined)
  })

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
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

  it('loads saved progress after auth becomes authenticated on an existing article', async () => {
    vi.mocked(readingProgressService.get).mockResolvedValue({
      progress: 0.35,
      lastHeading: null,
      updatedAt: '2026-05-16T00:00:00',
    })

    const wrapper = mountHarness({ authenticated: false })
    await nextTick()
    await flushPromises()
    expect(readingProgressService.get).not.toHaveBeenCalled()

    const auth = useAuthStore()
    auth.accessToken = 'access-token'
    await nextTick()
    await flushPromises()

    expect(readingProgressService.get).toHaveBeenCalledWith('article-uuid')
    expect(wrapper.vm.savedProgress).toBe(0.35)
    expect(wrapper.vm.lastPersistedProgress).toBe(0.35)
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

  it('skips non-finite local progress values', async () => {
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = Number.POSITIVE_INFINITY
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)

    expect(readingProgressService.update).not.toHaveBeenCalled()
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

  it('ignores stale loads after article UUID changes', async () => {
    const firstLoad = deferred<Awaited<ReturnType<typeof readingProgressService.get>>>()
    vi.mocked(readingProgressService.get)
      .mockReturnValueOnce(firstLoad.promise)
      .mockResolvedValueOnce({
        progress: 0.7,
        lastHeading: null,
        updatedAt: '2026-05-16T00:00:00',
      })

    const wrapper = mountHarness({ uuid: 'first-article' })
    await nextTick()
    expect(readingProgressService.get).toHaveBeenCalledWith('first-article')

    wrapper.vm.articleUuid = 'second-article'
    await nextTick()
    await flushPromises()
    expect(readingProgressService.get).toHaveBeenCalledWith('second-article')
    expect(wrapper.vm.savedProgress).toBe(0.7)

    firstLoad.resolve({
      progress: 0.2,
      lastHeading: null,
      updatedAt: '2026-05-16T00:00:00',
    })
    await flushPromises()

    expect(wrapper.vm.savedProgress).toBe(0.7)
    expect(wrapper.vm.lastPersistedProgress).toBe(0.7)
  })

  it('cancels pending persist on unmount', async () => {
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = 50
    await nextTick()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(1000)

    expect(readingProgressService.update).not.toHaveBeenCalled()
  })

  it('serializes concurrent persists so the latest queued progress wins', async () => {
    const firstPersist = deferred()
    const secondPersist = deferred()
    vi.mocked(readingProgressService.update)
      .mockReturnValueOnce(firstPersist.promise)
      .mockReturnValueOnce(secondPersist.promise)

    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    wrapper.vm.progress = 50
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)
    expect(readingProgressService.update).toHaveBeenCalledWith('article-uuid', { progress: 0.5 })

    wrapper.vm.progress = 80
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)
    expect(readingProgressService.update).toHaveBeenCalledTimes(1)

    firstPersist.resolve()
    await flushPromises()
    expect(readingProgressService.update).toHaveBeenCalledWith('article-uuid', { progress: 0.8 })

    secondPersist.resolve()
    await flushPromises()

    expect(wrapper.vm.lastPersistedProgress).toBe(0.8)
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

  it('does not throw when load or update fails and logs concise errors', async () => {
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
