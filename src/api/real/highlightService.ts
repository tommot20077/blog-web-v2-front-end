import apiClient from '../apiClient'

export interface Highlight {
  uuid: string
  snippet: string
  prefix?: string
  suffix?: string
  color: string
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateHighlightRequest {
  snippet: string
  prefix?: string
  suffix?: string
  color: string
  note?: string | null
}

export interface UpdateHighlightRequest {
  color?: string
  note?: string
}

export const highlightService = {
  async list(articleUuid: string): Promise<Highlight[]> {
    return apiClient.get<unknown, Highlight[]>(`/api/v1/articles/${articleUuid}/highlights`)
  },

  async create(articleUuid: string, request: CreateHighlightRequest): Promise<Highlight> {
    return apiClient.post<unknown, Highlight>(`/api/v1/articles/${articleUuid}/highlights`, request)
  },

  async update(uuid: string, request: UpdateHighlightRequest): Promise<Highlight> {
    const payload = { ...request }
    if (payload.note === null) {
      delete payload.note
    }
    return apiClient.put<unknown, Highlight>(`/api/v1/highlights/${uuid}`, payload)
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/api/v1/highlights/${uuid}`)
  },
}
