import { flushPromises, mount } from '@vue/test-utils'
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
