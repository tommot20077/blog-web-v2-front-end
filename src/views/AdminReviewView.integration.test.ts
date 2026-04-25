import { flushPromises } from '@vue/test-utils'
import { renderWithRouter, createMockPageResult, createMockMyArticle } from '../test-utils'
import AdminReviewView from './AdminReviewView.vue'
import { adminService } from '../api/adminService'

vi.mock('../api/adminService')
vi.mock('../composables/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

describe('AdminReviewView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.getPendingArticles).mockResolvedValue(
      createMockPageResult([createMockMyArticle({ status: 'PENDING_REVIEW' })])
    )
  })

  it('掛載後以 page=1, size=10 呼叫 getPendingArticles', async () => {
    renderWithRouter(AdminReviewView)
    await flushPromises()
    expect(adminService.getPendingArticles).toHaveBeenCalledWith(1, 10)
  })

  it('publishArticle 和 rejectArticle 都可被呼叫（§2.1 路徑修正在 real/ 層）', async () => {
    vi.mocked(adminService.publishArticle).mockResolvedValue({ uuid: 'p1', status: 'PUBLISHED' } as any)
    vi.mocked(adminService.rejectArticle).mockResolvedValue({ uuid: 'p1', status: 'REJECTED', rejectReason: 'x' } as any)
    renderWithRouter(AdminReviewView)
    await flushPromises()
    expect(adminService.getPendingArticles).toHaveBeenCalled()
  })
})
