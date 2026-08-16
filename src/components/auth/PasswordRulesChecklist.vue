<script setup lang="ts">
import { computed } from 'vue';
import { getPasswordRules } from '../../composables/useFormValidation';

const props = defineProps<{
  password: string;
}>();

const rules = computed(() => getPasswordRules(props.password));

/**
 * B2「完成即淡出」：反轉注意力，已達成的規則淡出降級，
 * 讓眼睛只停在還沒做到的項目上。
 */
const ruleList = computed(() => [
  { key: 'length', text: '長度 8-50 字元', met: rules.value.length },
  { key: 'lowercase', text: '包含小寫字母', met: rules.value.lowercase },
  { key: 'uppercase', text: '包含大寫字母', met: rules.value.uppercase },
  { key: 'digit', text: '包含數字', met: rules.value.digit },
  { key: 'special', text: '包含特殊字元（@$!%*?&#）', met: rules.value.special },
]);
</script>

<template>
  <ul
    data-testid="password-rules"
    class="rules-b2"
  >
    <li
      v-for="rule in ruleList"
      :key="rule.key"
      :data-testid="`rule-${rule.key}`"
      :data-met="String(rule.met)"
      :class="{ met: rule.met }"
    >
      <span class="bullet" />
      <span>{{ rule.text }}</span>
    </li>
  </ul>
</template>

<style scoped>
.rules-b2 {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 9px;
}

.rules-b2 li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: var(--ink);
  transition:
    color 0.4s var(--ease),
    opacity 0.4s var(--ease),
    font-size 0.4s var(--ease);
}

.rules-b2 li .bullet {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--ink);
  flex: none;
  transition:
    background 0.4s var(--ease),
    transform 0.4s var(--ease);
}

.rules-b2 li.met {
  color: var(--muted-2);
  opacity: 0.5;
  font-size: 12.5px;
  text-decoration: line-through;
  text-decoration-color: var(--muted-2);
  text-decoration-thickness: 1px;
}

.rules-b2 li.met .bullet {
  background: var(--ok);
  transform: scale(0.7);
}
</style>
