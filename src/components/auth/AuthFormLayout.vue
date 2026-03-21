<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div
      class="w-full max-w-md rounded-3xl border p-8"
      style="background: var(--glass-panel); border-color: var(--glass-border); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)"
    >
      <!-- 標題區 -->
      <div class="mb-6 text-center">
        <h1
          class="text-2xl font-bold"
          style="color: var(--text-main)"
        >
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          data-testid="auth-subtitle"
          class="mt-2 text-sm opacity-70"
          style="color: var(--text-main)"
        >
          {{ subtitle }}
        </p>
      </div>

      <!-- 表單內容 -->
      <slot />

      <!-- 頁尾連結 -->
      <div class="mt-6 text-center text-sm">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
