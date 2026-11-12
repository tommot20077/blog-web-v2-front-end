<script setup lang="ts">
import { computed } from 'vue';

type PasswordStrength = 'weak' | 'medium' | 'strong' | null;

const props = defineProps<{
  strength: PasswordStrength;
}>();

/** C1「三分段」：各強度對應的中文標籤、點亮段數與顏色 */
const STRENGTH_INFO: Record<NonNullable<PasswordStrength>, { label: string; segs: number; color: string }> = {
  weak: { label: '弱', segs: 1, color: '#b4453c' },
  medium: { label: '中等', segs: 2, color: '#c08a3e' },
  strong: { label: '強', segs: 3, color: 'var(--ok)' },
};

const info = computed(() => (props.strength ? STRENGTH_INFO[props.strength] : null));

/** 第 index 段（0-based）在目前強度下是否點亮 */
function segColor(index: number): string {
  const current = info.value;
  if (!current) return 'var(--border)';
  return index < current.segs ? current.color : 'var(--border)';
}
</script>

<template>
  <div
    v-if="strength"
    data-testid="password-strength"
    class="meter-c1"
  >
    <div class="meter-c1__row">
      <span class="meter-c1__label">強度</span>
      <span
        data-testid="strength-label"
        class="meter-c1__val"
        :style="{ color: info?.color }"
      >{{ info?.label }}</span>
    </div>
    <div class="meter-c1__track">
      <!--
        strength-bar 保留給第一段：只要 strength 為真值就必定點亮（weak 起跳也是 1 段），
        因此永遠是「實際可見」的代表元素，供 E2E 斷言 height/背景非透明。
      -->
      <i
        data-testid="strength-bar"
        class="meter-c1__seg"
        :style="{ background: segColor(0) }"
      />
      <i
        class="meter-c1__seg"
        :style="{ background: segColor(1) }"
      />
      <i
        class="meter-c1__seg"
        :style="{ background: segColor(2) }"
      />
    </div>
  </div>
</template>

<style scoped>
.meter-c1 {
  margin-top: 0;
  width: 100%;
}

.meter-c1__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
}

.meter-c1__label {
  font-family: var(--f-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.meter-c1__val {
  font-family: var(--f-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transition: color 0.35s var(--ease);
}

.meter-c1__track {
  display: flex;
  gap: 5px;
}

.meter-c1__seg {
  display: block;
  height: 3px;
  flex: 1;
  border-radius: 999px;
  background: var(--border);
  transition: background 0.4s var(--ease);
}
</style>
