<script setup lang="ts">
/**
 * 作者名稱：有 uuid → 連到公開作者頁 /author/{uuid}；沒有（舊快取、資料來源不含 uuid）或已刪帳使用者 → 純文字。
 * 8 個作者入口共用。預設 slot 可覆寫顯示內容（例如搜尋高亮）。
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { isDeletedUserNickname } from '../../utils/deletedUser'

const props = defineProps<{
  uuid?: string | null
  nickname: string
}>()

// 已刪帳使用者仍帶 uuid，但作者頁會 404，故保留前綴暱稱一律純文字
const to = computed(() => (props.uuid && !isDeletedUserNickname(props.nickname) ? `/author/${encodeURIComponent(props.uuid)}` : null))
</script>

<template>
  <!-- .stop：作者名常放在整張可點擊的卡片內，點作者不能同時觸發卡片導向 -->
  <RouterLink v-if="to" :to="to" class="author-name author-name-link" @click.stop>
    <slot>{{ nickname }}</slot>
  </RouterLink>
  <span v-else class="author-name"><slot>{{ nickname }}</slot></span>
</template>

<style scoped>
.author-name-link { color: inherit; text-decoration: none; }
.author-name-link:hover,
.author-name-link:focus-visible { color: var(--accent); text-decoration: underline; }
</style>
