<script setup lang="ts">
import { useTheme } from '../../composables/useTheme';
import IconSun from '../common/icons/IconSun.vue';
import IconMoon from '../common/icons/IconMoon.vue';

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button 
    @click="toggleTheme"
    class="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
    aria-label="切換深淺色模式"
  >
    <div class="relative w-6 h-6 flex items-center justify-center pointer-events-none">
      <transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 rotate-[-90deg] scale-50" enter-to-class="opacity-100 rotate-0 scale-100" leave-active-class="transition-all duration-300 ease-in position-absolute" leave-from-class="opacity-100 rotate-0 scale-100" leave-to-class="opacity-0 rotate-90 scale-50">
        <IconMoon v-if="isDark" class="w-6 h-6 absolute" />
        <IconSun v-else class="w-6 h-6 absolute text-[#FF8D28]" />
      </transition>
    </div>
  </button>
</template>
