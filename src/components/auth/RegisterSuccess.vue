<script setup lang="ts">
/**
 * D1「右欄原地切換」：註冊成功後取代跳頁/toast 的持久成功畫面。
 * 左側 hero 保持不動（由 AuthFormLayout 控制），這裡只負責右欄內容。
 */
import { ref } from 'vue';
import { authService } from '../../api/authService';
import { useToast } from '../../composables/useToast';

const props = defineProps<{
  email: string;
}>();

const { showToast } = useToast();
const isResending = ref(false);

async function handleResend() {
  if (isResending.value) return;

  isResending.value = true;
  try {
    // 重寄走既有的 authService.resendVerification（VerifyEmailView 已在用同一支 API），
    // 不自行發明新的後端端點。
    await authService.resendVerification(props.email);
    showToast('已重新寄出驗證信，請查收信箱', 'success');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '重新發送失敗，請稍後再試';
    showToast(message, 'error');
  } finally {
    isResending.value = false;
  }
}
</script>

<template>
  <div
    data-testid="auth-register-success"
    class="success"
  >
    <div class="success__mark">
      <svg viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <span class="success__tag">Step 02 / 02</span>
    <h1 class="success__title">帳號已建立。</h1>
    <p class="success__body">我們寄了一封驗證信到</p>
    <span
      data-testid="auth-register-success-email"
      class="success__mail"
    >{{ email }}</span>

    <div class="success__actions">
      <RouterLink
        data-testid="auth-register-success-login"
        to="/login"
        class="btn-primary"
      >
        前往登入
      </RouterLink>
      <button
        data-testid="auth-register-success-resend"
        type="button"
        class="btn-ghost"
        :disabled="isResending"
        @click="handleResend"
      >
        {{ isResending ? '寄送中...' : '沒收到？重寄驗證信' }}
      </button>
    </div>

    <p class="success__hint">連結 24 小時內有效。記得看看垃圾郵件匣。</p>
  </div>
</template>

<style scoped>
.success {
  width: 100%;
  max-width: 420px;
}

.success__mark {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  display: grid;
  place-items: center;
  margin-bottom: 26px;
}

.success__mark svg {
  width: 19px;
  height: 19px;
  stroke: var(--ok);
  stroke-width: 2.2;
  fill: none;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: auth-success-draw 0.55s var(--ease) 0.15s forwards;
}

@keyframes auth-success-draw {
  to {
    stroke-dashoffset: 0;
  }
}

.success__tag {
  font-family: var(--f-mono);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  display: block;
  margin-bottom: 14px;
}

.success__title {
  font-family: var(--f-display);
  font-weight: 500;
  font-size: 40px;
  line-height: 1.08;
  letter-spacing: -0.028em;
  margin: 0 0 16px;
  color: var(--ink);
}

.success__body {
  color: var(--muted);
  font-size: 14.5px;
  line-height: 1.75;
  margin: 0 0 6px;
  text-wrap: pretty;
}

.success__mail {
  display: inline-block;
  font-family: var(--f-mono);
  font-size: 12.5px;
  color: var(--ink);
  border-bottom: 1px solid var(--border-strong);
  padding-bottom: 1px;
  margin: 6px 0 30px;
}

.success__actions {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.btn-primary {
  display: block;
  width: 100%;
  text-align: center;
  background: var(--ink);
  color: var(--bg);
  padding: 15px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition:
    opacity 0.2s,
    transform 0.25s var(--ease);
}

.btn-primary:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.btn-ghost {
  display: block;
  width: 100%;
  text-align: center;
  padding: 13px;
  border-radius: 999px;
  font-size: 13.5px;
  color: var(--muted);
  border: 1px solid var(--border);
  background: none;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.btn-ghost:hover {
  border-color: var(--border-strong);
  color: var(--ink);
}

.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success__hint {
  font-size: 12.5px;
  color: var(--muted);
  margin: 22px 0 0;
  line-height: 1.7;
  text-wrap: pretty;
}
</style>
