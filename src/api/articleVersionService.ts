export type {
  VersionType,
  VersionSummaryResponse,
  VersionDetailResponse,
  VersionPageResponse,
  ListArticleVersionsParams,
  CreateManualVersionRequest,
} from './real/articleVersionService'
import type { ListArticleVersionsParams, VersionPageResponse } from './real/articleVersionService'

// mock / real facade。mock 模式（VITE_USE_MOCK=true，含 e2e mock）走 articleVersionMockService，
// 其餘走真實 /api/v1/articles/{articleUuid}/versions。對齊 fileService / seriesService 的 facade 模式。
//
// 這裡只 facade 目前有畫面消費者的 list / restore；其餘四個方法（getDetail / createManual /
// delete / promote）尚無任何頁面使用（見 pending.md「契約快照待重抓：version / series DTO」），
// 等有消費者時再連同 mock 一起補，避免留下沒有測試守護、也無人驗證過的死路徑。
export const articleVersionService = {
  async list(
    articleUuid: string,
    params: ListArticleVersionsParams = {},
  ): Promise<VersionPageResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { articleVersionService: svc } = await import('./mock/articleVersionService')
      return svc.list(articleUuid, params)
    }
    const { articleVersionService: svc } = await import('./real/articleVersionService')
    return svc.list(articleUuid, params)
  },

  async restore(articleUuid: string, versionUuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { articleVersionService: svc } = await import('./mock/articleVersionService')
      return svc.restore(articleUuid, versionUuid)
    }
    const { articleVersionService: svc } = await import('./real/articleVersionService')
    return svc.restore(articleUuid, versionUuid)
  },
}
