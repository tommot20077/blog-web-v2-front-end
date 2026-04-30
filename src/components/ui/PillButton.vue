<script setup lang="ts">
withDefaults(
  defineProps<{
    isActive?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
    variant?: 'pill' | 'tab'
  }>(),
  {
    isActive: false,
    disabled: false,
    size: 'md',
    variant: 'pill',
  },
)

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    :disabled="disabled"
    @click="!disabled && $emit('click', $event)"
    class="transition-all duration-300 font-medium"
    :class="[
      // size
      size === 'sm'
        ? 'w-8 h-8 rounded-full flex items-center justify-center'
        : 'px-5 py-2 rounded-full text-sm whitespace-nowrap',
      // variant × active state
      variant === 'tab'
        ? (isActive
            ? 'text-[var(--accent)]'
            : 'text-[var(--ink)] opacity-80 hover:opacity-100')
        : (isActive
            ? 'bg-[var(--ink)] text-[var(--bg)] shadow-md'
            : 'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10'),
      // disabled
      disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer',
    ]"
  >
    <slot />
  </button>
</template>
