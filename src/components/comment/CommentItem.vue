<script setup lang="ts">
import { computed, ref } from 'vue'
import { createHtmlSanitizer } from '../../utils/htmlSanitizer'
import type { CommentItem as CommentItemType } from '../../types/comment'
import { useCommentLike } from '../../composables/useCommentLike'
import { useCommentPermissions } from '../../composables/useCommentPermissions'
import CommentForm from './CommentForm.vue'
import AuthorName from '../author/AuthorName.vue'

const props = defineProps<{
  comment: CommentItemType
  /** 「載入更多回覆」請求進行中（僅頂層留言使用） */
  replyLoading?: boolean
  /** 上一次載入回覆失敗（僅頂層留言使用） */
  replyError?: boolean
}>()

const emit = defineEmits<{
  reply: [parentUuid: string, content: string]
  edit: [uuid: string, content: string]
  delete: [uuid: string]
  loadMoreReplies: [parentUuid: string]
}>()

// 後端只內嵌前 3 則回覆；replyCount（未刪除總數）> 已帶的 replies 數 → 還有更多
const remainingReplies = computed(
  () => (props.comment.replyCount ?? 0) - (props.comment.replies?.length ?? 0),
)

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

// 防 XSS：backend 已用 OWASP HtmlSanitizer 過濾，前端再 DOMPurify 多一層；mock 走同 path
// 使用收緊設定的獨立實例：禁 style 元素 / style 屬性 / form / iframe / 非 checkbox input（留言不需要 Shiki 例外）
const commentSanitizer = createHtmlSanitizer()
const sanitizedHtml = computed(() => commentSanitizer.sanitize(props.comment.contentHtml ?? ''))

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
        <b>
          <template v-if="comment.deleted">[已刪除]</template>
          <AuthorName v-else-if="comment.author" :uuid="comment.author.uuid" :nickname="comment.author.nickname" />
        </b>
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
          aria-label="編輯留言"
          submit-label="Save"
          :show-cancel="true"
          @submit="onEditSubmit"
          @cancel="isEditing = false"
        />
        <div v-else class="content" v-html="sanitizedHtml" />

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
          aria-label="回覆留言"
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

      <div v-if="remainingReplies > 0" class="replies-more">
        <span
          v-if="replyError"
          class="replies-error"
          role="alert"
          data-testid="comment-replies-error"
        >回覆載入失敗</span>
        <button
          type="button"
          class="replies-more-btn"
          data-testid="comment-replies-load-more"
          :disabled="replyLoading"
          @click="emit('loadMoreReplies', comment.uuid)"
        >{{ replyLoading ? '載入中…' : replyError ? '重試' : `載入更多回覆（剩 ${remainingReplies} 則）` }}</button>
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
  color: var(--muted, #6b6b70);
  font-size: 12px;
}
.edited {
  color: var(--muted, #6b6b70);
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
.replies-more {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-left: 16px;
  font-size: 12px;
}
.replies-more-btn {
  padding: 4px 10px;
  border: 1px solid var(--border, rgba(0,0,0,0.1));
  border-radius: 999px;
  background: var(--surface, #fbfbfb);
  cursor: pointer;
}
.replies-more-btn:hover:not(:disabled) {
  background: var(--bg-sub, #ededed);
}
.replies-more-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}
.replies-error {
  color: #e15554;
}
</style>
