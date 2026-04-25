<script setup lang="ts">
import { ref, computed, useId } from 'vue'

const inputId = useId()

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string
    type?: string
    error?: string | null
    placeholder?: string
    disabled?: boolean
  }>(),
  { type: 'text', error: null, placeholder: '', disabled: false }
)

defineEmits<{ 'update:modelValue': [value: string] }>()
defineOptions({ inheritAttrs: false })

const passwordVisible = ref(false)
const inputType = computed(() => props.type === 'password' && passwordVisible.value ? 'text' : props.type)
const isPassword = computed(() => props.type === 'password')
</script>

<template>
  <div class="auth-field field">
    <label :for="inputId">{{ label }}</label>

    <div class="field-input-wrap">
      <input
        v-bind="$attrs"
        :id="inputId"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="{ 'field-error': error }"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />

      <button
        v-if="isPassword"
        data-testid="password-toggle"
        type="button"
        class="field-eye"
        @click="passwordVisible = !passwordVisible"
      >
        <svg v-if="!passwordVisible" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        </svg>
      </button>
    </div>

    <p v-if="error" data-testid="form-field-error" class="field-err-msg">{{ error }}</p>
  </div>
</template>

<style scoped>
.field { display: grid; gap: 8px; }
.field label {
  font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .18em;
  text-transform: uppercase; color: var(--muted);
}
.field-input-wrap { position: relative; }
.field input, .field-input-wrap input {
  width: 100%; background: transparent; border: 0;
  border-bottom: 1px solid var(--border-strong); padding: 12px 0;
  font: inherit; font-size: 17px; color: var(--ink); transition: border-color .25s;
}
.field input:focus, .field-input-wrap input:focus { outline: none; border-bottom-color: var(--accent); }
.field input.field-error { border-bottom-color: #ef4444; }
.field-eye {
  position: absolute; right: 0; top: 50%; transform: translateY(-50%);
  color: var(--muted); background: none; border: none; cursor: pointer; padding: 4px;
  transition: color .2s;
}
.field-eye:hover { color: var(--ink); }
.field-err-msg { font-size: 12px; color: #ef4444; }
</style>
