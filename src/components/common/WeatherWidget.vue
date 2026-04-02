<script setup lang="ts">
import { useWeather } from '../../composables/useWeather';

const { temperature, condition, isLoading } = useWeather();
</script>

<template>
  <div 
    class="flex items-center gap-3 px-4 py-2 rounded-full border transition-all hover:scale-105 cursor-pointer"
    style="background: var(--glass-panel); border-color: var(--glass-border); backdrop-filter: blur(12px); color: var(--text-main);"
    title="今日天氣"
  >
    <!-- 若為 Loading 狀態 -->
    <div v-if="isLoading" class="animate-pulse w-5 h-5 bg-gray-400/50 rounded-full"></div>
    
    <!-- 簡單的天氣圖示 (此處使用晴天的手寫 SVG 作為示意，未來可依據 condition 替換不同 Icon) -->
    <svg v-else class="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4V2M12 22V20M4 12H2M22 12H20M17.6569 6.34315L19.0711 4.92893M4.92893 19.0711L6.34315 17.6569M6.34315 6.34315L4.92893 4.92893M19.0711 19.0711L17.6569 17.6569M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <!-- 天氣文字資訊 -->
    <div class="flex flex-col">
      <span v-if="isLoading" class="text-xs font-medium opacity-60">讀取中...</span>
      <template v-else>
        <div class="flex items-baseline gap-1">
          <span class="text-sm font-bold tracking-wider leading-none">{{ temperature }}°C</span>
          <span class="text-[10px] font-medium opacity-70 uppercase tracking-widest">{{ condition }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
