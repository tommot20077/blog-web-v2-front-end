import apiClient from './apiClient'
import type { QuotaInfo } from '../types/editor'

const DEFAULT_QUOTA: QuotaInfo = { usedBytes: 0, limitBytes: 104_857_600, remainingBytes: 104_857_600 }

export const quotaService = {
  async getQuota(): Promise<QuotaInfo> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getQuotaMock } = await import('./mock/quotaMockService')
      return getQuotaMock()
    }
    try {
      return await apiClient.get<unknown, QuotaInfo>('/api/v1/users/me/quota')
    } catch (error) {
      console.error('Failed to fetch quota:', error)
      return { ...DEFAULT_QUOTA }
    }
  },
}
