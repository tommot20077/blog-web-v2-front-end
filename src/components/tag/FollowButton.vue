<script setup lang="ts">
defineProps<{
  followed: boolean
  isPending: boolean
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    data-testid="tag-follow-btn"
    class="td-follow-btn"
    :class="{ active: followed }"
    :disabled="isPending"
    @click="$emit('toggle')"
  >
    {{ followed ? 'Following' : '+ Follow' }}
  </button>
</template>

<style scoped>
.td-follow-btn {
  font-family: var(--f-mono, monospace);
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.15));
  background: var(--surface, #fbfbfb);
  color: var(--ink, #0a0a0b);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.td-follow-btn:hover:not(:disabled) {
  background: var(--bg-sub, #ededed);
}
.td-follow-btn.active {
  background: rgba(91, 141, 239, 0.1);
  border-color: rgba(91, 141, 239, 0.35);
  color: var(--accent, #5b8def);
}
.td-follow-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
