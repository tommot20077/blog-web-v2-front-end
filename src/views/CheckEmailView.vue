<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '../api/authService'
import AuthFormLayout from '../components/auth/AuthFormLayout.vue'
import FormField from '../components/ui/FormField.vue'
import { useFormValidation } from '../composables/useFormValidation'

interface CheckEmailForm extends Record<string, unknown> {
  email: string
  code: string
}

type VerificationFeedback = {
  type: 'success' | 'error'
  message: string
}

const route = useRoute()
const router = useRouter()
const initialEmail = typeof route.query.email === 'string' ? route.query.email : ''

const form = reactive<CheckEmailForm>({
  email: initialEmail,
  code: '',
})

const isSubmitting = ref(false)
const isVerifying = ref(false)
const codeError = ref<string | null>(null)
const verificationFeedback = ref<VerificationFeedback | null>(null)

const { errors, validateForm } = useFormValidation<CheckEmailForm>({
  email: [
    { type: 'required', message: '請輸入 Email' },
    { type: 'email', message: '請輸入有效的 Email' },
  ],
})

async function handleResend() {
  if (!validateForm(form)) return

  verificationFeedback.value = null
  isSubmitting.value = true
  try {
    await authService.resendVerification(form.email)
    verificationFeedback.value = {
      type: 'success',
      message: '驗證信已重新發送，請查看信箱',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '重發驗證信失敗，請稍後再試'
    verificationFeedback.value = { type: 'error', message }
  } finally {
    isSubmitting.value = false
  }
}

async function handleVerifyCode() {
  if (!validateForm(form)) return
  if (!/^\d{6}$/.test(form.code)) {
    codeError.value = '請輸入 6 位數驗證碼'
    verificationFeedback.value = null
    return
  }

  codeError.value = null
  verificationFeedback.value = null
  isVerifying.value = true
  try {
    await authService.verifyEmailCode(form.email, form.code)
    await router.push('/login')
  } catch (error) {
    const message = error instanceof Error ? error.message : '驗證碼無效或已過期'
    codeError.value = message
  } finally {
    isVerifying.value = false
  }
}
</script>

<template>
  <AuthFormLayout
    title="檢查信箱"
    subtitle="驗證信已寄出，請完成信箱驗證後再登入"
    heroTitle="Check your<br>email."
    heroTagline="MY BLOG WEB. — EST 2023"
    titleTestId="auth-check-email-title"
  >
    <Teleport to="body">
      <div
        data-testid="auth-check-email-overlay"
        class="verification-overlay"
      >
        <div
          data-testid="auth-check-email-backdrop"
          class="verification-backdrop"
        />

        <section
          data-testid="auth-check-email-card"
          class="verification-card"
        >
          <div class="verification-card__header">
            <p class="verification-card__eyebrow">Email verification</p>
            <h2
              data-testid="auth-check-email-card-heading"
              class="verification-card__title"
            >
              完成信箱驗證
            </h2>
            <p class="verification-card__copy">我們已將驗證信寄到</p>
            <p
              data-testid="auth-check-email-address"
              class="check-email-address"
            >
              {{ form.email || '你的註冊信箱' }}
            </p>
          </div>

          <form
            class="verification-card__form"
            @submit.prevent="handleVerifyCode"
          >
            <FormField
              data-testid="auth-check-email-field"
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="請輸入註冊 Email"
              :error="errors.email"
              :disabled="isSubmitting || isVerifying"
            />

            <FormField
              data-testid="auth-check-email-code-field"
              v-model="form.code"
              label="驗證碼"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="請輸入 6 位數驗證碼"
              :error="codeError"
              :disabled="isVerifying"
            />

            <p
              v-if="verificationFeedback"
              data-testid="auth-check-email-feedback"
              class="verification-card__feedback"
              :class="`verification-card__feedback--${verificationFeedback.type}`"
              :role="verificationFeedback.type === 'error' ? 'alert' : 'status'"
            >
              {{ verificationFeedback.message }}
            </p>

            <div class="verification-card__actions">
              <button
                data-testid="auth-check-email-verify-code"
                type="submit"
                class="auth-submit-btn"
                :disabled="isVerifying"
              >
                {{ isVerifying ? '驗證中...' : '完成驗證' }}
              </button>

              <button
                data-testid="auth-check-email-resend"
                type="button"
                class="auth-secondary-btn"
                :disabled="isSubmitting"
                @click="handleResend"
              >
                {{ isSubmitting ? '發送中...' : '重新發送驗證信' }}
              </button>
            </div>
          </form>

          <RouterLink
            data-testid="auth-check-email-login-link"
            to="/login"
            class="auth-card-link"
          >
            回到登入
          </RouterLink>
        </section>
      </div>
    </Teleport>

    <template #footer>
      <div class="auth-footer-placeholder" aria-hidden="true" />
    </template>
  </AuthFormLayout>
</template>

<style scoped>
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
.verification-card__form {
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

.check-email-address {
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
  width: 100%;
  padding: 14px 24px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--bg);
  border: none;
  cursor: pointer;
  font-family: var(--f-mono);
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  transition: opacity .2s;
  margin-top: 8px;
}

.auth-submit-btn:hover {
  opacity: .85;
}

.auth-submit-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

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

.auth-card-link {
  align-self: center;
  font-size: 13.5px;
  color: var(--accent);
  text-decoration: none;
  transition: opacity .2s;
}

.auth-card-link:hover {
  opacity: .75;
}

.auth-footer-placeholder {
  display: none;
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
