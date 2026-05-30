import { useArticleDetail } from './useArticleDetail'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { articleService } from '../api/articleService'
import { createMockArticleDetail } from '../test-utils'

vi.mock('../api/articleService', () => ({
  articleService: {
    getArticleByUuid: vi.fn(),
  },
}))

function mountHarness(uuid = 'test-uuid') {
  const Wrapper = defineComponent({
    setup() {
      return useArticleDetail(uuid)
    },
    template: '<div />',
  })

  return mount(Wrapper)
}

describe('useArticleDetail', () => {
  it('初始 isLoading 為 true', () => {
    vi.mocked(articleService.getArticleByUuid).mockReturnValue(new Promise(() => {}))

    const wrapper = mountHarness('test-uuid')

    expect(wrapper.vm.isLoading).toBe(true)
  })

  it('fetchArticle 成功後 article 有值、isLoading 為 false', async () => {
    const mockArticle = createMockArticleDetail({ uuid: 'test-uuid', title: '測試文章' })
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

    const wrapper = mountHarness('test-uuid')

    await flushPromises()

    expect(wrapper.vm.article).toEqual(mockArticle)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('API 回傳 null 時 article 為 null、isLoading 為 false', async () => {
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(null)

    const wrapper = mountHarness('not-exist')

    await flushPromises()

    expect(wrapper.vm.article).toBeNull()
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('API 拋出例外時 article 為 null、isLoading 為 false，且 console.error 被呼叫', async () => {
    vi.mocked(articleService.getArticleByUuid).mockRejectedValue(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mountHarness('error-uuid')

    await flushPromises()

    expect(wrapper.vm.article).toBeNull()
    expect(wrapper.vm.isLoading).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Error loading article details', expect.any(Error))
    consoleSpy.mockRestore()
  })
})
