<script setup lang="ts">
defineProps<{
  width?: string;
  height?: string;
}>();
</script>

<template>
  <div
    class="rounded-md"
    :style="{
      width: width ?? '100%',
      height: height ?? '1rem',
      backgroundColor: 'var(--skeleton-base)',
    }"
  />
</template>
