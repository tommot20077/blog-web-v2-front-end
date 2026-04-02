<script setup lang="ts">
/**
 * 信箱驗證頁面
 * 從 URL 取得 token 後自動進行驗證
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '../api/authService'
import AuthFormLayout from '../components/auth/AuthFormLayout.vue'

const route = useRoute()

const token = computed(() => {
  const t = route.query.token
  return typeof t === 'string' ? t : ''
})

const isLoading = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')

const verify = async () => {
  if (!token.value) return

  isLoading.value = true
  try {
    await authService.verifyEmail(token.value)
    isSuccess.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '驗證發生未知錯誤'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  verify()
})
</script>

<template>
  <AuthFormLayout title="信箱驗證">
    <!-- 無 token -->
    <div
      v-if="!token"
      class="rounded-xl p-4 text-center text-sm text-red-500"
      style="background: rgba(239, 68, 68, 0.1)"
    >
      無效的驗證連結
    </div>

    <!-- 載入中 -->
    <div
      v-else-if="isLoading"
      class="text-center text-sm"
      style="color: var(--text-main)"
    >
      驗證中...
    </div>

    <!-- 成功 -->
    <div
      v-else-if="isSuccess"
      class="flex flex-col items-center gap-4"
    >
      <div
        class="rounded-xl p-4 text-center text-sm"
        style="background: rgba(34, 197, 94, 0.1); color: rgb(34, 197, 94)"
      >
        信箱驗證成功！
      </div>
      <RouterLink
        to="/login"
        class="text-sm opacity-70 hover:opacity-100 transition-opacity"
        style="color: var(--accent-color)"
      >
        前往登入
      </RouterLink>
    </div>

    <!-- 失敗 -->
    <div
      v-else-if="errorMessage"
      class="flex flex-col items-center gap-4"
    >
      <div
        class="rounded-xl p-4 text-center text-sm text-red-500"
        style="background: rgba(239, 68, 68, 0.1)"
      >
        <p class="font-medium">驗證失敗</p>
        <p class="mt-1 opacity-70">{{ errorMessage }}</p>
      </div>
      <button
        class="text-sm opacity-70 hover:opacity-100 transition-opacity"
        style="color: var(--accent-color)"
        @click="verify"
      >
        重新發送驗證信
      </button>
    </div>
  </AuthFormLayout>
</template>
