<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useFormValidation } from '../composables/useFormValidation';
import { useToast } from '../composables/useToast';
import AuthFormLayout from '../components/auth/AuthFormLayout.vue';
import FormField from '../components/ui/FormField.vue';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter.vue';

const router = useRouter();
const authStore = useAuthStore();
const { showToast } = useToast();

/** 表單欄位 */
const email = ref('');
const username = ref('');
const nickname = ref('');
const password = ref('');

/** 載入狀態 */
const isLoading = ref(false);

/** 表單驗證 */
const { errors, validateForm, getPasswordStrength } = useFormValidation<{
  email: string;
  username: string;
  nickname: string;
  password: string;
}>({
  email: [
    { type: 'required', message: '請輸入 Email' },
    { type: 'email', message: '請輸入有效的 Email' },
  ],
  username: [
    { type: 'required', message: '請輸入使用者名稱' },
    { type: 'minLength', message: '使用者名稱最少需要 3 個字元', params: { min: 3 } },
  ],
  nickname: [
    { type: 'required', message: '請輸入暱稱' },
    { type: 'minLength', message: '暱稱最少需要 2 個字元', params: { min: 2 } },
  ],
  password: [
    { type: 'required', message: '請輸入密碼' },
    { type: 'minLength', message: '密碼最少需要 8 個字元', params: { min: 8 } },
  ],
});

/** 密碼強度 */
const passwordStrength = computed(() => {
  if (!password.value) return null;
  return getPasswordStrength(password.value);
});

/** 提交註冊 */
async function handleSubmit() {
  const formData = {
    email: email.value,
    username: username.value,
    nickname: nickname.value,
    password: password.value,
  };

  if (!validateForm(formData)) return;

  isLoading.value = true;
  try {
    await authStore.register(formData);
    showToast('註冊成功！請至信箱驗證您的帳號', 'success');
    await router.push('/login');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '註冊失敗，請稍後再試';
    showToast(message, 'error');
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <AuthFormLayout
    title="註冊"
    subtitle="建立您的帳號"
    heroTitle="Start writing<br>your story."
    heroTagline="MY BLOG WEB. — EST 2023"
    titleTestId="auth-register-title"
  >
    <form
      class="flex flex-col gap-4"
      @submit.prevent="handleSubmit"
    >
      <FormField
        data-testid="auth-register-field-email"
        v-model="email"
        label="Email"
        type="email"
        placeholder="請輸入 Email"
        :error="errors.email"
        :disabled="isLoading"
      />

      <FormField
        data-testid="auth-register-field-username"
        v-model="username"
        label="使用者名稱"
        type="text"
        placeholder="請輸入使用者名稱（英文、數字）"
        :error="errors.username"
        :disabled="isLoading"
      />

      <FormField
        data-testid="auth-register-field-nickname"
        v-model="nickname"
        label="暱稱"
        type="text"
        placeholder="請輸入暱稱"
        :error="errors.nickname"
        :disabled="isLoading"
      />

      <FormField
        data-testid="auth-register-field-password"
        v-model="password"
        label="密碼"
        type="password"
        placeholder="請輸入密碼"
        :error="errors.password"
        :disabled="isLoading"
      />

      <PasswordStrengthMeter :strength="passwordStrength" />

      <button
        data-testid="auth-register-submit"
        type="submit"
        :disabled="isLoading"
        class="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity"
        :class="isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'"
        style="background: var(--accent-primary)"
      >
        {{ isLoading ? '註冊中...' : '註冊' }}
      </button>
    </form>

    <template #footer>
      <span style="color: var(--ink)">已有帳號？</span>
      <RouterLink
        data-testid="auth-register-alt-link"
        to="/login"
        class="ml-1 font-medium"
        style="color: var(--accent-primary)"
      >
        登入
      </RouterLink>
    </template>
  </AuthFormLayout>
</template>
