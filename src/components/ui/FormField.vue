<script setup lang="ts">
import { ref, computed, useId } from 'vue';

/** 用於 label-input 關聯的唯一 ID */
const inputId = useId();

const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    type?: string;
    error?: string | null;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    type: 'text',
    error: null,
    placeholder: '',
    disabled: false,
  },
);

defineEmits<{
  'update:modelValue': [value: string];
}>();

defineOptions({ inheritAttrs: false });

/** 密碼可見狀態 */
const passwordVisible = ref(false);

/** 實際渲染的 input type */
const inputType = computed(() => {
  if (props.type === 'password') {
    return passwordVisible.value ? 'text' : 'password';
  }
  return props.type;
});

/** 是否為密碼欄位 */
const isPassword = computed(() => props.type === 'password');
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="inputId"
      class="text-sm font-medium"
      style="color: var(--ink)"
    >
      {{ label }}
    </label>

    <div class="relative">
      <input
        v-bind="$attrs"
        :id="inputId"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors"
        :class="error ? 'border-red-500' : ''"
        :style="{
          background: 'var(--glass)',
          borderColor: error ? undefined : 'var(--glass-border)',
          color: 'var(--ink)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />

      <button
        v-if="isPassword"
        data-testid="password-toggle"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
        style="color: var(--ink)"
        @click="passwordVisible = !passwordVisible"
      >
        <!-- 眼睛圖示：顯示 / 隱藏 -->
        <svg
          v-if="!passwordVisible"
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        </svg>
      </button>
    </div>

    <p
      v-if="error"
      data-testid="form-field-error"
      class="text-xs text-red-500"
    >
      {{ error }}
    </p>
  </div>
</template>
