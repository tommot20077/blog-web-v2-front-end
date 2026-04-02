import type { QuotaInfo } from '../../types/editor'
import { mockQuota } from './data'

export function getQuotaMock(): Promise<QuotaInfo> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...mockQuota })
    }, 200)
  })
}
