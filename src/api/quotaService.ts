import type { QuotaInfo } from '../types/editor'

export const quotaService = {
  async getQuota(): Promise<QuotaInfo> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { quotaService: svc } = await import('./mock/quotaService')
      return svc.getQuota()
    }
    const { quotaService: svc } = await import('./real/quotaService')
    return svc.getQuota()
  },
}
