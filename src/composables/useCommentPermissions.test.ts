import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCommentPermissions } from './useCommentPermissions'
import { useAuthStore } from '../stores/auth'
import type { CommentItem } from '../types/comment'

function buildComment(overrides: Partial<CommentItem> = {}): CommentItem {
  return {
    uuid: 'c1',
    parentUuid: null,
    content: 'hi',
    contentHtml: '<p>hi</p>',
    author: { uuid: 'u1', nickname: 'A', avatarUrl: null },
    likeCount: 0,
    liked: false,
    createdAt: new Date().toISOString(),
    editedAt: null,
    deleted: false,
    deletedByRole: null,
    ...overrides,
  }
}

describe('useCommentPermissions', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('owner within window → canEdit true', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'
    const { canEdit } = useCommentPermissions()
    expect(canEdit(buildComment())).toBe(true)
  })

  it('owner past window → canEdit false', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { canEdit } = useCommentPermissions()
    expect(canEdit(buildComment({ createdAt: tenMinAgo }))).toBe(false)
  })

  it('admin past window → canEdit true', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'ADMIN', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { canEdit } = useCommentPermissions()
    expect(canEdit(buildComment({ createdAt: tenMinAgo }))).toBe(true)
  })

  it('non-owner → canEdit false', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'other', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'
    const { canEdit } = useCommentPermissions()
    expect(canEdit(buildComment())).toBe(false)
  })

  it('admin → canDelete 任意非 deleted comment', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'admin', email: '', nickname: '', avatarUrl: null,
      role: 'ADMIN', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'
    const { canDelete } = useCommentPermissions()
    expect(canDelete(buildComment())).toBe(true)
    expect(canDelete(buildComment({ deleted: true }))).toBe(false)
  })

  it('canReply: 已登入 + 非 reply + 非 deleted → true', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'
    const { canReply } = useCommentPermissions()
    expect(canReply(buildComment())).toBe(true)
    expect(canReply(buildComment({ parentUuid: 'p1' }))).toBe(false)
    expect(canReply(buildComment({ deleted: true }))).toBe(false)
  })

  it('canReply: 未登入 → false', () => {
    const auth = useAuthStore()
    auth.user = null
    auth.accessToken = null
    const { canReply } = useCommentPermissions()
    expect(canReply(buildComment())).toBe(false)
  })
})
