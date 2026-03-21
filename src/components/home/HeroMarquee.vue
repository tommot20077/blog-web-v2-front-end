<script setup lang="ts">
// 無邏輯，純 UI 組件
</script>

<template>
  <div class="mt-20 w-full overflow-hidden whitespace-nowrap py-10 relative">
    <!-- 兩組文字以實現無縫跑馬燈 -->
    <div class="flex animate-marquee min-w-max">
      <h1 class="text-6xl md:text-[10rem] font-black flex gap-12 italic tracking-widest uppercase opacity-[0.03] select-none" style="color: var(--text-main)">
        <span>Animated Text Effects</span>
        <span>Animated Text Effects</span>
        <span>Animated Text Effects</span>
        <span>Animated Text Effects</span>
      </h1>
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
