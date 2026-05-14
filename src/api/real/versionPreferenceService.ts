import apiClient from '../apiClient'

export interface PreferenceField<T> {
  value: T
  source: string
}

export interface VersionPreferenceConfig {
  enabled?: PreferenceField<boolean>
  retain?: PreferenceField<number>
  intervalSeconds?: PreferenceField<number>
  diffChars?: PreferenceField<number>
}

export interface UpdateVersionPreferenceRequest {
  enabled?: boolean
  retain?: number
  intervalSeconds?: number
  diffChars?: number
}

export const versionPreferenceService = {
  async get(): Promise<VersionPreferenceConfig> {
    return apiClient.get<unknown, VersionPreferenceConfig>('/api/v1/me/preferences/version')
  },

  async update(request: UpdateVersionPreferenceRequest): Promise<VersionPreferenceConfig> {
    return apiClient.put<unknown, VersionPreferenceConfig>(
      '/api/v1/me/preferences/version',
      request,
    )
  },

  async reset(key: string): Promise<VersionPreferenceConfig> {
    return apiClient.delete<unknown, VersionPreferenceConfig>(
      `/api/v1/me/preferences/version/${key}`,
    )
  },
}
