<script setup lang="ts">
/**
 * ErrorBoundary — 子樹錯誤邊界（FE-01）
 *
 * 子元件 render／lifecycle 拋錯時，改顯示「此區塊載入失敗」fallback，
 * 區塊外（導覽列、頁尾等）照常運作。路由切換時自動重置錯誤狀態。
 *
 * 錯誤在此被吸收（onErrorCaptured 回傳 false），不再往上傳給 app.config.errorHandler，
 * 因此這裡自行 reportError；fallback 本身已是使用者可見的提示，不另外跳 toast。
 */
import { ref, watch, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import { getComponentName, reportError } from '../../utils/errorReporting'

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
    <button
      type="button"
      class="cursor-pointer rounded-full px-5 py-2 text-sm font-medium shadow-md transition-all duration-300"
      style="background: var(--ink); color: var(--bg);"
      @click="props.reload()"
    >
      重新整理
    </button>
  </div>
  <slot v-else />
</template>
