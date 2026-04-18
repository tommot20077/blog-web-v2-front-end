<script setup lang="ts">
/**
 * LoginView — 登入頁面
 *
 * 使用 AuthFormLayout 佈局，包含 Email / 密碼欄位、
 * 表單驗證、登入 API 呼叫、成功後重導向。
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthFormLayout from '../components/auth/AuthFormLayout.vue'
import FormField from '../components/ui/FormField.vue'
import { useFormValidation } from '../composables/useFormValidation'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

// LoginForm 用於 UI 驗證（僅支援 email 格式輸入）
// API payload 使用 identifier 欄位，後端同時支援 email 或 username 登入
interface LoginForm {
  email: string
  password: string
}

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

const { errors, validateForm } = useFormValidation<LoginForm>({
  email: [
    { type: 'required' },
    { type: 'email' },
  ],
  password: [
    { type: 'required' },
    { type: 'minLength', params: { min: 8 } },
  ],
})

async function handleSubmit() {
  const valid = validateForm({ email: email.value, password: password.value })
  if (!valid) return

  isSubmitting.value = true
  try {
    const redirect = await authStore.login({ identifier: email.value, password: password.value })
    router.push(redirect || '/')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登入失敗'
    showToast(message, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthFormLayout
    title="登入"
    subtitle="歡迎回來"
    heroTitle="Sign in to<br>your account."
    heroTagline="MY BLOG WEB. — EST 2023"
    titleTestId="auth-login-title"
  >
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
      <div data-testid="auth-login-field-email">
        <FormField
          label="Email"
          type="email"
          :model-value="email"
          :error="errors.email"
          placeholder="請輸入 Email"
          :disabled="isSubmitting"
          @update:model-value="email = $event"
        />
      </div>

      <div data-testid="auth-login-field-password">
        <FormField
          label="密碼"
          type="password"
          :model-value="password"
          :error="errors.password"
          placeholder="請輸入密碼"
          :disabled="isSubmitting"
          @update:model-value="password = $event"
        />
      </div>

      <button
        data-testid="auth-login-submit"
        type="submit"
        :disabled="isSubmitting"
        class="mt-2 w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style="background: var(--accent)"
      >
        {{ isSubmitting ? '登入中...' : '登入' }}
      </button>
    </form>

    <template #footer>
      <div class="flex flex-col gap-2">
        <RouterLink
          to="/forgot-password"
          class="opacity-70 hover:opacity-100 transition-opacity"
          style="color: var(--accent)"
        >
          忘記密碼？
        </RouterLink>
        <RouterLink
          data-testid="auth-login-alt-link"
          to="/register"
          class="opacity-70 hover:opacity-100 transition-opacity"
          style="color: var(--accent)"
        >
          還沒有帳號？註冊
        </RouterLink>
      </div>
    </template>
  </AuthFormLayout>
</template>
