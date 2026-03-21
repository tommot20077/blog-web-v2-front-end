/**
 * Auth Store 最小佔位（stub）
 *
 * 提供 apiClient interceptor 所需的介面。
 * 此檔案將在 Task 8 中被完整實作取代。
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  /** 存於記憶體的 Access Token，絕不寫入 localStorage */
  const accessToken = ref<string | null>(null)

  /** 嘗試使用 HttpOnly cookie 刷新 access token */
  async function refreshToken(): Promise<string> {
    // stub：Task 8 實作
    throw new Error('refreshToken not implemented')
  }

  /** 登出並清除狀態 */
  function logout() {
    accessToken.value = null
  }

  return { accessToken, refreshToken, logout }
})
