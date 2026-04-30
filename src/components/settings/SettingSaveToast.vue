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
/* Spring bounce in/out transitions */
@keyframes st-toast-in {
  0%   { opacity: 0; transform: translateY(8px) scale(0.88); }
  60%  { opacity: 1; transform: translateY(-3px) scale(1.04); }
  80%  { transform: translateY(1px) scale(0.98); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes st-toast-out {
  0%   { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.9) translateY(4px); }
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.toast-enter-active { animation: st-toast-in 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }
.toast-leave-active { animation: st-toast-out 0.25s ease forwards; }

.st-toast { display: inline-flex; align-items: center; gap: 7px; font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; box-shadow: 0 4px 14px rgba(0,0,0,0.10); }
.st-toast.saving { color: var(--muted); background: var(--surface); border: 1px solid var(--border); }
.st-toast.saved { color: #2E7D4E; background: color-mix(in oklch, #47B881 18%, var(--surface)); border: 1px solid color-mix(in oklch, #47B881 40%, var(--border)); }
[data-theme="dark"] .st-toast.saved { color: #65D19A; }
.st-toast-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.st-toast-dot.saving { background: var(--muted-2); animation: pulse 1s ease-in-out infinite; }
.st-toast-dot.saved { background: #47B881; }
</style>
