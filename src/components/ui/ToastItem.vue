<script setup lang="ts">
import { computed } from 'vue';
import type { ToastMessage, ToastType } from '../../composables/useToast';

const props = defineProps<{
  toast: ToastMessage;
}>();

defineEmits<{
  close: [id: string];
}>();

const indicatorTextMap: Record<ToastType, string> = {
  success: '✓',
  error: '!',
  warning: '!',
  info: 'i',
};

const indicatorText = computed(() => indicatorTextMap[props.toast.type]);
</script>

<template>
  <div :class="['toast', toast.type]">
    <span data-testid="toast-indicator" class="ic">{{ indicatorText }}</span>

    <div class="msg">
      <b data-testid="toast-message">{{ toast.message }}</b>
      <span v-if="toast.sub" data-testid="toast-sub">{{ toast.sub }}</span>
    </div>

    <button
      data-testid="toast-close"
      class="close"
      type="button"
      aria-label="關閉通知"
      @click="$emit('close', toast.id)"
    >
      ✕
    </button>
  </div>
</template>
