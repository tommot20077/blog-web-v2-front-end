<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import NavigationBar from './components/layout/NavigationBar.vue'
import AppFooter from './components/layout/AppFooter.vue'
import MobileBottomNav from './components/layout/MobileBottomNav.vue'
import ToastContainer from './components/ui/ToastContainer.vue'

const authStore = useAuthStore()
const router = useRouter()

const onGlobalKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    // Don't trigger when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    e.preventDefault()
    if (router.currentRoute.value.path !== '/search') router.push('/search')
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onGlobalKeyDown)
  try {
    await authStore.refreshToken()
  } catch {
    // 靜默失敗，使用者未登入
  }
})

onUnmounted(() => window.removeEventListener('keydown', onGlobalKeyDown))
</script>

<template>
  <div class="min-h-screen relative font-sans flex flex-col">
    <!-- 導覽列 -->
    <NavigationBar />

    <!-- 路由視圖出口 -->
    <div class="flex-1 w-full flex flex-col relative pb-16 md:pb-0">
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <div :key="route.path" class="w-full flex-1 flex flex-col">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </div>

    <!-- Footer -->
    <AppFooter />

    <!-- 手機底部導覽列 -->
    <MobileBottomNav />

    <!-- Toast 通知容器 -->
    <ToastContainer />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
