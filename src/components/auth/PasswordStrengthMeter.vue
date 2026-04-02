<script setup lang="ts">
import { computed } from 'vue';

type PasswordStrength = 'weak' | 'medium' | 'strong' | null;

const props = defineProps<{
  strength: PasswordStrength;
}>();

/** 各強度對應的顏色 class */
const colorMap: Record<NonNullable<PasswordStrength>, string> = {
  weak: 'bg-red-500',
  medium: 'bg-orange-400',
  strong: 'bg-green-500',
};

/** 各強度對應的寬度百分比 */
const widthMap: Record<NonNullable<PasswordStrength>, string> = {
  weak: '33%',
  medium: '66%',
  strong: '100%',
};

/** 各強度對應的中文標籤 */
const labelMap: Record<NonNullable<PasswordStrength>, string> = {
  weak: '弱',
  medium: '中等',
  strong: '強',
};

const barColor = computed(() => (props.strength ? colorMap[props.strength] : ''));
const barWidth = computed(() => (props.strength ? widthMap[props.strength] : '0%'));
const strengthLabel = computed(() => (props.strength ? labelMap[props.strength] : ''));
</script>

<template>
  <div
    v-if="strength"
    data-testid="password-strength"
    class="flex flex-col gap-1"
  >
    <!-- 進度條背景 -->
    <div class="h-1.5 w-full rounded-full bg-gray-200/30">
      <div
        data-testid="strength-bar"
        class="h-full rounded-full transition-all duration-300"
        :class="barColor"
        :style="{ width: barWidth }"
      />
    </div>

    <!-- 標籤文字 -->
    <span
      data-testid="strength-label"
      class="text-xs"
      style="color: var(--text-main)"
    >
      {{ strengthLabel }}
    </span>
  </div>
</template>
