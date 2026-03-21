<script setup lang="ts">
import type { ZoneEntry } from '../../api/mock/data';

defineProps<{
  zone: ZoneEntry;
}>();
</script>

<template>
  <div
    class="relative rounded-[24px] border overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-300 min-h-[200px]"
    style="border-color: var(--glass-border);"
  >
    <!-- 背景圖 -->
    <img
      :src="zone.coverImageUrl"
      :alt="zone.name"
      loading="lazy"
      class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
    />
    <!-- 遮罩 -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <!-- 文字內容 -->
    <div class="relative z-10 flex flex-col justify-end h-full p-6 text-white">
      <h3 class="text-2xl font-bold mb-1">{{ zone.name }}</h3>
      <p class="text-sm opacity-80 mb-2">{{ zone.description }}</p>
      <span class="text-xs opacity-60">{{ zone.articleCount }} 篇文章</span>
    </div>
  </div>
</template>
