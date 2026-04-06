<script setup lang="ts">
// 無邏輯，純 UI 組件
</script>

<template>
  <div class="mt-20 w-full overflow-hidden whitespace-nowrap py-10 relative">
    <!-- 兩組文字以實現無縫跑馬燈，純裝飾，排除無障礙樹 -->
    <div class="flex animate-marquee min-w-max" aria-hidden="true">
      <div class="text-4xl sm:text-6xl lg:text-[10rem] font-black flex gap-12 italic tracking-widest uppercase opacity-[0.03] select-none" style="color: var(--text-main)">
        <span>Animated Text Effects</span>
        <span>Animated Text Effects</span>
        <span>Animated Text Effects</span>
        <span>Animated Text Effects</span>
      </div>
    </div>
  </div>
</template>


<style scoped>
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
  /* 讓寬度撐開，裝得下多個重複字串以實現 -50% 無縫連接 */
}
</style>
