<script setup lang="ts">
import type { ToastMessage, ToastType } from '../../composables/useToast';

defineProps<{
  toast: ToastMessage;
}>();

defineEmits<{
  close: [id: string];
}>();

const indicatorColorMap: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};
</script>

<template>
  <div
    class="flex items-stretch gap-3 rounded-2xl border px-4 py-3 shadow-lg min-w-[280px] max-w-[400px] transition-all duration-300"
    style="background: var(--glass); border-color: var(--glass-border); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
  >
    <!-- 左側色條指示器 -->
    <div
      data-testid="toast-indicator"
      class="w-1 rounded-full shrink-0"
      :class="indicatorColorMap[toast.type]"
    />

    <!-- 訊息內容 -->
    <p data-testid="toast-message" class="flex-1 text-sm font-medium py-0.5" style="color: var(--ink);">
      {{ toast.message }}
    </p>

    <!-- 關閉按鈕 -->
    <button
      data-testid="toast-close"
      class="shrink-0 opacity-40 hover:opacity-100 transition-opacity text-sm leading-none self-start pt-0.5"
      style="color: var(--ink);"
      @click="$emit('close', toast.id)"
    >
      ✕
    </button>
  </div>
</template>
