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
  articleUuid: Readonly<Ref<string>>,
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

  const canPersist = computed(() => authStore.isAuthenticated && Boolean(articleUuid.value))

  function clearPersistTimer() {
    if (persistTimer === null) return

    clearTimeout(persistTimer)
    persistTimer = null
  }

  async function loadProgress() {
    if (!canPersist.value) return

    isLoadingProgress.value = true
    try {
      const saved = await readingProgressService.get(articleUuid.value)
      savedProgress.value = saved?.progress ?? null
      lastPersistedProgress.value = saved?.progress ?? null
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

  watch(
    articleUuid,
    () => {
      clearPersistTimer()
      savedProgress.value = null
      lastPersistedProgress.value = null
      void loadProgress()
    },
    { immediate: true },
  )

  watch(progress, schedulePersist)

  onUnmounted(clearPersistTimer)

  return {
    savedProgress,
    lastPersistedProgress,
    isLoadingProgress,
    isPersistingProgress,
  }
}
