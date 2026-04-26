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
  <AuthFormLayout
    title="信箱驗證"
    heroTitle="Verify your<br>email."
    heroTagline="MY BLOG WEB. — EST 2023"
    titleTestId="auth-verify-title"
  >
    <!-- 無 token -->
    <div
      v-if="!token"
      data-testid="auth-verify-no-token"
      class="auth-msg auth-msg-error"
    >
      無效的驗證連結
    </div>

    <!-- 載入中 -->
    <div
      v-else-if="isLoading"
      class="auth-msg auth-msg-info"
    >
      驗證中...
    </div>

    <!-- 成功 -->
    <div
      v-else-if="isSuccess"
      data-testid="auth-verify-success"
      class="auth-form"
    >
      <div class="auth-msg auth-msg-success">
        信箱驗證成功！
      </div>
      <RouterLink
        to="/login"
        class="auth-link"
      >
        前往登入
      </RouterLink>
    </div>

    <!-- 失敗 -->
    <div
      v-else-if="errorMessage"
      data-testid="auth-verify-failure"
      class="auth-form"
    >
      <div class="auth-msg auth-msg-error">
        <p style="font-weight:600">驗證失敗</p>
        <p style="opacity:.7;margin-top:4px">{{ errorMessage }}</p>
      </div>
      <button
        data-testid="auth-verify-resend-btn"
        class="auth-link"
        style="background:none;border:none;cursor:pointer;padding:0"
        @click="verify"
      >
        重新發送驗證信
      </button>
    </div>
  </AuthFormLayout>
</template>
