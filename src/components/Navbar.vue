<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { adminService } from '../api/adminService'

const authStore = useAuthStore()
const router = useRouter()
const pendingCount = ref(0)

async function fetchPendingCount() {
  pendingCount.value = await adminService.getPendingCount()
}

onMounted(async () => {
  if (authStore.isAdmin) {
    await fetchPendingCount()
  }
})

// isAdmin 變成 true 時重新抓取（例如用戶在 Navbar 保持 mounted 期間角色升級）
watch(() => authStore.isAdmin, (isAdmin) => {
  if (isAdmin) {
    fetchPendingCount()
  } else {
    // 登出或角色降級時清除 badge
    pendingCount.value = 0
  }
})

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <nav class="flex items-center gap-4 px-6 py-3 border-b border-white/80 dark:border-white/15 bg-white/60 backdrop-blur-md dark:bg-white/8">
    <!-- 永遠顯示 -->
    <RouterLink to="/" class="font-medium hover:text-[var(--accent)] transition-colors">
      首頁
    </RouterLink>
    <RouterLink to="/articles" class="font-medium hover:text-[var(--accent)] transition-colors">
      文章
    </RouterLink>

    <!-- 已登入才顯示 -->
    <template v-if="authStore.isAuthenticated">
      <RouterLink to="/my-articles" class="font-medium hover:text-[var(--accent)] transition-colors">
        我的文章
      </RouterLink>
      <RouterLink to="/editor" class="font-medium hover:text-[var(--accent)] transition-colors">
        新建文章
      </RouterLink>

      <!-- 僅 ADMIN -->
      <RouterLink
        v-if="authStore.isAdmin"
        to="/admin/review"
        class="relative font-medium hover:text-[var(--accent)] transition-colors"
      >
        待審核
        <span
          v-if="pendingCount > 0"
          class="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white"
        >
          {{ pendingCount }}
        </span>
      </RouterLink>

      <button
        type="button"
        class="font-medium hover:text-[var(--accent)] transition-colors"
        @click="handleLogout"
      >
        登出
      </button>
    </template>

    <!-- 未登入才顯示 -->
    <RouterLink v-else to="/login" class="font-medium hover:text-[var(--accent)] transition-colors">
      登入
    </RouterLink>
  </nav>
</template>
