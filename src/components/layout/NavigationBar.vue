<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import ThemeSwitcher from './ThemeSwitcher.vue';
import WeatherWidget from '../common/WeatherWidget.vue';

const router = useRouter();
const authStore = useAuthStore();

async function handleLogout() {
  await authStore.logout();
  router.push('/');
}
</script>

<template>
  <!-- 外層容器，設定 pointer-events-none 避免遮擋下方內容，但特定子元素會開啟互動 -->
  <nav class="fixed top-5 left-0 right-0 z-50 flex justify-center px-10 pointer-events-none">

    <!-- 中間的毛玻璃導覽列 (Organism 組件) -->
    <div
      class="pointer-events-auto flex items-center gap-6 px-6 py-3 rounded-full border transition-colors duration-300"
      style="background: var(--glass-panel); border-color: var(--glass-border); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
    >
      <router-link to="/" class="font-medium text-[16px] hover:opacity-70 transition-opacity hidden md:inline">首頁</router-link>
      <router-link to="/articles" class="font-medium text-[16px] hover:opacity-70 transition-opacity hidden md:inline">文章</router-link>
      <!-- Logo 區塊 -->
      <router-link to="/" class="flex items-center gap-2 mx-4 group cursor-pointer decoration-transparent">
        <div class="w-6 h-6 rounded bg-[var(--text-main)] text-[var(--bg-color)] flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110">L</div>
        <span class="font-bold text-[16px] tracking-wide" style="color: var(--text-main)">MY BLOG WEB.</span>
      </router-link>
      <span v-if="authStore.isAuthenticated" class="font-medium text-[16px] hidden md:inline">你好, {{ authStore.user?.nickname }}!</span>
      <button
        v-if="authStore.isAuthenticated"
        class="font-medium text-[16px] pl-4 border-l border-[var(--text-main)]/30 hover:opacity-70 transition-opacity hidden md:inline cursor-pointer"
        @click="handleLogout"
      >登出</button>
      <router-link
        v-if="!authStore.isAuthenticated"
        to="/login"
        class="font-medium text-[16px] pl-4 border-l border-[var(--text-main)]/30 hover:opacity-70 transition-opacity hidden md:inline"
      >登入 / 註冊</router-link>
    </div>

    <!-- 右側的控制區：天氣模組、深淺色切換器 -->
    <div class="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-end gap-1">
      <div class="flex items-center gap-3">
        <WeatherWidget />
        <ThemeSwitcher />
      </div>
      <span class="text-[10px] font-medium opacity-60 tracking-widest hidden md:block pr-2 w-max">太暗嗎？點個燈</span>
    </div>
  </nav>
</template>
