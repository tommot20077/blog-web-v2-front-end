<script setup lang="ts">
import NavigationBar from './components/layout/NavigationBar.vue'
</script>

<template>
  <div class="min-h-screen relative font-sans flex flex-col">
    <!-- 導覽列 -->
    <NavigationBar />
    
    <!-- 路由視圖出口 -->
    <div class="flex-1 w-full flex flex-col relative">
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <div :key="route.path" class="w-full flex-1 flex flex-col">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
