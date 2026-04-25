<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useAppearance } from './composables/useAppearance'
import { useCursor } from './composables/useCursor'
import NavigationBar from './components/layout/NavigationBar.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ToastContainer from './components/ui/ToastContainer.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Global appearance + cursor
useAppearance()
useCursor()

const isShellOrFull = computed(() =>
  route.meta.layout === 'shell' || route.meta.layout === 'full'
)

const onGlobalKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    const target = e.target
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof Element &&
        (target.closest('[contenteditable="true"]') || target.closest('.cm-editor')))
    ) return
    e.preventDefault()
    if (router.currentRoute.value.path !== '/search') router.push('/search')
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onGlobalKeyDown)
  try {
    await authStore.refreshToken()
  } catch {
    // silent fail — user not logged in
  }
})

onUnmounted(() => window.removeEventListener('keydown', onGlobalKeyDown))
</script>

<template>
  <!-- Toast always global -->
  <ToastContainer />

  <!-- Shell / Full-screen pages (my-articles, settings, editor) -->
  <template v-if="isShellOrFull">
    <router-view />
  </template>

  <!-- Default public layout (navbar + content + footer) -->
  <template v-else>
    <NavigationBar />
    <router-view v-slot="{ Component, route: r }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="r.path" />
      </transition>
    </router-view>
    <AppFooter />
  </template>
</template>
