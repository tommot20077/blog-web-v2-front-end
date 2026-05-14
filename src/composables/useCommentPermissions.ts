import { useAuthStore } from '../stores/auth'
import type { CommentItem } from '../types/comment'

const EDIT_WINDOW_MS = 5 * 60 * 1000

export function useCommentPermissions() {
  const authStore = useAuthStore()

  function canEdit(comment: CommentItem): boolean {
    if (comment.deleted) return false
    const isOwner = comment.author?.uuid === authStore.user?.uuid
    if (!isOwner) return false
    if (authStore.isAdmin) return true
    return Date.now() - new Date(comment.createdAt).getTime() < EDIT_WINDOW_MS
  }

  function canDelete(comment: CommentItem): boolean {
    if (comment.deleted) return false
    const isOwner = comment.author?.uuid === authStore.user?.uuid
    return isOwner || authStore.isAdmin
  }

  function canReply(comment: CommentItem): boolean {
    return authStore.isAuthenticated && !comment.parentUuid && !comment.deleted
  }

  return { canEdit, canDelete, canReply }
}
