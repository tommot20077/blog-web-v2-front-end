<script setup lang="ts">
defineProps<{ label: string; hint?: string }>()
</script>

<template>
  <div class="st-field-group">
    <div>
      <div class="st-field-label">{{ label }}</div>
      <span v-if="hint" class="st-field-hint">{{ hint }}</span>
    </div>
    <div class="st-field-body">
      <slot />
    </div>
  </div>
</template>
