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
      data-testid="rule-letter"
      :data-met="String(rules.letter)"
      class="flex items-center gap-2"
      :class="rules.letter ? 'text-green-500' : 'text-gray-400'"
    >
      <span>{{ rules.letter ? '✓' : '✗' }}</span>
      <span>包含英文字母</span>
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
  </ul>
</template>
