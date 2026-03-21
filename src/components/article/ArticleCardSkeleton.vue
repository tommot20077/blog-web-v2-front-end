<template>
  <div
    class="flex flex-col rounded-[24px] border overflow-hidden w-full"
    style="background: var(--glass-panel); border-color: var(--glass-border); backdrop-filter: blur(12px);"
  >
    <div class="animate-pulse">
      <!-- 封面圖骨架 -->
      <div
        data-testid="skeleton-cover"
        class="w-full aspect-video rounded-t-[24px]"
        style="background-color: var(--skeleton-base);"
      />

      <div class="p-6 space-y-4">
        <!-- 標題骨架 -->
        <div
          data-testid="skeleton-line"
          class="rounded-md"
          style="width: 80%; height: 1.25rem; background-color: var(--skeleton-base);"
        />

        <!-- 作者·日期骨架 -->
        <div class="flex items-center gap-3">
          <div
            data-testid="skeleton-line"
            class="rounded-md"
            style="width: 4rem; height: 0.75rem; background-color: var(--skeleton-base);"
          />
          <div
            data-testid="skeleton-line"
            class="rounded-md"
            style="width: 5rem; height: 0.75rem; background-color: var(--skeleton-base);"
          />
        </div>

        <!-- 摘要骨架（3 行） -->
        <div class="space-y-2">
          <div
            data-testid="skeleton-line"
            class="rounded-md"
            style="width: 100%; height: 0.875rem; background-color: var(--skeleton-base);"
          />
          <div
            data-testid="skeleton-line"
            class="rounded-md"
            style="width: 100%; height: 0.875rem; background-color: var(--skeleton-base);"
          />
          <div
            data-testid="skeleton-line"
            class="rounded-md"
            style="width: 60%; height: 0.875rem; background-color: var(--skeleton-base);"
          />
        </div>

        <!-- 標籤骨架 -->
        <div class="flex gap-2 pt-2">
          <div
            data-testid="skeleton-tag"
            class="rounded-full"
            style="width: 4rem; height: 1.5rem; background-color: var(--skeleton-base);"
          />
          <div
            data-testid="skeleton-tag"
            class="rounded-full"
            style="width: 5rem; height: 1.5rem; background-color: var(--skeleton-base);"
          />
          <div
            data-testid="skeleton-tag"
            class="rounded-full"
            style="width: 3.5rem; height: 1.5rem; background-color: var(--skeleton-base);"
          />
        </div>
      </div>
    </div>
  </div>
</template>
