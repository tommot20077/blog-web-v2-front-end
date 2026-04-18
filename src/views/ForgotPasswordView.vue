<script setup lang="ts">
/**
 * 忘記密碼頁面
 * 使用者輸入 Email 後發送重設密碼連結
 */
import { reactive, ref } from 'vue'
import { useFormValidation } from '../composables/useFormValidation'
import { useToast } from '../composables/useToast'
import { authService } from '../api/authService'
import AuthFormLayout from '../components/auth/AuthFormLayout.vue'
import FormField from '../components/ui/FormField.vue'

interface ForgotPasswordForm {
  email: string
}

const form = reactive<ForgotPasswordForm>({
  email: '',
})

const isSubmitting = ref(false)
const isSuccess = ref(false)

const { showToast } = useToast()

const { errors, validateForm } = useFormValidation<ForgotPasswordForm>({
  email: [
    { type: 'required', message: '請輸入 Email' },
    { type: 'email', message: '請輸入有效的 Email' },
  ],
})

const handleSubmit = async () => {
  if (!validateForm(form)) return

  isSubmitting.value = true
  try {
    await authService.forgotPassword(form.email)
    isSuccess.value = true
  } catch (error) {
    const message = error instanceof Error ? error.message : '發送失敗，請稍後再試'
    showToast(message, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthFormLayout
    title="忘記密碼"
    subtitle="請輸入您的 Email，我們將寄送重設連結"
    heroTitle="Reset your<br>password."
    heroTagline="MY BLOG WEB. — EST 2023"
    titleTestId="auth-forgot-title"
  >
    <!-- 成功訊息 -->
    <div
      v-if="isSuccess"
      class="rounded-xl p-4 text-center text-sm"
      style="background: rgba(34, 197, 94, 0.1); color: rgb(34, 197, 94)"
    >
      重設密碼連結已寄出，請查看信箱
    </div>

    <!-- 表單 -->
    <form
      v-else
      @submit.prevent="handleSubmit"
    >
      <div class="flex flex-col gap-4">
        <FormField
          data-testid="auth-forgot-field-email"
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="請輸入您的 Email"
          :error="errors.email"
          :disabled="isSubmitting"
        />

        <button
          data-testid="auth-forgot-submit"
          type="submit"
          class="w-full rounded-full py-2.5 text-sm font-medium text-white transition-opacity"
          style="background: var(--accent)"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? '發送中...' : '發送重設連結' }}
        </button>
      </div>
    </form>

    <template #footer>
      <RouterLink
        data-testid="auth-forgot-alt-link"
        to="/login"
        class="opacity-70 hover:opacity-100 transition-opacity"
        style="color: var(--ink)"
      >
        回到登入
      </RouterLink>
    </template>
  </AuthFormLayout>
</template>
