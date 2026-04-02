<script setup lang="ts">
defineProps<{
  width?: string;
  height?: string;
}>();
</script>

<template>
  <div
    class="rounded-xl"
    :style="{
      width: width ?? '100%',
      height: height ?? '200px',
      backgroundColor: 'var(--skeleton-base)',
    }"
  />
</template>
