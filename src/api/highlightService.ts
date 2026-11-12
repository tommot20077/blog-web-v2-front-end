import type {
  CreateHighlightRequest,
  Highlight,
  UpdateHighlightRequest,
} from './real/highlightService'

export type { CreateHighlightRequest, Highlight, UpdateHighlightRequest }

export interface HighlightService {
  list(articleUuid: string): Promise<Highlight[]>
  create(articleUuid: string, request: CreateHighlightRequest): Promise<Highlight>
  update(uuid: string, request: UpdateHighlightRequest): Promise<Highlight>
  delete(uuid: string): Promise<void>
}

export const highlightService: HighlightService = {
  async list(articleUuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { highlightService: svc } = await import('./mock/highlightService')
      return svc.list(articleUuid)
    }
    const { highlightService: svc } = await import('./real/highlightService')
    return svc.list(articleUuid)
  },

  async create(articleUuid, request) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { highlightService: svc } = await import('./mock/highlightService')
      return svc.create(articleUuid, request)
    }
    const { highlightService: svc } = await import('./real/highlightService')
    return svc.create(articleUuid, request)
  },

  async update(uuid, request) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { highlightService: svc } = await import('./mock/highlightService')
      return svc.update(uuid, request)
    }
    const { highlightService: svc } = await import('./real/highlightService')
    return svc.update(uuid, request)
  },

  async delete(uuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { highlightService: svc } = await import('./mock/highlightService')
      return svc.delete(uuid)
    }
    const { highlightService: svc } = await import('./real/highlightService')
    return svc.delete(uuid)
  },
}
