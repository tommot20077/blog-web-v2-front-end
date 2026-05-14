import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export function useAuthWall() {
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  function requireAuth(): boolean {
    if (authStore.isAuthenticated) return true
    authStore.setReturnUrl(route.fullPath)
    router.push('/login')
    return false
  }

  return { requireAuth }
}
