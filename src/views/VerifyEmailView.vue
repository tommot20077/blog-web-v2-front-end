<script setup lang="ts">
/**
 * 信箱驗證頁面
 * 從 URL 取得 token 後自動進行驗證
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '../api/authService'
import AuthFormLayout from '../components/auth/AuthFormLayout.vue'
import FormField from '../components/ui/FormField.vue'

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

// 驗證失敗後的重寄：token 屬憑證且失敗當下多半已過期，無法作為重寄的輸入；
// 後端重寄端點以 email 指認帳號（POST /auth/resend-verification，限流 1/分、5/日）。
const resendEmail = ref('')
const isResending = ref(false)
const resendDone = ref(false)
const resendError = ref('')

const handleResend = async () => {
  if (!resendEmail.value) return

  isResending.value = true
  resendError.value = ''
  try {
    await authService.resendVerification(resendEmail.value)
    resendDone.value = true
  } catch (error) {
    resendError.value = error instanceof Error ? error.message : '重新發送失敗，請稍後再試'
  } finally {
    isResending.value = false
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

      <!-- 重寄成功：中性訊息，避免以「信箱是否存在」洩漏帳號 -->
      <div
        v-if="resendDone"
        data-testid="auth-verify-resend-done"
        class="auth-msg auth-msg-success"
      >
        若該信箱已註冊，我們已重新寄出驗證信，請查收信箱。
      </div>

      <!-- 重寄表單：以 email 指認帳號重寄新驗證信（非重試原 token） -->
      <form
        v-else
        class="auth-form"
        @submit.prevent="handleResend"
      >
        <FormField
          v-model="resendEmail"
          data-testid="auth-verify-resend-email"
          label="Email"
          type="email"
          placeholder="請輸入註冊信箱"
          :error="resendError"
          :disabled="isResending"
        />
        <button
          data-testid="auth-verify-resend-btn"
          type="submit"
          class="auth-link"
          style="background:none;border:none;cursor:pointer;padding:0"
          :disabled="isResending"
        >
          {{ isResending ? '寄送中...' : '重新發送驗證信' }}
        </button>
      </form>
    </div>
  </AuthFormLayout>
</template>
