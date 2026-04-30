<script setup lang="ts">
defineProps<{
  size?: string;
}>();
</script>

<template>
  <div
    class="rounded-full"
    :style="{
      width: size ?? '2.5rem',
      height: size ?? '2.5rem',
      backgroundColor: 'var(--skeleton-base)',
    }"
  />
</template>
