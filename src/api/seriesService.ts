export type { SeriesSummary, ListSeriesRequest } from './real/seriesService'
import type { ListSeriesRequest, SeriesSummary } from './real/seriesService'
import type { BackendPageResult } from './utils'

// mock / real facade。mock 模式（VITE_USE_MOCK=true，含 e2e mock）走 seriesMockService，
// 其餘走真實 /api/v1/series。對齊 tagService / recommendService 的 facade 模式。
export const seriesService = {
  async list(params: ListSeriesRequest = {}): Promise<BackendPageResult<SeriesSummary>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { seriesService: svc } = await import('./mock/seriesService')
      return svc.list(params)
    }
    const { seriesService: svc } = await import('./real/seriesService')
    return svc.list(params)
  },
}
