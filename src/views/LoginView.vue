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
import { authService } from '../api/authService'

// LoginForm 用於 UI 驗證（僅支援 email 格式輸入）
// API payload 使用 identifier 欄位，後端同時支援 email 或 username 登入
interface LoginForm extends Record<string, unknown> {
  email: string
  password: string
}

type VerificationFeedback = {
  type: 'success' | 'error'
  message: string
}

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const email = ref('')
const password = ref('')
const verificationCode = ref('')
const pendingVerificationEmail = ref('')
const showVerificationCard = ref(false)
const isSubmitting = ref(false)
const isResendingVerification = ref(false)
const isVerifyingCode = ref(false)
const verificationCodeError = ref<string | null>(null)
const verificationFeedback = ref<VerificationFeedback | null>(null)

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
    if (message.includes('請先驗證電子信箱')) {
      pendingVerificationEmail.value = email.value
      showVerificationCard.value = true
      verificationCodeError.value = null
      verificationFeedback.value = null
      return
    }
    showToast(message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

async function handleResendVerification() {
  if (!pendingVerificationEmail.value) return

  verificationFeedback.value = null
  isResendingVerification.value = true
  try {
    await authService.resendVerification(pendingVerificationEmail.value)
    verificationFeedback.value = {
      type: 'success',
      message: '驗證信已重新發送，請查看信箱',
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '重發驗證信失敗，請稍後再試'
    verificationFeedback.value = { type: 'error', message }
  } finally {
    isResendingVerification.value = false
  }
}

async function handleVerifyCode() {
  if (!pendingVerificationEmail.value) return
  if (!/^\d{6}$/.test(verificationCode.value)) {
    verificationCodeError.value = '請輸入 6 位數驗證碼'
    verificationFeedback.value = null
    return
  }

  verificationCodeError.value = null
  verificationFeedback.value = null
  isVerifyingCode.value = true
  try {
    await authService.verifyEmailCode(pendingVerificationEmail.value, verificationCode.value)
    showToast('信箱驗證成功，請重新登入', 'success')
    showVerificationCard.value = false
    verificationCode.value = ''
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '驗證碼無效或已過期'
    verificationCodeError.value = message
  } finally {
    isVerifyingCode.value = false
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
    <form @submit.prevent="handleSubmit" class="auth-form">
      <FormField
        data-testid="auth-login-field-email"
        label="Email"
        type="email"
        :model-value="email"
        :error="errors.email"
        placeholder="請輸入 Email"
        :disabled="isSubmitting"
        @update:model-value="email = $event"
      />

      <FormField
        data-testid="auth-login-field-password"
        label="密碼"
        type="password"
        :model-value="password"
        :error="errors.password"
        placeholder="請輸入密碼"
        :disabled="isSubmitting"
        @update:model-value="password = $event"
      />

      <button
        data-testid="auth-login-submit"
        type="submit"
        :disabled="isSubmitting"
        class="auth-submit-btn"
      >
        {{ isSubmitting ? '登入中...' : '登入' }}
      </button>
    </form>

    <Teleport to="body">
      <div
        v-if="showVerificationCard"
        data-testid="auth-login-verification-overlay"
        class="verification-overlay"
      >
        <div
          data-testid="auth-login-verification-backdrop"
          class="verification-backdrop"
        />

        <section
          data-testid="auth-login-verification-card"
          class="verification-card"
        >
          <div class="verification-card__header">
            <p class="verification-card__eyebrow">Email verification</p>
            <h2
              data-testid="auth-login-verification-heading"
              class="verification-card__title"
            >
              完成信箱驗證
            </h2>
            <p class="verification-card__copy">這個帳號還沒有完成信箱驗證</p>
            <p
              data-testid="auth-login-verification-email"
              class="verification-email"
            >
              {{ pendingVerificationEmail }}
            </p>
          </div>

          <form
            class="verification-code-form"
            @submit.prevent="handleVerifyCode"
          >
            <FormField
              data-testid="auth-login-code-field"
              v-model="verificationCode"
              label="驗證碼"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="請輸入 6 位數驗證碼"
              :error="verificationCodeError"
              :disabled="isVerifyingCode"
            />

            <p
              v-if="verificationFeedback"
              data-testid="auth-login-verification-feedback"
              class="verification-card__feedback"
              :class="`verification-card__feedback--${verificationFeedback.type}`"
              :role="verificationFeedback.type === 'error' ? 'alert' : 'status'"
            >
              {{ verificationFeedback.message }}
            </p>

            <div class="verification-card__actions">
              <button
                data-testid="auth-login-verify-code"
                type="submit"
                class="auth-submit-btn"
                :disabled="isVerifyingCode"
              >
                {{ isVerifyingCode ? '驗證中...' : '完成驗證' }}
              </button>

              <button
                data-testid="auth-login-resend-verification"
                type="button"
                class="auth-secondary-btn"
                :disabled="isResendingVerification"
                @click="handleResendVerification"
              >
                {{ isResendingVerification ? '發送中...' : '重新發送驗證信' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>

    <template #footer>
      <div class="auth-footer-links">
        <RouterLink data-testid="auth-login-forgot-link" to="/forgot-password" class="auth-link">
          忘記密碼？
        </RouterLink>
        <RouterLink data-testid="auth-login-alt-link" to="/register" class="auth-link">
          還沒有帳號？註冊
        </RouterLink>
      </div>
    </template>
  </AuthFormLayout>
</template>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 28px; }
.verification-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 24px;
  isolation: isolate;
}
.verification-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.12), transparent 34%),
    rgba(10, 10, 11, 0.68);
  backdrop-filter: blur(7px);
}
.verification-card {
  position: relative;
  z-index: 1;
  width: min(100%, 430px);
  max-height: calc(100vh - 48px);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 30px;
  border: 1px solid color-mix(in srgb, var(--border, rgba(10, 10, 11, 0.10)) 70%, white 30%);
  border-radius: 24px;
  background: color-mix(in srgb, var(--bg, #f4f4f4) 94%, white 6%);
  box-shadow: 0 28px 86px rgba(0, 0, 0, 0.34);
}
.verification-card__header,
.verification-code-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.verification-card__eyebrow {
  margin: 0;
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--accent);
}
.verification-card__title {
  margin: 0;
  font-family: var(--f-display, system-ui, sans-serif);
  font-size: 28px;
  font-weight: 500;
  line-height: 1.12;
  color: var(--ink);
}
.verification-card__copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}
.verification-email {
  margin: 0;
  color: var(--ink);
  font-weight: 700;
  word-break: break-word;
}
.verification-card__actions {
  display: grid;
  gap: 12px;
}
.verification-card__feedback {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
}
.verification-card__feedback--success {
  border: 1px solid rgba(34, 197, 94, 0.28);
  background: rgba(34, 197, 94, 0.10);
  color: #15803d;
}
.verification-card__feedback--error {
  border: 1px solid rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.10);
  color: #b91c1c;
}
.auth-submit-btn {
  width: 100%; padding: 14px 24px; border-radius: 999px;
  background: var(--ink); color: var(--bg); border: none; cursor: pointer;
  font-family: var(--f-mono); font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
  transition: opacity .2s; margin-top: 8px;
}
.auth-submit-btn:hover { opacity: .85; }
.auth-submit-btn:disabled { opacity: .4; cursor: not-allowed; }
.auth-footer-links { display: flex; flex-direction: column; gap: 10px; }
.auth-link { font-size: 13.5px; color: var(--accent); text-decoration: none; transition: opacity .2s; }
.auth-link:hover { opacity: .75; }
.auth-secondary-btn {
  width: 100%;
  padding: 13px 24px;
  border-radius: 999px;
  border: 1px solid var(--border-strong, rgba(10, 10, 11, 0.18));
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-family: var(--f-mono);
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  transition: opacity .2s, transform .2s, border-color .2s;
}
.auth-secondary-btn:hover {
  opacity: .82;
  transform: translateY(-1px);
  border-color: var(--ink);
}
.auth-secondary-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
  transform: none;
}
@media (max-width: 480px) {
  .verification-overlay {
    padding: 18px;
  }

  .verification-card {
    padding: 24px;
    border-radius: 20px;
  }
}
</style>
