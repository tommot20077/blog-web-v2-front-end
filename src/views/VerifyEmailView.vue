<script setup lang="ts">
/**
 * 信箱驗證頁面
 * 從 URL 取得 token 後自動進行驗證
 *
 * token 屬憑證，於進入頁面時一次性讀入並立即從網址移除，避免留在瀏覽器
 * 歷史、書籤或被連結分享出去。故 token 存為 ref 快照而非 route.query 的
 * computed —— 後者會在網址清空後變為空字串，使畫面誤判為「無效連結」。
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '../api/authService'
import AuthFormLayout from '../components/auth/AuthFormLayout.vue'

const route = useRoute()
const router = useRouter()

const initialToken = route.query.token
const token = ref(typeof initialToken === 'string' ? initialToken : '')

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
  if (token.value) {
    // 與 verify 各自獨立，不 await：清網址不應延後驗證送出
    const { token: _omitted, ...rest } = route.query
    void router.replace({ query: rest })
  }
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
