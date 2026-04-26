<script setup lang="ts">
/**
 * 重設密碼頁面
 * 使用者透過 URL 中的 token 重設密碼
 */
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormValidation } from '../composables/useFormValidation'
import { useToast } from '../composables/useToast'
import { authService } from '../api/authService'
import AuthFormLayout from '../components/auth/AuthFormLayout.vue'
import FormField from '../components/ui/FormField.vue'

interface ResetPasswordForm {
  password: string
  confirmPassword: string
}

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const token = computed(() => {
  const t = route.query.token
  return typeof t === 'string' ? t : ''
})

const form = reactive<ResetPasswordForm>({
  password: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)

const { errors, validateForm } = useFormValidation<ResetPasswordForm>({
  password: [
    { type: 'required', message: '請輸入新密碼' },
    { type: 'minLength', message: '密碼至少需要 8 個字元', params: { min: 8 } },
  ],
  confirmPassword: [
    { type: 'required', message: '請確認密碼' },
    { type: 'matchField', message: '兩次輸入不一致', params: { field: 'password' } },
  ],
})

const handleSubmit = async () => {
  if (!validateForm(form)) return

  isSubmitting.value = true
  try {
    await authService.resetPassword(token.value, form.password)
    showToast('密碼重設成功', 'success')
    router.push('/login')
  } catch (error) {
    const message = error instanceof Error ? error.message : '重設失敗，請稍後再試'
    showToast(message, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthFormLayout
    title="重設密碼"
    subtitle="請設定您的新密碼"
    heroTitle="Set a new<br>password."
    heroTagline="MY BLOG WEB. — EST 2023"
    titleTestId="auth-reset-title"
  >
    <!-- 無 token 錯誤 -->
    <div
      v-if="!token"
      data-testid="auth-reset-invalid-token"
      class="auth-msg auth-msg-error"
    >
      無效的重設連結
    </div>

    <!-- 重設表單 -->
    <form
      v-else
      @submit.prevent="handleSubmit"
      class="auth-form"
    >
      <FormField
        data-testid="auth-reset-field-password"
        v-model="form.password"
        label="新密碼"
        type="password"
        placeholder="請輸入新密碼"
        :error="errors.password"
        :disabled="isSubmitting"
      />

      <FormField
        data-testid="auth-reset-field-confirm"
        v-model="form.confirmPassword"
        label="確認密碼"
        type="password"
        placeholder="請再次輸入新密碼"
        :error="errors.confirmPassword"
        :disabled="isSubmitting"
      />

      <button
        data-testid="auth-reset-submit"
        type="submit"
        class="auth-submit-btn"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? '重設中...' : '重設密碼' }}
      </button>
    </form>

    <template #footer>
      <RouterLink
        to="/login"
        class="auth-link"
      >
        回到登入
      </RouterLink>
    </template>
  </AuthFormLayout>
</template>
