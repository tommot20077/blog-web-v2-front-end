<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import ToastItem from './ToastItem.vue';

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="fixed top-24 right-6 z-[100] flex flex-col gap-3 max-md:top-4 max-md:right-4 max-md:left-4">
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-3"
    >
      <ToastItem
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
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
