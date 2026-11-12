<script setup lang="ts">
import { computed } from 'vue';
import { useToast } from '../../composables/useToast';
import ToastItem from './ToastItem.vue';

const { toasts, removeToast } = useToast();

// 兩個 live region 常駐於 DOM（toast 出現前就已 mount，閱讀器才會朗讀）：
// error 走 assertive，其餘走 polite。不在項目上加 role=alert，避免巢狀 live region 重複朗讀。
const politeToasts = computed(() => toasts.value.filter(t => t.type !== 'error'));
const assertiveToasts = computed(() => toasts.value.filter(t => t.type === 'error'));
</script>

<template>
  <div class="toast-stack fixed top-24 right-6 z-[100] flex flex-col max-md:top-4 max-md:right-4 max-md:left-4">
    <TransitionGroup
      name="toast"
      tag="div"
      aria-live="polite"
      class="flex flex-col gap-3"
    >
      <ToastItem
        v-for="toast in politeToasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast"
      />
    </TransitionGroup>
    <TransitionGroup
      name="toast"
      tag="div"
      aria-live="assertive"
      class="flex flex-col gap-3"
    >
      <ToastItem
        v-for="toast in assertiveToasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* 兩個區域都有內容時，才在中間補間距（空區域不佔位） */
.toast-stack > :deep(:not(:empty) ~ :not(:empty)) {
  margin-top: 0.75rem;
}

.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .toast-enter-from {
    transform: translateY(-100%);
  }
  .toast-leave-to {
    transform: translateY(-100%);
  }
}
</style>
