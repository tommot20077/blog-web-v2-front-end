<script setup lang="ts">
defineProps<{ label: string; hint?: string }>()
const model = defineModel<boolean>()
</script>

<template>
  <div class="st-toggle">
    <div>
      <span class="st-toggle-label">{{ label }}</span>
      <span v-if="hint" class="st-field-hint">{{ hint }}</span>
    </div>
    <button type="button" class="st-toggle-track" :class="{ on: model }" @click="model = !model" :aria-pressed="model">
      <span class="st-toggle-thumb" />
    </button>
  </div>
</template>
