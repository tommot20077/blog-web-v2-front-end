<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useComments } from '../../composables/useComments'
import CommentItem from '../comment/CommentItem.vue'
import CommentForm from '../comment/CommentForm.vue'

const props = defineProps<{ articleUuid: string }>()

const articleUuidRef = toRef(props, 'articleUuid')
const {
  list, totalCommentCount, totalTopLevels, page, size, isLoading,
  fetchPage, post, reply, edit, remove,
} = useComments(articleUuidRef)

const totalPages = computed(() => Math.max(1, Math.ceil(totalTopLevels.value / size)))

async function onSubmit(content: string) {
  await post(content)
}
async function onReply(parentUuid: string, content: string) {
  await reply(parentUuid, content)
}
async function onEdit(uuid: string, content: string) {
  await edit(uuid, content)
}
async function onDelete(uuid: string) {
  await remove(uuid)
}
</script>

<template>
  <section class="cm-block" data-testid="comment-section">
    <div class="cm-head">
      <h3>討論</h3>
      <span class="n" data-testid="comment-total-count">{{ totalCommentCount }} comments</span>
    </div>

    <CommentForm @submit="onSubmit" />

    <div v-if="isLoading" class="cm-loading">Loading...</div>
    <div v-else-if="list.length === 0" class="cm-empty">尚無留言。</div>
    <div v-else class="cm-list">
      <CommentItem
        v-for="c in list"
        :key="c.uuid"
        :comment="c"
        @reply="onReply"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>

    <div v-if="totalPages > 1" class="cm-pagination">
      <button :disabled="page <= 1" data-testid="comment-prev-page" @click="fetchPage(page - 1)">Prev</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" data-testid="comment-next-page" @click="fetchPage(page + 1)">Next</button>
    </div>
  </section>
</template>

<style scoped>
.cm-block {
  margin: 32px 0;
  padding: 24px 0;
  border-top: 2px solid var(--divider, rgba(0,0,0,0.08));
}
.cm-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.cm-head h3 {
  margin: 0;
  font-family: var(--f-display, sans-serif);
}
.cm-head .n {
  color: var(--muted, #6b6b70);
  font-size: 13px;
}
.cm-loading, .cm-empty {
  padding: 24px 0;
  color: var(--muted, #6b6b70);
  text-align: center;
}
.cm-pagination {
  display: flex;
  justify-content: center;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}
.cm-pagination button {
  padding: 4px 12px;
  border: 1px solid var(--border, rgba(0,0,0,0.15));
  border-radius: 4px;
  cursor: pointer;
}
.cm-pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
