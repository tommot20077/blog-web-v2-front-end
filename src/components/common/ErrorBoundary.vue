<script setup lang="ts">
/**
 * ErrorBoundary — 子樹錯誤邊界（FE-01）
 *
 * 子元件 render／lifecycle 拋錯時，改顯示「此區塊載入失敗」fallback，
 * 區塊外（導覽列、頁尾等）照常運作。路由切換時自動重置錯誤狀態。
 *
 * 只吸收 render／setup 階段的錯誤（區塊畫不出來）。回傳 false 不再往上傳給
 * app.config.errorHandler，因此這裡自行 reportError；fallback 本身已是使用者可見的提示，不另外跳 toast。
 *
 * 其餘錯誤一律回傳 true 交給 global handler（只記錄／提示），頁面照常顯示：
 * - async lifecycle hook／event handler 的 rejection（Vue 同樣送進 errorCaptured，
 *   例如 onMounted(async) 內未 catch 的 API 失敗，此時頁面已渲染完成）
 * - 已被 apiClient interceptor 標記處理過的錯誤、AbortError／取消請求
 */
import { ref, watch, onErrorCaptured } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  getComponentName,
  isErrorHandled,
  isIgnorableError,
  isRenderPhaseError,
  reportError,
} from '../../utils/errorReporting'

const props = withDefaults(
  defineProps<{
    /** 「重新整理」按鈕的動作；預設重新載入整個頁面 */
    reload?: () => void
  }>(),
  { reload: () => window.location.reload() },
)

const route = useRoute()
const hasError = ref(false)

onErrorCaptured((err, instance, info) => {
  if (isErrorHandled(err) || isIgnorableError(err) || !isRenderPhaseError(info)) return true
  reportError(err, {
    source: 'error-boundary',
    componentName: getComponentName(instance),
    info,
  })
  hasError.value = true
  return false
})

// 路由切換：重置錯誤狀態，讓新頁面有機會正常渲染
watch(
  () => route?.fullPath,
  () => {
    hasError.value = false
  },
)
</script>

<template>
  <div
    v-if="hasError"
    role="alert"
    class="mx-auto my-16 flex max-w-md flex-col items-center gap-4 rounded-3xl border px-8 py-10 text-center shadow-lg"
    style="background: var(--glass); border-color: var(--glass-border); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
  >
    <p class="text-base font-semibold" style="color: var(--danger);">此區塊載入失敗</p>
    <p class="text-sm" style="color: var(--muted);">發生非預期的錯誤，請重新整理頁面後再試。</p>
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="cursor-pointer rounded-full px-5 py-2 text-sm font-medium shadow-md transition-all duration-300"
        style="background: var(--ink); color: var(--bg);"
        @click="props.reload()"
      >
        重新整理
      </button>
      <!-- shell／full 版面的導覽列在 view 內，view 被取代後需要另一條出路 -->
      <RouterLink
        to="/"
        class="rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10"
        style="color: var(--ink);"
      >
        回首頁
      </RouterLink>
    </div>
  </div>
  <slot v-else />
</template>
