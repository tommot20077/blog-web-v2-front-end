<script setup lang="ts">
defineProps<{
  liked: boolean
  likeCount: number
  isPending: boolean
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <aside class="action-bar">
    <button
      data-testid="article-like-action-bar"
      class="ab-btn"
      :class="{ active: liked, pulse: isPending }"
      :disabled="isPending"
      @click="$emit('toggle')"
    >
      <span aria-hidden="true">{{ liked ? '♥' : '♡' }}</span>
      <span data-testid="article-like-action-bar-count" class="ab-count">{{ likeCount }}</span>
    </button>

    <!-- placeholders for future Stage: bookmark / share / view-as-md -->
    <button class="ab-btn disabled" disabled title="coming soon" aria-label="Bookmark">🔖</button>
    <button class="ab-btn disabled" disabled title="coming soon" aria-label="Share">↗</button>
    <button class="ab-btn disabled" disabled title="coming soon" aria-label="View as Markdown">{ }</button>
  </aside>
</template>

<style scoped>
/* sticky 由父層 .art-action-rail 提供，這裡不重複 */
.action-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}
.ab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px;
  border-radius: 12px;
  background: var(--surface, #fbfbfb);
  border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
  cursor: pointer;
  transition: transform 120ms ease, background 120ms ease;
}
.ab-btn:hover:not(:disabled) {
  background: var(--bg-sub, #ededed);
}
.ab-btn.active {
  color: #e15554;
  background: rgba(225, 85, 84, 0.08);
}
.ab-btn.pulse {
  animation: pulse 350ms ease-out;
}
.ab-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ab-count {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
</style>
