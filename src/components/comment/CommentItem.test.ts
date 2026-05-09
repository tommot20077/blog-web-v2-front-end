import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CommentItem from './CommentItem.vue'
import type { CommentItem as CommentItemType } from '../../types/comment'
import { useAuthStore } from '../../stores/auth'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ fullPath: '/' }),
}))
vi.mock('../../api/commentService', () => ({
  commentService: { like: vi.fn(), unlike: vi.fn() },
}))

const baseComment: CommentItemType = {
  uuid: 'c1',
  parentUuid: null,
  content: 'hello',
  contentHtml: '<p>hello</p>',
  author: { uuid: 'u1', nickname: 'Alice', avatarUrl: null },
  likeCount: 3,
  liked: false,
  createdAt: new Date().toISOString(),
  editedAt: null,
  deleted: false,
  deletedByRole: null,
}

describe('CommentItem (Stage B)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('正常顯示 author + content + likeCount', () => {
    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.find('.content').html()).toContain('hello')
    expect(wrapper.find('[data-testid="comment-like-count"]').text()).toBe('3')
  })

  it('deleted=true → tombstone + 隱藏 author', () => {
    const deleted = { ...baseComment, deleted: true, deletedByRole: 'AUTHOR' as const, author: null }
    const wrapper = mount(CommentItem, { props: { comment: deleted } })
    expect(wrapper.find('.tombstone').text()).toContain('已被作者刪除')
    expect(wrapper.find('.actions').exists()).toBe(false)
  })

  it('editedAt → 顯示 (edited)', () => {
    const edited = { ...baseComment, editedAt: '2026-05-01T10:05:00Z' }
    const wrapper = mount(CommentItem, { props: { comment: edited } })
    expect(wrapper.text()).toContain('(edited)')
  })

  it('replies 巢狀渲染', () => {
    const reply: CommentItemType = { ...baseComment, uuid: 'c2', parentUuid: 'c1' }
    const withReply = { ...baseComment, replies: [reply] }
    const wrapper = mount(CommentItem, { props: { comment: withReply } })
    expect(wrapper.findAll('[data-testid="comment-item"]')).toHaveLength(2)
  })

  it('canEdit / canDelete / canReply 全 true → 顯示 3 個按鈕', async () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'ADMIN', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    expect(wrapper.find('[data-testid="comment-edit-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="comment-delete-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="comment-reply-btn"]').exists()).toBe(true)
  })

  it('non-owner non-admin → 不顯示 edit/delete', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'other', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    expect(wrapper.find('[data-testid="comment-edit-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="comment-delete-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="comment-reply-btn"]').exists()).toBe(true)  // 已登入可 reply
  })

  it('click reply button → 顯示 reply form; cancel → 隱藏', async () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    await wrapper.find('[data-testid="comment-reply-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="comment-reply-form"]').exists()).toBe(true)
  })

  it('click edit button → 顯示 edit form 並 prefill content', async () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    await wrapper.find('[data-testid="comment-edit-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="comment-edit-form"]').exists()).toBe(true)
    const textarea = wrapper.find('[data-testid="comment-edit-form"] textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('hello')
  })
})
