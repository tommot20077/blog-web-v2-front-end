import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CommentItem from './CommentItem.vue'
import type { CommentItem as CommentItemType } from '../../types/comment'

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
  createdAt: '2026-05-01T10:00:00Z',
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
})
