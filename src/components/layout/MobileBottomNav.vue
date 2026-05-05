<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '../../composables/useToast';
import { useAuthStore } from '../../stores/auth';
import ThemeSwitcher from './ThemeSwitcher.vue';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const authStore = useAuthStore();

const tabs = [
  { key: 'home', label: '首頁', to: '/', icon: 'home' },
  { key: 'articles', label: '文章', to: '/articles', icon: 'document' },
  { key: 'search', label: '搜尋', to: '/search', icon: 'search' },
  { key: 'profile', label: '我的', to: null, icon: 'user' },
] as const;

function isActive(tab: typeof tabs[number]): boolean {
  if (!tab.to) return false;
  if (tab.to === '/') return route.path === '/';
  return route.path.startsWith(tab.to);
}

function handleTabClick(tab: typeof tabs[number]) {
  if (tab.key === 'profile') {
    if (authStore.isAuthenticated) {
      router.push('/my-articles');
    } else {
      router.push('/login');
    }
    return;
  }

  if (tab.to) {
    router.push(tab.to);
  } else {
    showToast('即將推出', 'info');
  }
}
</script>

<template>
  <nav
    data-testid="mobile-bottom-nav"
    class="fixed bottom-0 left-0 right-0 z-50 border-t"
    style="background: var(--glass); border-color: var(--glass-border); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
  >
    <div class="absolute top-1 right-2">
      <ThemeSwitcher />
    </div>
    <div class="flex items-center justify-around py-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        data-testid="nav-tab"
        class="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors duration-200"
        :class="isActive(tab) ? 'text-[var(--accent)]' : 'opacity-50'"
        @click="handleTabClick(tab)"
      >
        <!-- 首頁 icon -->
        <svg v-if="tab.icon === 'home'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
        </svg>
        <!-- 文章 icon -->
        <svg v-else-if="tab.icon === 'document'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <!-- 搜尋 icon -->
        <svg v-else-if="tab.icon === 'search'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <!-- 我的 icon -->
        <svg v-else-if="tab.icon === 'user'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-[10px] font-medium">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* 對齊 Tailwind 預設 md breakpoint (768px)：與 md:hidden 行為一致 */
@media (min-width: 768px) {
  nav {
    display: none;
  }
}
</style>
