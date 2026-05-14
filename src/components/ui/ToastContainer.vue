<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import ToastItem from './ToastItem.vue';

const { toasts, removeToast } = useToast();
</script>

<template>
  <TransitionGroup
    name="toast"
    tag="div"
    class="toast-stack"
  >
    <ToastItem
      v-for="toast in toasts"
      :key="toast.id"
      :toast="toast"
      @close="removeToast"
    />
  </TransitionGroup>
</template>
