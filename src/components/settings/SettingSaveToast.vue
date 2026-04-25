<script setup lang="ts">
defineProps<{ status: 'idle' | 'saving' | 'saved' }>()
</script>

<template>
  <Transition name="toast">
    <div v-if="status !== 'idle'" :class="['st-toast', status]">
      <span :class="['st-toast-dot', status]" />
      {{ status === 'saving' ? '儲存中…' : '已儲存' }}
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active { animation: st-toast-in 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }
.toast-leave-active { animation: st-toast-out 0.25s ease forwards; }
</style>
