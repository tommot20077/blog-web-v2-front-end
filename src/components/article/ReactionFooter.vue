<script setup lang="ts">
defineProps<{
  liked: boolean
  likeCount: number
  isPending: boolean
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <div class="reaction-footer">
    <button
      data-testid="article-like-footer"
      class="react"
      :class="{ active: liked }"
      :disabled="isPending"
      @click="$emit('toggle')"
    >
      <span aria-hidden="true">{{ liked ? '♥' : '♡' }}</span>
      <span>Like</span>
      <span data-testid="article-like-footer-count" class="n">{{ likeCount }}</span>
    </button>
  </div>
</template>

<style scoped>
.reaction-footer {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
.react {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.15));
  border-radius: 999px;
  background: var(--surface, #fbfbfb);
  cursor: pointer;
}
.react.active {
  color: #e15554;
  background: rgba(225, 85, 84, 0.08);
  border-color: rgba(225, 85, 84, 0.3);
}
.react .n {
  font-variant-numeric: tabular-nums;
  color: var(--muted, #6b6b70);
}
</style>
