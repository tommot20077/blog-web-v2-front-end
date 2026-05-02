<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CommentItem as CommentItemType } from '../../types/comment'
import { useCommentLike } from '../../composables/useCommentLike'
import { useCommentPermissions } from '../../composables/useCommentPermissions'
import CommentForm from './CommentForm.vue'

const props = defineProps<{
  comment: CommentItemType
}>()

const emit = defineEmits<{
  reply: [parentUuid: string, content: string]
  edit: [uuid: string, content: string]
  delete: [uuid: string]
}>()

const commentUuid = computed(() => props.comment.uuid)
const { liked, likeCount, isPending, toggle } = useCommentLike(
  commentUuid,
  { liked: props.comment.liked, likeCount: props.comment.likeCount },
)

const { canEdit, canDelete, canReply } = useCommentPermissions()

const showReplyForm = ref(false)
const isEditing = ref(false)

async function onReplySubmit(content: string) {
  emit('reply', props.comment.uuid, content)
  showReplyForm.value = false
}

async function onEditSubmit(content: string) {
  emit('edit', props.comment.uuid, content)
  isEditing.value = false
}

function onDelete() {
  if (!window.confirm('確定刪除此留言？此操作無法復原。')) return
  emit('delete', props.comment.uuid)
}

const deletedLabel = computed(() => {
  if (props.comment.deletedByRole === 'AUTHOR') return '作者'
  if (props.comment.deletedByRole === 'ADMIN') return 'admin'
  return 'unknown'
})

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <article
    class="cm-item"
    data-testid="comment-item"
    :data-comment-uuid="comment.uuid"
  >
    <div class="av" aria-hidden="true" />
    <div class="body">
      <div class="who">
        <b>{{ comment.deleted ? '[已刪除]' : comment.author?.nickname }}</b>
        <span class="when">{{ formatTime(comment.createdAt) }}</span>
        <span v-if="comment.editedAt" class="edited">(edited)</span>
      </div>

      <div v-if="comment.deleted" class="tombstone">
        此留言已被{{ deletedLabel }}刪除
      </div>

      <template v-else>
        <CommentForm
          v-if="isEditing"
          data-testid="comment-edit-form"
          :initial-content="comment.content"
          submit-label="Save"
          :show-cancel="true"
          @submit="onEditSubmit"
          @cancel="isEditing = false"
        />
        <div v-else class="content" v-html="comment.contentHtml" />

        <div v-if="!isEditing" class="actions">
          <button
            class="like"
            data-testid="comment-like-btn"
            :disabled="isPending"
            @click="toggle"
          >
            <span aria-hidden="true">{{ liked ? '♥' : '♡' }}</span>
            <span data-testid="comment-like-count">{{ likeCount }}</span>
          </button>

          <button
            v-if="canReply(comment)"
            class="reply"
            data-testid="comment-reply-btn"
            @click="showReplyForm = !showReplyForm"
          >Reply</button>

          <button
            v-if="canEdit(comment)"
            class="edit"
            data-testid="comment-edit-btn"
            @click="isEditing = true"
          >Edit</button>

          <button
            v-if="canDelete(comment)"
            class="delete"
            data-testid="comment-delete-btn"
            @click="onDelete"
          >Delete</button>
        </div>

        <CommentForm
          v-if="showReplyForm"
          data-testid="comment-reply-form"
          submit-label="Reply"
          :show-cancel="true"
          @submit="onReplySubmit"
          @cancel="showReplyForm = false"
        />
      </template>

      <div v-if="comment.replies?.length" class="replies">
        <CommentItem
          v-for="r in comment.replies"
          :key="r.uuid"
          :comment="r"
          @reply="(uuid, content) => emit('reply', uuid, content)"
          @edit="(uuid, content) => emit('edit', uuid, content)"
          @delete="uuid => emit('delete', uuid)"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.cm-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--divider, rgba(0,0,0,0.06));
}
.av {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-sub, #ededed);
  flex-shrink: 0;
}
.body {
  flex: 1;
}
.who {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 14px;
}
.who b {
  color: var(--ink, #0a0a0b);
}
.when {
  color: var(--muted-2, #9a9aa0);
  font-size: 12px;
}
.edited {
  color: var(--muted-2, #9a9aa0);
  font-size: 11px;
  font-style: italic;
}
.content {
  margin: 8px 0;
  line-height: 1.6;
}
.tombstone {
  margin: 8px 0;
  color: var(--muted, #6b6b70);
  font-style: italic;
}
.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
}
.actions button {
  padding: 4px 8px;
  border: 1px solid var(--border, rgba(0,0,0,0.1));
  border-radius: 999px;
  background: var(--surface, #fbfbfb);
  cursor: pointer;
}
.actions button:hover:not(:disabled) {
  background: var(--bg-sub, #ededed);
}
.actions button.like {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.delete {
  color: #e15554;
}
.replies {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid var(--divider, rgba(0,0,0,0.06));
}
</style>
