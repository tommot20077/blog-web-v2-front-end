/**
 * Auth Store — 認證狀態管理
 *
 * 管理使用者認證狀態，包含：
 * - access token（記憶體存放，不寫入 localStorage）
 * - 使用者資料
 * - 角色判斷（isAdmin, isAuthor）
 * - 登入後重導向 URL
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '../api/authService'
import type { User, LoginPayload, RegisterPayload } from '../types/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const returnUrl = ref<string | null>(null)
  const isHydrated = ref(false)
  let hydrationPromise: Promise<void> | null = null

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isAuthor = computed(() => user.value?.role === 'AUTHOR' || isAdmin.value)
  const userRole = computed(() => user.value?.role ?? null)

  function clearState() {
    user.value = null
    accessToken.value = null
    returnUrl.value = null
  }

  // Actions
  async function login(payload: LoginPayload) {
    const tokens = await authService.login(payload)
    accessToken.value = tokens.accessToken
    await fetchUser()
    isHydrated.value = true
    const redirect = returnUrl.value
    returnUrl.value = null
    return redirect
  }

  async function register(payload: RegisterPayload) {
    await authService.register(payload)
  }

  async function logout() {
    try { await authService.logout() } catch { /* 忽略登出 API 錯誤 */ }
    clearState()
    isHydrated.value = true
  }

  async function refreshToken() {
    const tokens = await authService.refresh()
    accessToken.value = tokens.accessToken
    await fetchUser()
    isHydrated.value = true
  }

  async function fetchUser() {
    user.value = await authService.getMe()
  }

  async function ensureHydrated() {
    if (accessToken.value) {
      isHydrated.value = true
      return
    }
    if (isHydrated.value) return
    if (hydrationPromise) return hydrationPromise

    hydrationPromise = (async () => {
      try {
        await refreshToken()
      } catch {
        clearState()
        isHydrated.value = true
      } finally {
        hydrationPromise = null
      }
    })()

    return hydrationPromise
  }

  function setReturnUrl(url: string | null) {
    returnUrl.value = url
  }

  return {
    user,
    accessToken,
    returnUrl,
    isHydrated,
    isAuthenticated,
    isAdmin,
    isAuthor,
    userRole,
    login,
    register,
    logout,
    refreshToken,
    fetchUser,
    ensureHydrated,
    setReturnUrl,
  }
})
