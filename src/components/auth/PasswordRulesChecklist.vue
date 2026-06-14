<script setup lang="ts">
import { computed } from 'vue';
import { getPasswordRules } from '../../composables/useFormValidation';

const props = defineProps<{
  password: string;
}>();

const rules = computed(() => getPasswordRules(props.password));
</script>

<template>
  <ul
    data-testid="password-rules"
    class="flex flex-col gap-1 mt-2 text-xs"
    style="color: var(--ink)"
  >
    <li
      data-testid="rule-length"
      :data-met="String(rules.length)"
      class="flex items-center gap-2"
      :class="rules.length ? 'text-green-500' : 'text-gray-400'"
    >
      <span>{{ rules.length ? '✓' : '✗' }}</span>
      <span>長度 8-50 字元</span>
    </li>
    <li
      data-testid="rule-lowercase"
      :data-met="String(rules.lowercase)"
      class="flex items-center gap-2"
      :class="rules.lowercase ? 'text-green-500' : 'text-gray-400'"
    >
      <span>{{ rules.lowercase ? '✓' : '✗' }}</span>
      <span>包含小寫字母</span>
    </li>
    <li
      data-testid="rule-uppercase"
      :data-met="String(rules.uppercase)"
      class="flex items-center gap-2"
      :class="rules.uppercase ? 'text-green-500' : 'text-gray-400'"
    >
      <span>{{ rules.uppercase ? '✓' : '✗' }}</span>
      <span>包含大寫字母</span>
    </li>
    <li
      data-testid="rule-digit"
      :data-met="String(rules.digit)"
      class="flex items-center gap-2"
      :class="rules.digit ? 'text-green-500' : 'text-gray-400'"
    >
      <span>{{ rules.digit ? '✓' : '✗' }}</span>
      <span>包含數字</span>
    </li>
    <li
      data-testid="rule-special"
      :data-met="String(rules.special)"
      class="flex items-center gap-2"
      :class="rules.special ? 'text-green-500' : 'text-gray-400'"
    >
      <span>{{ rules.special ? '✓' : '✗' }}</span>
      <span>包含特殊字元（@$!%*?&#）</span>
    </li>
  </ul>
</template>
